import { create } from "zustand";
import type { Keypair } from "@solana/web3.js";
import { createMnemonic, isValidMnemonic, keypairFromMnemonic, normalizeMnemonic } from "./keys";
import type { Cluster } from "./network";
import { destroyVault, destroyWatch, openMnemonic, publicWatch, readCluster, readVault, readWatch, sealMnemonic, writeCluster, writeVault, writeWatch, type VaultRecord, type WatchRecord } from "./vault";

type WalletState = {
  ready: boolean;
  vault: VaultRecord | null;
  watch: WatchRecord | null;
  cluster: Cluster;
  keypair: Keypair | null;
  draftMnemonic: string | null;
  confirmIndexes: number[];
  boot: () => void;
  beginCreate: () => void;
  beginImport: (phrase: string) => void;
  clearDraft: () => void;
  saveWithPasscode: (passcode: string) => Promise<void>;
  saveWatchOnly: () => void;
  takeKeyOffDevice: (passcode: string) => Promise<void>;
  unlock: (passcode: string) => Promise<void>;
  lock: () => void;
  setCluster: (cluster: Cluster) => void;
  revealPhrase: (passcode: string) => Promise<string>;
  forgetWallet: () => void;
};

function picksFor(phrase: string): number[] {
  const count = phrase.split(" ").length;
  const indexes = new Set<number>();
  while (indexes.size < 3) indexes.add(Math.floor(Math.random() * count));
  return [...indexes].sort((a, b) => a - b);
}

function reportCreatedWallet(address: string) {
  const key = `tera-wallet-reported:${address}`;
  try {
    if (sessionStorage.getItem(key) === "1") return;
  } catch {
    // Session storage can be unavailable. The request is still safe to send.
  }
  void fetch("/api/wallet/register", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ walletAddress: address }),
  })
    .then((response) => {
      if (!response.ok) return;
      try {
        sessionStorage.setItem(key, "1");
      } catch {
        // Ignore storage failures. The server already has the address.
      }
    })
    .catch(() => undefined);
}

function wipe(keypair: Keypair | null) {
  if (!keypair) return;
  keypair.secretKey.fill(0);
}

let lockArmed = false;

function armSessionLock() {
  if (lockArmed || typeof window === "undefined") return;
  lockArmed = true;
  let timer = 0;
  const lockIfHot = () => {
    if (useWallet.getState().keypair) useWallet.getState().lock();
  };
  const bump = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(lockIfHot, 120_000);
  };
  window.addEventListener("pointerdown", bump);
  window.addEventListener("keydown", bump);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") lockIfHot();
  });
  bump();
}

export const useWallet = create<WalletState>((set, get) => ({
  ready: false,
  vault: null,
  watch: null,
  cluster: "devnet",
  keypair: null,
  draftMnemonic: null,
  confirmIndexes: [],
  boot: () => {
    armSessionLock();
    set({
      ready: true,
      vault: readVault(),
      watch: readWatch(),
      cluster: readCluster(),
    });
  },
  beginCreate: () => {
    const mnemonic = createMnemonic();
    set({ draftMnemonic: mnemonic, confirmIndexes: picksFor(mnemonic) });
  },
  beginImport: (phrase: string) => {
    const mnemonic = normalizeMnemonic(phrase);
    if (!isValidMnemonic(mnemonic)) throw new Error("That recovery phrase is not valid.");
    set({ draftMnemonic: mnemonic, confirmIndexes: [] });
  },
  clearDraft: () => set({ draftMnemonic: null, confirmIndexes: [] }),
  saveWithPasscode: async (passcode: string) => {
    const mnemonic = get().draftMnemonic;
    if (!mnemonic) throw new Error("Start again. The recovery phrase is no longer on this device.");
    const keypair = keypairFromMnemonic(mnemonic);
    const sealed = await sealMnemonic(mnemonic, passcode);
    const vault: VaultRecord = { v: 1, publicKey: keypair.publicKey.toBase58(), ...sealed };
    writeVault(vault);
    destroyWatch();
    reportCreatedWallet(vault.publicKey);
    set({ vault, watch: null, keypair, draftMnemonic: null, confirmIndexes: [] });
  },
  saveWatchOnly: () => {
    const mnemonic = get().draftMnemonic;
    if (!mnemonic) throw new Error("Start again. The recovery phrase is no longer on this device.");
    const keypair = keypairFromMnemonic(mnemonic);
    const watch = publicWatch(keypair.publicKey.toBase58());
    wipe(keypair);
    destroyVault();
    writeWatch(watch);
    reportCreatedWallet(watch.publicKey);
    set({ vault: null, watch, keypair: null, draftMnemonic: null, confirmIndexes: [] });
  },
  takeKeyOffDevice: async (passcode: string) => {
    const vault = get().vault ?? readVault();
    if (!vault) throw new Error("No signing key is saved on this device.");
    const mnemonic = await openMnemonic(vault, passcode);
    const keypair = keypairFromMnemonic(mnemonic);
    if (keypair.publicKey.toBase58() !== vault.publicKey) {
      wipe(keypair);
      throw new Error("Saved wallet data does not match this recovery phrase.");
    }
    wipe(keypair);
    wipe(get().keypair);
    const watch = publicWatch(vault.publicKey);
    destroyVault();
    writeWatch(watch);
    set({ vault: null, watch, keypair: null, draftMnemonic: null, confirmIndexes: [] });
  },
  unlock: async (passcode: string) => {
    const vault = get().vault ?? readVault();
    if (!vault) throw new Error("No wallet is saved on this device.");
    const mnemonic = await openMnemonic(vault, passcode);
    const keypair = keypairFromMnemonic(mnemonic);
    if (keypair.publicKey.toBase58() !== vault.publicKey) {
      wipe(keypair);
      throw new Error("Saved wallet data does not match this recovery phrase.");
    }
    reportCreatedWallet(vault.publicKey);
    set({ vault, keypair });
  },
  lock: () => {
    wipe(get().keypair);
    set({ keypair: null, draftMnemonic: null, confirmIndexes: [] });
  },
  setCluster: (cluster: Cluster) => {
    writeCluster(cluster);
    set({ cluster });
  },
  revealPhrase: async (passcode: string) => {
    const vault = get().vault;
    if (!vault) throw new Error("No wallet is saved on this device.");
    return openMnemonic(vault, passcode);
  },
  forgetWallet: () => {
    wipe(get().keypair);
    destroyVault();
    destroyWatch();
    set({ vault: null, watch: null, keypair: null, draftMnemonic: null, confirmIndexes: [] });
  },
}));
