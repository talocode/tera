import { useEffect, useState } from "react";
import { Link } from "@/nav";
import { Button, Card, DesktopNav, Field, Frame, Notice } from "@/components/wallet/chrome";
import { useWalletReady } from "@/components/wallet/use-wallet-ready";
import { formatTokenAmount } from "@/wallet/amounts";
import { loadAddressBook, saveAddressName, type AddressName } from "@/wallet/book";
import { connectionFor } from "@/wallet/chain";
import {
  closeEmptyAccounts,
  delegateSol,
  findEmptyTokenAccounts,
  listValidators,
  priorityLamports,
  rememberedStakeAccounts,
  type EmptyAccount,
  type ValidatorChoice,
} from "@/wallet/housekeeping";
import { SOL_MINT, TCODE_MINT, createLimitOrder, parseSwapAmount } from "@/wallet/jupiter";
import { clusterLabel, explorerTx } from "@/wallet/network";
import { useWallet } from "@/wallet/store";

function Done({ signature, cluster }: { signature: string; cluster: Parameters<typeof explorerTx>[1] }) {
  return (
    <div className="space-y-4">
      <Notice tone="info">Confirmed on {clusterLabel(cluster)}.</Notice>
      <a className="text-sm text-accent" href={explorerTx(signature, cluster)} target="_blank" rel="noreferrer">
        Open in Solana Explorer
      </a>
      <Link to="/home" className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary font-semibold text-primary-ink">
        Back to portfolio
      </Link>
    </div>
  );
}

export function RentScreen() {
  const { ready, keypair } = useWalletReady("unlocked");
  const cluster = useWallet((state) => state.cluster);
  const [rows, setRows] = useState<EmptyAccount[] | null>(null);
  const [phase, setPhase] = useState<"form" | "review" | "done">("form");
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!keypair) return;
    void findEmptyTokenAccounts(connectionFor(cluster), keypair.publicKey)
      .then(setRows)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not read token accounts."));
  }, [keypair, cluster]);

  const batch = (rows ?? []).slice(0, 8);
  const rent = batch.reduce((sum, item) => sum + item.lamports, 0);

  async function confirm() {
    if (!keypair || batch.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const sig = await closeEmptyAccounts({
        connection: connectionFor(cluster),
        signer: keypair,
        accounts: batch,
        microLamports: 50_000,
      });
      setSignature(sig);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Close failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !keypair) return <Frame title="Reclaim" nav />;
  return (
    <Frame nav title="Reclaim SOL" subtitle="Closes empty token accounts and returns the rent to this wallet.">
      <DesktopNav />
      {phase === "done" && signature ? <Done signature={signature} cluster={cluster} /> : null}
      {phase !== "done" ? (
        <div className="space-y-4">
          {!rows ? <p className="text-sm text-muted">Looking for empty accounts…</p> : null}
          {rows && rows.length === 0 ? <Notice>No empty token accounts. Nothing to reclaim.</Notice> : null}
          {batch.length ? (
            <Card>
              <p className="text-sm">Close {batch.length} empty account{batch.length === 1 ? "" : "s"}.</p>
              <p className="mt-2 text-sm">You receive about {formatTokenAmount(BigInt(rent), 9, 6)} SOL.</p>
              <p className="mt-2 text-sm text-muted">No tokens move. Priority fee about {formatTokenAmount(priorityLamports(50_000), 9, 6)} SOL.</p>
              {rows && rows.length > 8 ? <p className="mt-2 text-sm text-muted">Eight accounts per signature. Run this again for the rest.</p> : null}
            </Card>
          ) : null}
          {error ? <Notice tone="danger">{error}</Notice> : null}
          {phase === "form" && batch.length ? <Button onClick={() => setPhase("review")}>Review</Button> : null}
          {phase === "review" ? (
            <>
              <Notice>Sign to close only the empty accounts listed. The SOL comes back to this address.</Notice>
              <Button disabled={busy} onClick={() => void confirm()}>{busy ? "Signing…" : "Sign and send"}</Button>
              <Button tone="ghost" onClick={() => setPhase("form")}>Back</Button>
            </>
          ) : null}
        </div>
      ) : null}
    </Frame>
  );
}

export function StakeScreen() {
  const { ready, keypair } = useWalletReady("unlocked");
  const cluster = useWallet((state) => state.cluster);
  const [validators, setValidators] = useState<ValidatorChoice[]>([]);
  const [vote, setVote] = useState("");
  const [amount, setAmount] = useState("0.01");
  const [phase, setPhase] = useState<"form" | "review" | "done">("form");
  const [signature, setSignature] = useState<string | null>(null);
  const [stakeAccount, setStakeAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (cluster !== "mainnet-beta") return;
    void listValidators(connectionFor(cluster))
      .then((rows) => {
        setValidators(rows);
        const first = rows[0];
        if (first) setVote(first.vote);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load validators."));
  }, [cluster]);

  const chosen = validators.find((item) => item.vote === vote);

  async function confirm() {
    if (!keypair || !chosen) return;
    const lamports = Number(amount) * 1_000_000_000;
    if (!Number.isFinite(lamports) || lamports < 10_000_000) return setError("Stake at least 0.01 SOL.");
    setBusy(true);
    setError(null);
    try {
      const result = await delegateSol({
        connection: connectionFor(cluster),
        signer: keypair,
        vote: chosen.vote,
        lamports: Math.floor(lamports),
        microLamports: 50_000,
      });
      setSignature(result.signature);
      setStakeAccount(result.stakeAccount);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stake failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !keypair) return <Frame title="Stake" nav />;
  return (
    <Frame nav title="Stake SOL" subtitle="Native stake. You remain the withdrawer. Tera does not hold the stake account.">
      <DesktopNav />
      {cluster !== "mainnet-beta" ? <Notice>Switch to mainnet in Settings. Devnet stake is not offered.</Notice> : null}
      {phase === "done" && signature ? (
        <div className="space-y-4">
          <Done signature={signature} cluster={cluster} />
          {stakeAccount ? <p className="break-all text-sm text-muted">Stake account {stakeAccount}</p> : null}
        </div>
      ) : null}
      {phase !== "done" && cluster === "mainnet-beta" ? (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-muted">Validator</span>
            <select value={vote} onChange={(event) => setVote(event.target.value)} className="min-h-12 w-full rounded-2xl border border-line bg-surface px-4">
              {validators.map((item) => (
                <option key={item.vote} value={item.vote}>
                  {item.commission}% commission · {item.vote.slice(0, 4)}…{item.vote.slice(-4)}
                </option>
              ))}
            </select>
          </label>
          <Field label="SOL to stake" value={amount} onChange={setAmount} inputMode="decimal" />
          {chosen && phase === "review" ? (
            <Card>
              <p className="text-sm">Delegate {amount} SOL.</p>
              <p className="mt-2 break-all text-sm">Vote account {chosen.vote}</p>
              <p className="mt-2 text-sm">Commission {chosen.commission}%. About {chosen.stakeSol.toFixed(0)} SOL already delegated there.</p>
              <p className="mt-2 text-sm text-muted">The SOL leaves your spending balance and stays in a stake account you can withdraw from after deactivation.</p>
            </Card>
          ) : null}
          {rememberedStakeAccounts().length ? (
            <p className="break-all text-xs text-muted">Previous stake accounts on this device: {rememberedStakeAccounts().join(", ")}</p>
          ) : null}
          {error ? <Notice tone="danger">{error}</Notice> : null}
          {phase === "form" ? <Button disabled={!chosen} onClick={() => setPhase("review")}>Review</Button> : null}
          {phase === "review" ? (
            <>
              <Button disabled={busy} onClick={() => void confirm()}>{busy ? "Signing…" : "Sign and delegate"}</Button>
              <Button tone="ghost" onClick={() => setPhase("form")}>Back</Button>
            </>
          ) : null}
        </div>
      ) : null}
    </Frame>
  );
}

export function LimitScreen() {
  const { ready, keypair } = useWalletReady("unlocked");
  const cluster = useWallet((state) => state.cluster);
  const [pay, setPay] = useState("SOL");
  const [making, setMaking] = useState("");
  const [taking, setTaking] = useState("");
  const [phase, setPhase] = useState<"form" | "review" | "done">("form");
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputMint = pay === "SOL" ? SOL_MINT : TCODE_MINT;
  const outputMint = pay === "SOL" ? TCODE_MINT : SOL_MINT;
  const makingBase = parseSwapAmount(making, pay === "SOL" ? 9 : 6);
  const takingBase = parseSwapAmount(taking, pay === "SOL" ? 6 : 9);

  async function confirm() {
    if (!keypair || !makingBase || !takingBase) return;
    setBusy(true);
    setError(null);
    try {
      const sig = await createLimitOrder({
        connection: connectionFor(cluster),
        signer: keypair,
        inputMint,
        outputMint,
        makingAmount: makingBase.toString(),
        takingAmount: takingBase.toString(),
      });
      setSignature(sig);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Limit order failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !keypair) return <Frame title="Limit" nav />;
  return (
    <Frame nav title="Limit" subtitle="SOL and official $TCODE only. Jupiter fills it when the pool rate matches. You sign the deposit.">
      <DesktopNav />
      {cluster !== "mainnet-beta" ? <Notice>Limit orders run on mainnet.</Notice> : null}
      {phase === "done" && signature ? <Done signature={signature} cluster={cluster} /> : null}
      {phase !== "done" ? (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-muted">Pay</span>
            <select value={pay} onChange={(event) => setPay(event.target.value)} className="min-h-12 w-full rounded-2xl border border-line bg-surface px-4">
              <option value="SOL">SOL</option>
              <option value="TCODE">$TCODE</option>
            </select>
          </label>
          <Field label={pay === "SOL" ? "SOL you deposit" : "$TCODE you deposit"} value={making} onChange={setMaking} inputMode="decimal" />
          <Field label={pay === "SOL" ? "$TCODE you want" : "SOL you want"} value={taking} onChange={setTaking} inputMode="decimal" />
          {phase === "review" && makingBase && takingBase ? (
            <Card>
              <p className="text-sm">Deposit {making} {pay === "SOL" ? "SOL" : "$TCODE"}.</p>
              <p className="mt-2 text-sm">Ask for {taking} {pay === "SOL" ? "$TCODE" : "SOL"}.</p>
              <p className="mt-2 text-sm text-muted">Output mint {outputMint}. This rests on Jupiter until it fills or you cancel in Jupiter.</p>
            </Card>
          ) : null}
          {error ? <Notice tone="danger">{error}</Notice> : null}
          {phase === "form" ? (
            <Button disabled={!makingBase || !takingBase || cluster !== "mainnet-beta"} onClick={() => setPhase("review")}>Review</Button>
          ) : null}
          {phase === "review" ? (
            <>
              <Button disabled={busy} onClick={() => void confirm()}>{busy ? "Signing…" : "Sign limit order"}</Button>
              <Button tone="ghost" onClick={() => setPhase("form")}>Back</Button>
            </>
          ) : null}
        </div>
      ) : null}
    </Frame>
  );
}

export function BookScreen() {
  const { ready } = useWalletReady("unlocked");
  const [rows, setRows] = useState<AddressName[]>(() => loadAddressBook());
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  function add() {
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address.trim())) {
      setError("That is not a Solana address.");
      return;
    }
    setRows(saveAddressName(address.trim(), name));
    setName("");
    setAddress("");
    setError(null);
  }

  if (!ready) return <Frame title="Addresses" nav />;
  return (
    <Frame nav title="Address book" subtitle="Names stay in this browser. They are not uploaded.">
      <DesktopNav />
      <div className="space-y-4">
        <Field label="Name" value={name} onChange={setName} />
        <Field label="Address" value={address} onChange={setAddress} />
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Button onClick={add}>Save on this device</Button>
        {rows.map((item) => (
          <Card key={item.address}>
            <p className="text-sm font-medium">{item.name}</p>
            <p className="mt-1 break-all text-xs text-muted">{item.address}</p>
          </Card>
        ))}
      </div>
    </Frame>
  );
}
