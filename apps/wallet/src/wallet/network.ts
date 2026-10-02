export const CLUSTERS = ["mainnet-beta", "devnet"] as const;
export type Cluster = (typeof CLUSTERS)[number];

export const DEFAULT_TCODE_MINT = "6ptxwABxQz8zMhwhiPeVgRgWjGMdVcEBFBv8v8C3ory";
export const TCODE_DECIMALS = 6;
export const SOL_DECIMALS = 9;

const PUBLIC_RPC: Record<Cluster, string> = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
};

/** Official mainnet answers browsers with HTTP 403. These allow CORS and the reads we need. */
const MAINNET_RPCS = [
  "https://public.rpc.solanavibestation.com",
  "https://solana-rpc.publicnode.com",
  "https://solana.leorpc.com/?api_key=FREE",
  "https://rpc.solanatracker.io/public",
] as const;

const DEVNET_RPCS = ["https://api.devnet.solana.com"] as const;

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

/** Ordered RPC list. A matching VITE_SOLANA_RPC_URL is tried first, then public endpoints that do not 403. */
export function rpcEndpoints(cluster: Cluster): string[] {
  const selected = rpcUrlFor(cluster);
  const defaults = cluster === "mainnet-beta" ? MAINNET_RPCS : DEVNET_RPCS;
  const preferred = selected === PUBLIC_RPC[cluster] ? [] : [selected];
  return [...new Set([...preferred, ...defaults])];
}

const RETRYABLE_RPC = /access forbidden|request blocked|not allowed|too many requests|rate limit|api key|personal token|forbidden|unavailable|internal json-rpc|paid plan/i;

export function isRetryableRpcFailure(status: number, body: string): boolean {
  if (status === 404 || status === 401 || status === 403 || status === 408 || status === 429 || status >= 500) return true;
  if (status < 200 || status >= 300) return true;
  try {
    const payload = JSON.parse(body) as { error?: { code?: number; message?: string } };
    if (!payload?.error) return false;
    const code = Number(payload.error.code);
    if (code === 403 || code === 429 || code === -32005 || code === -32029 || code === -32601) return true;
    return RETRYABLE_RPC.test(String(payload.error.message ?? ""));
  } catch {
    return RETRYABLE_RPC.test(body);
  }
}

/** POST the same JSON-RPC body to each endpoint and return the first usable response. */
export function fetchFirstHealthy(endpoints: readonly string[]): typeof fetch {
  return async (_input, init) => {
    const headers = new Headers(init?.headers);
    if (!headers.has("content-type")) headers.set("content-type", "application/json");
    let last: Response | null = null;
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: init?.body ?? undefined,
          signal: init?.signal ?? undefined,
        });
        const text = await response.text();
        const next = new Response(text, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
        if (!isRetryableRpcFailure(response.status, text)) return next;
        last = next;
      } catch (error) {
        if (init?.signal?.aborted) throw error;
      }
    }
    if (last) throw new Error("The Solana network is busy right now. Wait a moment and open the wallet again.");
    throw new Error("The Solana RPC is unavailable right now.");
  };
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
