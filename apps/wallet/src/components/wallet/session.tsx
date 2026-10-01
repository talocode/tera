import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@/nav";
import QRCode from "qrcode";
import { PublicKey } from "@solana/web3.js";
import { Button, Card, DesktopNav, Field, Frame, Notice } from "@/components/wallet/chrome";
import { useWalletReady } from "@/components/wallet/use-wallet-ready";
import { formatTokenAmount, maxSolSend, validateSpend } from "@/wallet/amounts";
import {
  connectionFor,
  estimateFee,
  loadActivity,
  loadHoldings,
  networkWarning,
  submitTransfer,
  type Activity,
  type Holding,
} from "@/wallet/chain";
import { parseAddress, shortAddress } from "@/wallet/keys";
import { clusterLabel, explorerAddress, explorerTx, type Cluster } from "@/wallet/network";
import { useWallet } from "@/wallet/store";
import { passcodeError } from "@/wallet/vault";

function userError(error: unknown): string {
  if (error instanceof Error) {
    const text = error.message || "Something went wrong.";
    if (/failed to fetch|network|429|403|503|timeout|access forbidden|unavailable/i.test(text)) {
      return "The Solana network is busy right now. Wait a moment and open the wallet again.";
    }
    return text;
  }
  return "Something went wrong.";
}

export function HomeScreen() {
  const { ready, keypair } = useWalletReady("unlocked");
  const cluster = useWallet((state) => state.cluster);
  const lock = useWallet((state) => state.lock);
  const [holdings, setHoldings] = useState<Holding[] | null>(null);
  const [activity, setActivity] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!keypair) return;
    const connection = connectionFor(cluster);
    let cancelled = false;
    setHoldings(null);
    setError(null);
    void loadHoldings(connection, keypair.publicKey, cluster)
      .then((rows) => {
        if (!cancelled) setHoldings(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(userError(err));
      });
    void loadActivity(connection, keypair.publicKey, cluster)
      .then((rows) => {
        if (!cancelled) setActivity(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) setHistoryError(userError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [keypair, cluster]);

  if (!ready || !keypair) return <Frame title="Wallet" nav />;
  const address = keypair.publicKey.toBase58();
  const sol = holdings?.find((item) => item.native);
  const tcode = holdings?.find((item) => item.symbol === "TCODE");
  return (
    <Frame nav>
      <DesktopNav />
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{clusterLabel(cluster)}</p>
      <h1 className="mt-2 font-display text-4xl">Portfolio</h1>
      <Card>
        <p className="text-xs uppercase tracking-[0.14em] text-muted">Address</p>
        <p className="mt-2 break-all font-medium">{address}</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-2xl border border-line text-sm"
            onClick={() => void navigator.clipboard.writeText(address)}
          >
            Copy
          </button>
          <Link to="/receive" className="grid min-h-11 flex-1 place-items-center rounded-2xl bg-primary text-sm font-semibold text-primary-ink">
            Receive
          </Link>
          <Link to="/swap" className="grid min-h-11 flex-1 place-items-center rounded-2xl border border-line text-sm font-semibold">
            Swap
          </Link>
        </div>
      </Card>
      {cluster !== "mainnet-beta" ? (
        <div className="mt-3">
          <Notice>
            Devnet is selected, so this is not real mainnet $TCODE. Switch networks in Settings only when you mean to use real funds.
          </Notice>
        </div>
      ) : null}
      {error ? (
        <div className="mt-3">
          <Notice tone="danger">{error}</Notice>
        </div>
      ) : null}
      <div className="mt-4 space-y-3">
        {!holdings && !error ? <p className="text-sm text-muted">Loading balances from Solana…</p> : null}
        {sol ? <TokenRow holding={sol} /> : null}
        {tcode ? <TokenRow holding={tcode} /> : null}
        {holdings
          ?.filter((item) => !item.native && item.symbol !== "TCODE")
          .map((item) => <TokenRow key={item.mint} holding={item} />)}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Recent activity</h2>
        <Link to="/activity" className="text-sm text-accent">
          See all
        </Link>
      </div>
      <div className="mt-3">
        <ActivityList items={activity?.slice(0, 4) ?? []} error={historyError} loading={activity === null && !historyError} />
      </div>
      <div className="mt-6">
        <Button tone="ghost" onClick={lock}>
          Lock wallet
        </Button>
      </div>
    </Frame>
  );
}

function TokenRow({ holding }: { holding: Holding }) {
  return (
    <Link
      to="/token/$mint"
      params={{ mint: holding.mint }}
      className="flex items-center justify-between rounded-card border border-line bg-surface px-4 py-4"
    >
      <span>
        <span className="block font-semibold">{holding.symbol}</span>
        <span className="text-sm text-muted">{holding.name}</span>
      </span>
      <span className="text-right font-medium">{formatTokenAmount(holding.amount, holding.decimals, 6)}</span>
    </Link>
  );
}

export function TokenScreen({ mint }: { mint: string }) {
  const { ready, keypair } = useWalletReady("unlocked");
  const cluster = useWallet((state) => state.cluster);
  const [holding, setHolding] = useState<Holding | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!keypair) return;
    let cancelled = false;
    void loadHoldings(connectionFor(cluster), keypair.publicKey, cluster)
      .then((rows) => {
        if (cancelled) return;
        setHolding(rows.find((row) => row.mint === mint) ?? null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(userError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [keypair, cluster, mint]);
  if (!ready || !keypair) return <Frame title="Token" nav />;
  return (
    <Frame nav title={holding?.symbol ?? "Token"} subtitle={holding?.trusted ? holding.name : "Unverified SPL token. Trust the mint, not the symbol."}>
      <DesktopNav />
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {holding ? (
        <div className="space-y-4">
          <p className="font-display text-5xl">{formatTokenAmount(holding.amount, holding.decimals, 6)}</p>
          <Card>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Mint</p>
            <p className="mt-2 break-all text-sm">{holding.native ? "Native SOL" : holding.mint}</p>
          </Card>
          <Link
            to="/send"
            search={{ mint: holding.mint }}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-ink"
          >
            Send {holding.symbol}
          </Link>
        </div>
      ) : error ? null : (
        <p className="text-sm text-muted">Looking up this token…</p>
      )}
    </Frame>
  );
}

export function ReceiveScreen() {
  const { ready, keypair } = useWalletReady("unlocked");
  const cluster = useWallet((state) => state.cluster);
  const [svg, setSvg] = useState("");
  const address = keypair?.publicKey.toBase58() ?? "";
  useEffect(() => {
    if (!address) return;
    void QRCode.toString(address, { type: "svg", margin: 1, color: { dark: "#edf6f1", light: "#00000000" } }).then(setSvg);
  }, [address]);
  if (!ready || !keypair) return <Frame title="Receive" nav />;
  return (
    <Frame nav title="Receive" subtitle={networkWarning(cluster)}>
      <DesktopNav />
      <Card>
        <div className="mx-auto max-w-56" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-4 break-all text-center text-sm">{address}</p>
      </Card>
      <div className="mt-4 space-y-3">
        <Button onClick={() => void navigator.clipboard.writeText(address)}>Copy address</Button>
        <a
          href={explorerAddress(address, cluster)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-line text-sm"
        >
          View on explorer
        </a>
        <Notice>Network: {clusterLabel(cluster)}</Notice>
      </div>
    </Frame>
  );
}

export function SendScreen({ initialMint }: { initialMint?: string }) {
  const { ready, keypair } = useWalletReady("unlocked");
  const cluster = useWallet((state) => state.cluster);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [mint, setMint] = useState(initialMint || "SOL");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState<bigint | null>(null);
  const [creates, setCreates] = useState(false);
  const [phase, setPhase] = useState<"form" | "review" | "done" | "failed">("form");
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!keypair) return;
    void loadHoldings(connectionFor(cluster), keypair.publicKey, cluster)
      .then(setHoldings)
      .catch((err: unknown) => setError(userError(err)));
  }, [keypair, cluster]);

  const holding = holdings.find((item) => item.mint === mint) ?? holdings[0];
  const sol = holdings.find((item) => item.native);

  async function review() {
    if (!keypair || !holding || !sol) return;
    const address = parseAddress(destination);
    if (!address) return setError("That recipient is not a valid Solana address.");
    setBusy(true);
    setError(null);
    try {
      const quote = await estimateFee({
        connection: connectionFor(cluster),
        owner: keypair.publicKey,
        mint: holding.mint,
        destination: new PublicKey(address),
      });
      setFee(quote.feeLamports);
      setCreates(quote.createsTokenAccount);
      const check = validateSpend({
        raw: amount,
        decimals: holding.decimals,
        balance: holding.amount,
        feeLamports: quote.feeLamports,
        solBalance: sol.amount,
        isNativeSol: holding.native,
      });
      if (!check.ok) {
        setError(check.error);
        return;
      }
      setPhase("review");
    } catch (err) {
      setError(userError(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!keypair || !holding || fee === null) return;
    const address = parseAddress(destination);
    const check = validateSpend({
      raw: amount,
      decimals: holding.decimals,
      balance: holding.amount,
      feeLamports: fee,
      solBalance: sol?.amount,
      isNativeSol: holding.native,
    });
    if (!address || !check.ok) return;
    setBusy(true);
    setError(null);
    try {
      const sig = await submitTransfer({
        connection: connectionFor(cluster),
        signer: keypair,
        destination: new PublicKey(address),
        mint: holding.mint,
        amount: check.base,
      });
      setSignature(sig);
      setPhase("done");
    } catch (err) {
      setError(userError(err));
      setPhase("failed");
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !keypair) return <Frame title="Send" nav />;
  return (
    <Frame nav title="Send" subtitle={`Network: ${clusterLabel(cluster)}`}>
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
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-muted">Token</span>
            <select
              value={holding?.mint ?? mint}
              onChange={(event) => setMint(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-line bg-surface px-4"
            >
              {holdings.map((item) => (
                <option key={item.mint} value={item.mint}>
                  {item.symbol} · {formatTokenAmount(item.amount, item.decimals, 4)}
                </option>
              ))}
            </select>
          </label>
          <Field label="Recipient" value={destination} onChange={setDestination} placeholder="Solana address" />
          <Field label="Amount" value={amount} onChange={setAmount} inputMode="decimal" />
          {holding?.native && sol ? (
            <button
              type="button"
              className="text-sm text-accent"
              onClick={() => setAmount(formatTokenAmount(maxSolSend(sol.amount, 5_000n), sol.decimals, 9))}
            >
              Use max, leaving a network fee
            </button>
          ) : null}
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Button type="submit" disabled={busy || !holding}>
            {busy ? "Checking…" : "Review"}
          </Button>
        </form>
      ) : null}
      {phase === "review" && holding && fee !== null ? (
        <div className="space-y-4">
          <Card>
            <Row label="Send" value={`${amount} ${holding.symbol}`} />
            <Row label="To" value={shortAddress(parseAddress(destination) ?? destination, 6, 6)} />
            <Row label="Network" value={clusterLabel(cluster)} />
            <Row label="Estimated fee" value={`${formatTokenAmount(fee, 9, 6)} SOL`} />
            {creates ? <p className="mt-3 text-sm text-muted">The fee includes creating the recipient token account.</p> : null}
          </Card>
          <Notice>No dollar price is shown. Review the token mint before you confirm.</Notice>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Button disabled={busy} onClick={() => void confirm()}>
            {busy ? "Submitting…" : "Confirm and sign"}
          </Button>
          <Button tone="ghost" onClick={() => setPhase("form")}>
            Back
          </Button>
        </div>
      ) : null}
      {phase === "done" && signature ? (
        <div className="space-y-4">
          <Notice tone="info">Transaction confirmed on {clusterLabel(cluster)}.</Notice>
          <a className="text-sm text-accent" href={explorerTx(signature, cluster)} target="_blank" rel="noreferrer">
            Open in Solana Explorer
          </a>
          <Link to="/home" className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary font-semibold text-primary-ink">
            Back to wallet
          </Link>
        </div>
      ) : null}
      {phase === "failed" ? (
        <div className="space-y-4">
          <Notice tone="danger">{error ?? "The transaction failed."}</Notice>
          <Button onClick={() => setPhase("form")}>Try again</Button>
        </div>
      ) : null}
    </Frame>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export function ActivityScreen() {
  const { ready, keypair } = useWalletReady("unlocked");
  const cluster = useWallet((state) => state.cluster);
  const [items, setItems] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!keypair) return;
    void loadActivity(connectionFor(cluster), keypair.publicKey, cluster)
      .then(setItems)
      .catch((err: unknown) => setError(userError(err)));
  }, [keypair, cluster]);
  if (!ready || !keypair) return <Frame title="Activity" nav />;
  return (
    <Frame nav title="Activity" subtitle="Recent signatures for this address. History can lag if the RPC is busy.">
      <DesktopNav />
      <ActivityList items={items ?? []} error={error} loading={items === null && !error} />
    </Frame>
  );
}

function ActivityList({ items, error, loading }: { items: Activity[]; error: string | null; loading: boolean }) {
  if (loading) return <p className="text-sm text-muted">Loading activity…</p>;
  if (error) return <Notice tone="danger">{error}</Notice>;
  if (items.length === 0) return <Notice tone="info">No transactions yet for this address on the selected network.</Notice>;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.signature} className="rounded-card border border-line bg-surface px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">{item.label}</span>
            <span className="text-xs uppercase tracking-wide text-muted">{item.status}</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {item.amountText ?? "Amount not decoded"} · {item.time ? new Date(item.time).toLocaleString() : "Time unavailable"}
          </p>
          <a className="mt-2 inline-block text-sm text-accent" href={item.explorerUrl} target="_blank" rel="noreferrer">
            {shortAddress(item.signature, 6, 6)}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function SettingsScreen() {
  const { ready, keypair } = useWalletReady("unlocked");
  const cluster = useWallet((state) => state.cluster);
  const setCluster = useWallet((state) => state.setCluster);
  const lock = useWallet((state) => state.lock);
  const forget = useWallet((state) => state.forgetWallet);
  const navigate = useNavigate();
  const [confirmForget, setConfirmForget] = useState(false);
  if (!ready || !keypair) return <Frame title="Settings" nav />;
  return (
    <Frame nav title="Settings" subtitle="Network choice changes which balances and transactions you see. It does not change your keys.">
      <DesktopNav />
      <div className="space-y-3">
        {(["devnet", "mainnet-beta"] as Cluster[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCluster(item)}
            className={`min-h-14 w-full rounded-2xl border px-4 text-left ${cluster === item ? "border-primary bg-surface" : "border-line bg-surface"}`}
          >
            <span className="block text-sm font-semibold">{clusterLabel(item)}</span>
            <span className="text-xs text-muted">{item === cluster ? "Selected" : "Tap to switch"}</span>
          </button>
        ))}
        {cluster === "mainnet-beta" ? (
          <Notice tone="warn">Mainnet moves real SOL and real tokens, including $TCODE.</Notice>
        ) : (
          <Notice>Devnet SOL has no mainnet value. Official $TCODE lives on mainnet.</Notice>
        )}
        <Link to="/security" className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-line text-sm">
          Security
        </Link>
        <Button tone="ghost" onClick={lock}>
          Lock
        </Button>
        {confirmForget ? (
          <Button
            tone="danger"
            onClick={() => {
              forget();
              void navigate({ to: "/" });
            }}
          >
            Delete wallet from this browser
          </Button>
        ) : (
          <Button tone="ghost" onClick={() => setConfirmForget(true)}>
            Remove wallet from this device
          </Button>
        )}
      </div>
    </Frame>
  );
}

export function SecurityScreen() {
  const { ready, keypair } = useWalletReady("unlocked");
  const reveal = useWallet((state) => state.revealPhrase);
  const [passcode, setPasscode] = useState("");
  const [phrase, setPhrase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const words = useMemo(() => phrase?.split(" ") ?? [], [phrase]);
  if (!ready || !keypair) return <Frame title="Security" nav />;
  return (
    <Frame
      nav
      title="Security"
      subtitle="Tera Wallet is self-custodial. The recovery phrase is encrypted with your passcode and stored only in this browser."
    >
      <DesktopNav />
      <div className="space-y-3 text-sm leading-6 text-muted">
        <p>Private keys are not sent to Tera, analytics, or a backend.</p>
        <p>A browser passcode can be copied by malware on this device. Use a hardware wallet for larger amounts.</p>
      </div>
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const issue = passcodeError(passcode);
          if (issue) return setError(issue);
          setError(null);
          void reveal(passcode)
            .then((value) => {
              setPasscode("");
              setPhrase(value);
            })
            .catch((err: unknown) => setError(userError(err)));
        }}
      >
        <Field label="Passcode to reveal phrase" type="password" value={passcode} onChange={setPasscode} autoComplete="current-password" />
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Button type="submit">Show recovery phrase</Button>
      </form>
      {phrase ? (
        <div className="mt-4 space-y-3">
          <Notice tone="danger">Anyone with these words controls the wallet. Hide this before you leave the screen.</Notice>
          <div className="grid grid-cols-2 gap-2">
            {words.map((word, index) => (
              <div key={`${word}-${index}`} className="rounded-2xl border border-line bg-surface px-3 py-3 text-sm">
                <span className="mr-2 text-muted">{index + 1}</span>
                {word}
              </div>
            ))}
          </div>
          <Button tone="ghost" onClick={() => setPhrase(null)}>
            Hide phrase
          </Button>
        </div>
      ) : null}
    </Frame>
  );
}
