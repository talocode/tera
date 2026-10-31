import { useEffect } from "react";
import { useNavigate } from "@/nav";
import { useWallet } from "@/wallet/store";

export function useWalletReady(expect: "guest" | "draft" | "unlocked" | "address") {
  const boot = useWallet((state) => state.boot);
  const ready = useWallet((state) => state.ready);
  const vault = useWallet((state) => state.vault);
  const watch = useWallet((state) => state.watch);
  const keypair = useWallet((state) => state.keypair);
  const draft = useWallet((state) => state.draftMnemonic);
  const navigate = useNavigate();
  const address = keypair?.publicKey.toBase58() ?? vault?.publicKey ?? watch?.publicKey ?? null;

  useEffect(() => {
    boot();
  }, [boot]);

  useEffect(() => {
    if (!ready) return;
    if (expect === "guest" && address) {
      void navigate({ to: "/home" });
      return;
    }
    if (expect === "draft" && !draft) {
      void navigate({ to: address ? "/home" : "/" });
      return;
    }
    if (expect === "address" && !address) {
      void navigate({ to: "/" });
      return;
    }
    if (expect === "unlocked" && !keypair) {
      if (vault) {
        void navigate({ to: "/unlock" });
        return;
      }
      if (!watch) void navigate({ to: "/" });
    }
  }, [ready, expect, vault, watch, keypair, draft, address, navigate]);

  return { ready, vault, watch, keypair, draft, address, watchOnly: Boolean(watch) && !vault };
}