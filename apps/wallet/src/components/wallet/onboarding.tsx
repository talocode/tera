import { useEffect, useState } from "react";
import { useNavigate } from "@/nav";
import { Button, Field, Frame, Notice } from "@/components/wallet/chrome";
import { useWalletReady } from "@/components/wallet/use-wallet-ready";
import { isValidMnemonic, normalizeMnemonic } from "@/wallet/keys";
import { passcodeError } from "@/wallet/vault";
import { useWallet } from "@/wallet/store";

export function LandingScreen() {
  const { ready } = useWalletReady("guest");
  const beginCreate = useWallet((state) => state.beginCreate);
  const navigate = useNavigate();
  if (!ready) return <Frame title="Tera Wallet" />;
  return (
    <Frame title="Hold your own keys." subtitle="Create a Solana wallet on this device. Tera never sees the recovery phrase.">
      <div className="space-y-3">
        <Button
          onClick={() => {
            beginCreate();
            void navigate({ to: "/backup" });
          }}
        >
          Create a new wallet
        </Button>
        <Button tone="ghost" onClick={() => void navigate({ to: "/import" })}>
          I already have a recovery phrase
        </Button>
      </div>
      <ul className="mt-8 space-y-3 text-sm text-muted">
        <li>SOL and SPL tokens, including $TCODE on mainnet.</li>
        <li>Signing happens in the browser. There is no custody server.</li>
        <li>A passcode only encrypts the phrase on this device. It is not a hardware wallet.</li>
      </ul>
    </Frame>
  );
}

export function BackupScreen() {
  const { ready, draft } = useWalletReady("draft");
  const [revealed, setRevealed] = useState(false);
  const navigate = useNavigate();
  if (!ready || !draft) return <Frame title="Recovery phrase" />;
  const words = draft.split(" ");
  return (
    <Frame
      title="Write this down."
      subtitle="This is the only way to restore the wallet. Tera cannot recover it. It will not be shown again unless you unlock the security screen."
    >
      <Notice tone="danger">
        Never share this phrase. Anyone who has it can take the funds. Do not screenshot it.
      </Notice>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {words.map((word, index) => (
          <div key={`${word}-${index}`} className="rounded-2xl border border-line bg-surface px-3 py-3 text-sm">
            <span className="mr-2 text-muted">{index + 1}</span>
            {revealed ? word : "••••"}
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        <Button tone="ghost" onClick={() => setRevealed((value) => !value)}>
          {revealed ? "Hide phrase" : "Reveal phrase"}
        </Button>
        <Button disabled={!revealed} onClick={() => void navigate({ to: "/confirm" })}>
          I wrote it down
        </Button>
      </div>
    </Frame>
  );
}

export function ConfirmScreen() {
  const { ready, draft } = useWalletReady("draft");
  const indexes = useWallet((state) => state.confirmIndexes);
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  if (!ready || !draft) return <Frame title="Confirm phrase" />;
  const words = draft.split(" ");
  return (
    <Frame title="Confirm three words." subtitle="This checks that the phrase was recorded. It never leaves this device.">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const ok = indexes.every((index) => (answers[index] ?? "").trim().toLowerCase() === words[index]);
          if (!ok) {
            setError("Those words do not match. Check your written copy.");
            return;
          }
          void navigate({ to: "/passcode" });
        }}
      >
        {indexes.map((index) => (
          <Field
            key={index}
            label={`Word ${index + 1}`}
            value={answers[index] ?? ""}
            onChange={(value) => setAnswers((current) => ({ ...current, [index]: value }))}
            autoComplete="off"
          />
        ))}
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Button type="submit">Continue</Button>
      </form>
    </Frame>
  );
}

export function PasscodeScreen() {
  const { ready, draft } = useWalletReady("draft");
  const save = useWallet((state) => state.saveWithPasscode);
  const navigate = useNavigate();
  const [passcode, setPasscode] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!ready || !draft) return <Frame title="Set a passcode" />;
  return (
    <Frame
      title="Lock this device."
      subtitle="The passcode encrypts the recovery phrase in local storage. A weak passcode is not the same as a hardware wallet."
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const issue = passcodeError(passcode);
          if (issue) return setError(issue);
          if (passcode !== again) return setError("Passcodes do not match.");
          setBusy(true);
          setError(null);
          void save(passcode)
            .then(() => navigate({ to: "/home" }))
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not save the wallet."))
            .finally(() => setBusy(false));
        }}
      >
        <Field label="Passcode" type="password" value={passcode} onChange={setPasscode} autoComplete="new-password" />
        <Field label="Confirm passcode" type="password" value={again} onChange={setAgain} autoComplete="new-password" />
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Button type="submit" disabled={busy}>
          {busy ? "Encrypting…" : "Open wallet"}
        </Button>
      </form>
    </Frame>
  );
}

export function ImportScreen() {
  const { ready } = useWalletReady("guest");
  const beginImport = useWallet((state) => state.beginImport);
  const navigate = useNavigate();
  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!ready) return <Frame title="Import" />;
  return (
    <Frame title="Restore a wallet." subtitle="Enter the 12 or 24 word recovery phrase. It is checked locally and is not sent anywhere.">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!isValidMnemonic(phrase)) {
            setError("That recovery phrase is not a valid 12 or 24 word BIP-39 phrase.");
            return;
          }
          beginImport(normalizeMnemonic(phrase));
          setPhrase("");
          void navigate({ to: "/passcode" });
        }}
      >
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-muted">Recovery phrase</span>
          <textarea
            value={phrase}
            onChange={(event) => setPhrase(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            rows={4}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base text-fg outline-none"
          />
        </label>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Button type="submit">Continue</Button>
      </form>
    </Frame>
  );
}

export function UnlockScreen() {
  const boot = useWallet((state) => state.boot);
  const ready = useWallet((state) => state.ready);
  const vault = useWallet((state) => state.vault);
  const unlock = useWallet((state) => state.unlock);
  const navigate = useNavigate();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    boot();
  }, [boot]);
  if (!ready) return <Frame title="Unlock" />;
  if (ready && !vault) {
    void navigate({ to: "/" });
  }
  return (
    <Frame title="Unlock wallet." subtitle={vault ? `Address ${vault.publicKey.slice(0, 4)}…${vault.publicKey.slice(-4)}` : undefined}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          setError(null);
          void unlock(passcode)
            .then(() => {
              setPasscode("");
              return navigate({ to: "/home" });
            })
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not unlock."))
            .finally(() => setBusy(false));
        }}
      >
        <Field label="Passcode" type="password" value={passcode} onChange={setPasscode} autoComplete="current-password" />
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Button type="submit" disabled={busy}>
          {busy ? "Checking…" : "Unlock"}
        </Button>
      </form>
    </Frame>
  );
}
