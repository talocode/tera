import { Connection, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { Link } from "@/nav";
import { Button, Card, DesktopNav, Field, Frame, Notice } from "@/components/wallet/chrome";
import { KeyOff } from "@/components/wallet/session";
import { useWalletReady } from "@/components/wallet/use-wallet-ready";
import { formatTokenAmount } from "@/wallet/amounts";
import { connectionFor, loadHoldings, type Holding } from "@/wallet/chain";
import {
  SOL_MINT,
  TCODE_MINT,
  USDC_MINT,
  USDT_MINT,
  fetchQuote,
  parseSwapAmount,
  routeLabels,
  signAndSendSwap,
  type JupiterQuote,
} from "@/wallet/jupiter";
import { clusterLabel, explorerTx } from "@/wallet/network";
import { useWallet } from "@/wallet/store";

function jupMint(holding: Holding): string {
  return holding.native ? SOL_MINT : holding.mint;
}

const CUSTOM = "custom";

const BUY_ASSETS = [
  { mint: TCODE_MINT, symbol: "$TCODE", decimals: 6 },
  { mint: SOL_MINT, symbol: "SOL", decimals: 9 },
  { mint: USDC_MINT, symbol: "USDC", decimals: 6 },
  { mint: USDT_MINT, symbol: "USDT", decimals: 6 },
];

async function readMintDecimals(connection: Connection, mint: string): Promise<number> {
  const info = await connection.getParsedAccountInfo(new PublicKey(mint));
  const data = info.value?.data;
  if (data && typeof data === "object" && "parsed" in data) {
    const decimals = (data.parsed as { info?: { decimals?: number } }).info?.decimals;
    if (typeof decimals === "number") return decimals;
  }
  throw new Error("That mint is not a Solana token.");
}

export function SwapScreen({ mode = "swap" }: { mode?: "swap" | "buy" }) {
  const buying = mode === "buy";
  const { ready, keypair, watchOnly } = useWalletReady("unlocked");
  const cluster = useWallet((state) => state.cluster);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [inputMint, setInputMint] = useState("SOL");
  const [outputMint, setOutputMint] = useState(TCODE_MINT);
  const [customMint, setCustomMint] = useState("");
  const [customDecimals, setCustomDecimals] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(50);
  const [priority, setPriority] = useState(0);
  const [quote, setQuote] = useState<JupiterQuote | null>(null);
  const [boughtMint, setBoughtMint] = useState<string | null>(null);
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
  const heldOutputs = holdings
    .filter((item) => !item.native && item.mint !== TCODE_MINT)
    .map((item) => ({ mint: item.mint, symbol: item.symbol, decimals: item.decimals }));
  const outputs = buying
    ? [...BUY_ASSETS, ...heldOutputs.filter((item) => !BUY_ASSETS.some((known) => known.mint === item.mint)), { mint: CUSTOM, symbol: "Other token mint", decimals: customDecimals ?? 6 }]
    : [
        { mint: SOL_MINT, symbol: "SOL", decimals: 9 },
        { mint: TCODE_MINT, symbol: "TCODE", decimals: 6 },
        ...heldOutputs,
      ];
  const output = outputs.find((item) => item.mint === outputMint) ?? outputs[0];
  const outputIsCustom = buying && output?.mint === CUSTOM;

  async function review() {
    if (!input || !output) return;
    if (cluster !== "mainnet-beta") {
      setError("Buys run on mainnet. Switch networks in Settings before you use real tokens.");
      return;
    }
    const base = parseSwapAmount(amount, input.decimals);
    if (!base) return setError("Enter an amount greater than zero.");
    if (base > input.amount) return setError("That amount is larger than the balance in this wallet.");
    let outputMintResolved = output.mint;
    let decimals = output.decimals;
    if (outputIsCustom) {
      try {
        outputMintResolved = new PublicKey(customMint.trim()).toBase58();
      } catch {
        return setError("Paste the token mint, not a name or a ticker.");
      }
      if (outputMintResolved === TCODE_MINT) return setError("Choose $TCODE in the list. That mint is the official one.");
    }
    if (jupMint(input) === outputMintResolved) return setError("Choose two different tokens.");
    setBusy(true);
    setError(null);
    try {
      if (outputIsCustom) {
        decimals = await readMintDecimals(connectionFor(cluster), outputMintResolved);
        setCustomDecimals(decimals);
      }
      const next = await fetchQuote({
        inputMint: jupMint(input),
        outputMint: outputMintResolved,
        amount: base,
        slippageBps,
      });
      setBoughtMint(outputMintResolved);
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
        prioritizationFeeLamports: priority,
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

  if (!ready || !keypair) return watchOnly ? <KeyOff title={buying ? "Buy" : "Swap"} /> : <Frame title={buying ? "Buy" : "Swap"} nav />;
  const outputDecimals = outputIsCustom ? customDecimals ?? output.decimals : output.decimals;
  const outputSymbol = outputIsCustom ? "token" : output.symbol;
  return (
    <Frame
      nav
      title={buying ? "Buy" : "Swap"}
      subtitle={buying
        ? "Pay with a token this wallet holds. The tokens you buy arrive in this same wallet. You sign locally."
        : "Jupiter quote. You sign locally. Tera never sees the phrase."}
    >
      <DesktopNav />
      {phase === "form" ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void review();
          }}
        >
          {buying ? (
            <Notice>
              Official $TCODE held in this wallet is what earns Tera credits. Buying another token does not. The official mint is {TCODE_MINT}.
            </Notice>
          ) : null}
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-muted">Pay with</span>
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
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-muted">{buying ? "Buy" : "To"}</span>
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
          {outputIsCustom ? (
            <Field label="Token mint" value={customMint} onChange={setCustomMint} />
          ) : null}
          <Field label="Amount" value={amount} onChange={setAmount} inputMode="decimal" />
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-muted">Slippage</span>
            <select
              value={slippageBps}
              onChange={(event) => setSlippageBps(Number(event.target.value))}
              className="min-h-12 w-full rounded-2xl border border-line bg-surface px-4"
            >
              <option value={50}>0.50%</option>
              <option value={100}>1%</option>
              <option value={200}>2%</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-muted">Priority fee</span>
            <select
              value={priority}
              onChange={(event) => setPriority(Number(event.target.value))}
              className="min-h-12 w-full rounded-2xl border border-line bg-surface px-4"
            >
              <option value={0}>Standard</option>
              <option value={10000}>Fast, 0.00001 SOL cap</option>
              <option value={100000}>Urgent, 0.0001 SOL cap</option>
            </select>
          </label>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Button type="submit" disabled={busy || !input}>
            {busy ? "Quoting…" : buying ? "Review buy" : "Review quote"}
          </Button>
        </form>
      ) : null}
      {phase === "review" && quote && input && output ? (
        <div className="space-y-4">
          <Card>
            <p className="text-sm">Pay {amount} {input.symbol}</p>
            <p className="mt-2 text-sm">
              Receive at least {formatTokenAmount(BigInt(quote.otherAmountThreshold), outputDecimals, 6)} {outputSymbol}
            </p>
            <p className="mt-2 text-sm text-muted">Slippage cap {(quote.slippageBps / 100).toFixed(2)}%. Price impact {quote.priceImpactPct}%.</p>
            <p className="mt-2 text-sm text-muted">Route: {routeLabels(quote).join(" → ") || "Jupiter"}</p>
            {priority ? <p className="mt-2 text-sm text-muted">Priority fee cap {priority} lamports.</p> : null}
          </Card>
          {quote.via === "order" && (boughtMint === TCODE_MINT || jupMint(input) === TCODE_MINT) ? (
            <Notice>Official $TCODE trades on a Meteora bonding curve. Jupiter's standard swap rejects that mint, so this buy uses the curve. No 0.20% Tera fee is taken on this route. The tokens still arrive in this wallet.</Notice>
          ) : boughtMint !== SOL_MINT && boughtMint !== TCODE_MINT && boughtMint !== USDC_MINT && boughtMint !== USDT_MINT ? (
            <Notice tone="danger">Unverified mint. This is not official $TCODE. Trust the mint, not the ticker. No Tera fee is taken on this pair. It does not earn Tera credits.</Notice>
          ) : boughtMint === TCODE_MINT || jupMint(input) === TCODE_MINT ? (
            <Notice>0.20% of this swap is paid in official $TCODE to the Talocode fee account. Credits come from holding $TCODE after it arrives, not from the purchase itself.</Notice>
          ) : (
            <Notice>No Tera fee on this pair. The fee account can only receive official $TCODE.</Notice>
          )}
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Button disabled={busy} onClick={() => void confirm()}>
            {busy ? "Signing…" : buying ? "Sign and buy" : "Sign and send"}
          </Button>
          <Button tone="ghost" onClick={() => setPhase("form")}>
            Back
          </Button>
        </div>
      ) : null}
      {phase === "done" && signature ? (
        <div className="space-y-4">
          <Notice tone="info">
            {boughtMint === TCODE_MINT
              ? `Buy confirmed on ${clusterLabel(cluster)}. The $TCODE is in this wallet. Hold it here to earn Tera credits.`
              : `Buy confirmed on ${clusterLabel(cluster)}.`}
          </Notice>
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
