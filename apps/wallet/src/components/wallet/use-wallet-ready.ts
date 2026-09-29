import { useEffect } from "react";
import { useNavigate } from "@/nav";
import { useWallet } from "@/wallet/store";

export function useWalletReady(expect: "guest" | "draft" | "unlocked") {
  const boot = useWallet((state) => state.boot);
  const ready = useWallet((state) => state.ready);
  const vault = useWallet((state) => state.vault);
  const keypair = useWallet((state) => state.keypair);
  const draft = useWallet((state) => state.draftMnemonic);
  const navigate = useNavigate();

  useEffect(() => {
    boot();
  }, [boot]);

  useEffect(() => {
    if (!ready) return;
    if (expect === "guest" && vault && keypair) {
      void navigate({ to: "/home" });
      return;
    }
    if (expect === "guest" && vault && !keypair) {
      void navigate({ to: "/unlock" });
      return;
    }
    if (expect === "draft" && !draft) {
      void navigate({ to: vault ? "/unlock" : "/" });
      return;
    }
    if (expect === "unlocked" && !vault) {
      void navigate({ to: "/" });
      return;
    }
    if (expect === "unlocked" && vault && !keypair) {
      void navigate({ to: "/unlock" });
    }
  }, [ready, expect, vault, keypair, draft, navigate]);

  return { ready, vault, keypair, draft };
}
