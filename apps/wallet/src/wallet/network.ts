export const CLUSTERS = ["mainnet-beta", "devnet"] as const;
export type Cluster = (typeof CLUSTERS)[number];

export const DEFAULT_TCODE_MINT = "6ptxwABxQz8zMhwhiPeVgRgWjGMdVcEBFBv8v8C3ory";
export const TCODE_DECIMALS = 6;
export const SOL_DECIMALS = 9;

const PUBLIC_RPC: Record<Cluster, string> = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
};

function readEnv(name: string): string | undefined {
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  const value = env?.[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function isCluster(value: string | null | undefined): value is Cluster {
  return value === "mainnet-beta" || value === "devnet";
}

/** Production builds default to mainnet. Everything else defaults to devnet. */
export function defaultCluster(): Cluster {
  const configured = readEnv("VITE_SOLANA_CLUSTER");
  if (isCluster(configured)) return configured;
  const env = (import.meta as { env?: { PROD?: boolean } }).env;
  return env?.PROD ? "mainnet-beta" : "devnet";
}

/** An RPC override applies only to the cluster named in the environment. */
export function resolveRpc(cluster: Cluster, env: { cluster?: string; rpc?: string }): string {
  if (env.rpc && env.cluster === cluster) return env.rpc;
  return PUBLIC_RPC[cluster];
}

export function rpcUrlFor(cluster: Cluster): string {
  return resolveRpc(cluster, {
    cluster: readEnv("VITE_SOLANA_CLUSTER"),
    rpc: readEnv("VITE_SOLANA_RPC_URL"),
  });
}

export function tcodeMint(): string {
  return readEnv("VITE_TCODE_MINT") ?? DEFAULT_TCODE_MINT;
}

export function clusterLabel(cluster: Cluster): string {
  return cluster === "mainnet-beta" ? "Solana mainnet" : "Solana devnet";
}

export function explorerTx(signature: string, cluster: Cluster): string {
  const base = `https://explorer.solana.com/tx/${signature}`;
  return cluster === "devnet" ? `${base}?cluster=devnet` : base;
}

export function explorerAddress(address: string, cluster: Cluster): string {
  const base = `https://explorer.solana.com/address/${address}`;
  return cluster === "devnet" ? `${base}?cluster=devnet` : base;
}
