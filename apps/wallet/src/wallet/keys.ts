import "./polyfill.ts";
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39";
import { hmac } from "@noble/hashes/hmac";
import { sha512 } from "@noble/hashes/sha512";
import { Keypair, PublicKey } from "@solana/web3.js";

/** Standard Phantom / Solana CLI account 0 path. */
export const SOLANA_PATH = "m/44'/501'/0'/0'";

const ED25519_SEED = new TextEncoder().encode("ed25519 seed");
const HARDENED = 0x80000000;

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

/** SLIP-0010 Ed25519 child key derivation. Every Solana path segment is hardened. */
export function deriveEd25519Seed(path: string, seedHex: string): Uint8Array {
  if (!path.startsWith("m/")) throw new Error("Invalid derivation path");
  let material = hmac(sha512, ED25519_SEED, hexToBytes(seedHex));
  let key = material.slice(0, 32);
  let chain = material.slice(32);
  const segments = path
    .split("/")
    .slice(1)
    .map((part) => {
      if (!part.endsWith("'")) throw new Error("Solana derivation requires hardened segments");
      const index = Number.parseInt(part.slice(0, -1), 10);
      if (!Number.isInteger(index) || index < 0) throw new Error("Invalid derivation path");
      return index + HARDENED;
    });
  for (const index of segments) {
    const data = new Uint8Array(37);
    data.set(key, 1);
    data[33] = (index >>> 24) & 255;
    data[34] = (index >>> 16) & 255;
    data[35] = (index >>> 8) & 255;
    data[36] = index & 255;
    material = hmac(sha512, chain, data);
    key = material.slice(0, 32);
    chain = material.slice(32);
  }
  return key;
}

export function normalizeMnemonic(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean)
    .join(" ");
}

export function isValidMnemonic(input: string): boolean {
  const phrase = normalizeMnemonic(input);
  const words = phrase.split(" ");
  if (words.length !== 12 && words.length !== 24) return false;
  return validateMnemonic(phrase);
}

export function createMnemonic(): string {
  return generateMnemonic(128);
}

export function keypairFromMnemonic(input: string): Keypair {
  const phrase = normalizeMnemonic(input);
  if (!validateMnemonic(phrase)) {
    throw new Error("That recovery phrase is not valid.");
  }
  const seed = mnemonicToSeedSync(phrase);
  const derived = deriveEd25519Seed(SOLANA_PATH, Buffer.from(seed).toString("hex"));
  return Keypair.fromSeed(derived);
}

export function parseAddress(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  try {
    return new PublicKey(value).toBase58();
  } catch {
    return null;
  }
}

export function shortAddress(address: string, lead = 4, tail = 4): string {
  if (address.length <= lead + tail + 1) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}
