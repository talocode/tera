import { create } from "zustand";
import type { Keypair } from "@solana/web3.js";
import { createMnemonic, isValidMnemonic, keypairFromMnemonic, normalizeMnemonic } from "./keys";
import type { Cluster } from "./network";
import { destroyVault, openMnemonic, readCluster, readVault, sealMnemonic, writeCluster, writeVault, type VaultRecord } from "./vault";

type WalletState = {
  ready: boolean;
  vault: VaultRecord | null;
  cluster: Cluster;
  keypair: Keypair | null;
  draftMnemonic: string | null;
  confirmIndexes: number[];
  boot: () => void;
  beginCreate: () => void;
  beginImport: (phrase: string) => void;
  clearDraft: () => void;
  saveWithPasscode: (passcode: string) => Promise<void>;
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

function wipe(keypair: Keypair | null) {
  if (!keypair) return;
  keypair.secretKey.fill(0);
}

export const useWallet = create<WalletState>((set, get) => ({
  ready: false,
  vault: null,
  cluster: "devnet",
  keypair: null,
  draftMnemonic: null,
  confirmIndexes: [],
  boot: () => {
    set({
      ready: true,
      vault: readVault(),
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
    set({ vault, keypair, draftMnemonic: null, confirmIndexes: [] });
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
    set({ vault: null, keypair: null, draftMnemonic: null, confirmIndexes: [] });
  },
}));
