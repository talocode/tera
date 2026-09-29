import { isCluster, type Cluster, defaultCluster } from "./network";

const VAULT_KEY = "tera.wallet.vault.v1";
const CLUSTER_KEY = "tera.wallet.cluster.v1";
const ITERATIONS = 210_000;

export type VaultRecord = {
  v: 1;
  publicKey: string;
  kdf: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
};

function bytesToB64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function b64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function passcodeKey(passcode: string, salt: Uint8Array, iterations: number) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passcode),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function passcodeError(passcode: string): string | null {
  if (passcode.length < 6) return "Use at least 6 characters.";
  if (passcode.length > 64) return "Use 64 characters or fewer.";
  return null;
}

export async function sealMnemonic(mnemonic: string, passcode: string): Promise<Omit<VaultRecord, "v" | "publicKey">> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await passcodeKey(passcode, salt, ITERATIONS);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(mnemonic),
  );
  return {
    kdf: "PBKDF2-SHA256",
    iterations: ITERATIONS,
    salt: bytesToB64(salt),
    iv: bytesToB64(iv),
    ciphertext: bytesToB64(new Uint8Array(cipher)),
  };
}

export async function openMnemonic(record: VaultRecord, passcode: string): Promise<string> {
  const key = await passcodeKey(passcode, b64ToBytes(record.salt), record.iterations);
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBytes(record.iv) as BufferSource },
      key,
      b64ToBytes(record.ciphertext) as BufferSource,
    );
    return new TextDecoder().decode(plain);
  } catch {
    throw new Error("Wrong passcode.");
  }
}

export function readVault(): VaultRecord | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(VAULT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as VaultRecord;
    if (parsed?.v !== 1 || typeof parsed.publicKey !== "string" || typeof parsed.ciphertext !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeVault(record: VaultRecord) {
  localStorage.setItem(VAULT_KEY, JSON.stringify(record));
}

export function destroyVault() {
  localStorage.removeItem(VAULT_KEY);
}

export function readCluster(): Cluster {
  if (typeof localStorage === "undefined") return defaultCluster();
  const stored = localStorage.getItem(CLUSTER_KEY);
  return isCluster(stored) ? stored : defaultCluster();
}

export function writeCluster(cluster: Cluster) {
  localStorage.setItem(CLUSTER_KEY, cluster);
}
