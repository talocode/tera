import { useEffect, useState } from "react";
import { Link } from "@/nav";
import { Button, Card, DesktopNav, Field, Frame, Notice } from "@/components/wallet/chrome";
import { useWalletReady } from "@/components/wallet/use-wallet-ready";
import { formatTokenAmount } from "@/wallet/amounts";
import { connectionFor, loadHoldings, type Holding } from "@/wallet/chain";
import {
  SOL_MINT,
  TCODE_MINT,
  fetchQuote,
  parseSwapAmount,
  signAndSendSwap,
  type JupiterQuote,
} from "@/wallet/jupiter";
import { clusterLabel, explorerTx } from "@/wallet/network";
import { useWallet } from "@/wallet/store";

function jupMint(holding: Holding): string {
  return holding.native ? SOL_MINT : holding.mint;
}

export function SwapScreen() {
  const { ready, keypair } = useWalletReady("unlocked");
  const cluster = useWallet((state) => state.cluster);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [inputMint, setInputMint] = useState("SOL");
  const [outputMint, setOutputMint] = useState(TCODE_MINT);
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<JupiterQuote | null>(null);
  const [phase, setPhase] = useState<"form" | "review" | "done" | "failed">("form");
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!keypair) return;
    void loadHoldings(connectionFor(cluster), keypair.publicKey, cluster)
      .then(setHoldings)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load balances."));
  }, [keypair, cluster]);

  const input = holdings.find((item) => item.mint === inputMint) ?? holdings.find((item) => item.native);
  const outputs = [
    { mint: SOL_MINT, symbol: "SOL", decimals: 9 },
    { mint: TCODE_MINT, symbol: "TCODE", decimals: 6 },
    ...holdings.filter((item) => !item.native && item.mint !== TCODE_MINT).map((item) => ({
      mint: item.mint,
      symbol: item.symbol,
      decimals: item.decimals,
    })),
  ];
  const output = outputs.find((item) => item.mint === outputMint) ?? outputs[0];

  async function review() {
    if (!input || !output) return;
    if (cluster !== "mainnet-beta") {
      setError("Jupiter swaps run on mainnet. Switch networks in Settings before you swap real tokens.");
      return;
    }
    const base = parseSwapAmount(amount, input.decimals);
    if (!base) return setError("Enter an amount greater than zero.");
    if (base > input.amount) return setError("That amount is larger than the balance in this wallet.");
    if (jupMint(input) === output.mint) return setError("Choose two different tokens.");
    setBusy(true);
    setError(null);
    try {
      const next = await fetchQuote({
        inputMint: jupMint(input),
        outputMint: output.mint,
        amount: base,
        slippageBps: 50,
      });
      setQuote(next);
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quote failed.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!keypair || !quote) return;
    setBusy(true);
    setError(null);
    try {
      const sig = await signAndSendSwap({
        connection: connectionFor(cluster),
        signer: keypair,
        quote,
      });
      setSignature(sig);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Swap failed.");
      setPhase("failed");
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !keypair) return <Frame title="Swap" nav />;
  return (
    <Frame nav title="Swap" subtitle="Jupiter quote. You sign locally. Tera never sees the phrase.">
      <DesktopNav />
      {phase === "form" ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void review();
          }}
        >
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-muted">From</span>
            <select
              value={input?.mint ?? inputMint}
              onChange={(event) => setInputMint(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-line bg-surface px-4"
            >
              {holdings.map((item) => (
                <option key={item.mint} value={item.mint}>
                  {item.symbol} · {formatTokenAmount(item.amount, item.decimals, 4)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-muted">To</span>
            <select
              value={output?.mint ?? outputMint}
              onChange={(event) => setOutputMint(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-line bg-surface px-4"
            >
              {outputs.map((item) => (
                <option key={item.mint} value={item.mint}>
                  {item.symbol}
                </option>
              ))}
            </select>
          </label>
          <Field label="Amount" value={amount} onChange={setAmount} inputMode="decimal" />
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Button type="submit" disabled={busy || !input}>
            {busy ? "Quoting…" : "Review quote"}
          </Button>
        </form>
      ) : null}
      {phase === "review" && quote && input && output ? (
        <div className="space-y-4">
          <Card>
            <p className="text-sm">Pay {amount} {input.symbol}</p>
            <p className="mt-2 text-sm">
              Receive at least {formatTokenAmount(BigInt(quote.otherAmountThreshold), output.decimals, 6)} {output.symbol}
            </p>
            <p className="mt-2 text-sm text-muted">Slippage cap 0.50%. Price impact {quote.priceImpactPct}%.</p>
          </Card>
          <Notice>Confirm the mints. Official $TCODE is {TCODE_MINT}.</Notice>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Button disabled={busy} onClick={() => void confirm()}>
            {busy ? "Signing…" : "Sign and send"}
          </Button>
          <Button tone="ghost" onClick={() => setPhase("form")}>
            Back
          </Button>
        </div>
      ) : null}
      {phase === "done" && signature ? (
        <div className="space-y-4">
          <Notice tone="info">Swap confirmed on {clusterLabel(cluster)}.</Notice>
          <a className="text-sm text-accent" href={explorerTx(signature, cluster)} target="_blank" rel="noreferrer">
            Open in Solana Explorer
          </a>
          <Link to="/home" className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary font-semibold text-primary-ink">
            Back to portfolio
          </Link>
        </div>
      ) : null}
      {phase === "failed" ? (
        <div className="space-y-4">
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Button onClick={() => setPhase("review")}>Back to review</Button>
        </div>
      ) : null}
    </Frame>
  );
}
