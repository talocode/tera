import { VersionedTransaction } from "@solana/web3.js";
import type { Keypair, Connection } from "@solana/web3.js";
import { DEFAULT_TCODE_MINT, SOL_DECIMALS, TCODE_DECIMALS } from "@/wallet/network";

export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const TCODE_MINT = DEFAULT_TCODE_MINT;

export type SwapAsset = {
  mint: string;
  symbol: string;
  decimals: number;
  amount: bigint;
};

export type JupiterQuote = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  priceImpactPct: string;
  slippageBps: number;
  routePlan?: { swapInfo?: { label?: string } }[];
};

function uiToBase(raw: string, decimals: number): bigint | null {
  const text = raw.trim();
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const [whole, frac = ""] = text.split(".");
  if (frac.length > decimals) return null;
  const padded = `${whole}${frac.padEnd(decimals, "0")}`;
  try {
    const value = BigInt(padded);
    return value > 0n ? value : null;
  } catch {
    return null;
  }
}

export function parseSwapAmount(raw: string, decimals: number): bigint | null {
  return uiToBase(raw, decimals);
}

export async function fetchQuote(opts: {
  inputMint: string;
  outputMint: string;
  amount: bigint;
  slippageBps: number;
}): Promise<JupiterQuote> {
  const params = new URLSearchParams({
    inputMint: opts.inputMint,
    outputMint: opts.outputMint,
    amount: opts.amount.toString(),
    slippageBps: String(opts.slippageBps),
  });
  const response = await fetch(`/.netlify/functions/jupiter?${params}`);
  const body = (await response.json()) as JupiterQuote & { error?: string };
  if (!response.ok || body.error || !body.outAmount) {
    throw new Error(body.error || "Jupiter could not quote that pair.");
  }
  return body;
}

export function routeLabels(quote: JupiterQuote): string[] {
  return (quote.routePlan ?? []).map((step) => step.swapInfo?.label).filter((label): label is string => Boolean(label));
}

export async function fetchOfficialPrices(): Promise<{ solUsd: number | null; tcodeUsd: number | null; tcodeLiquidity: number | null }> {
  const response = await fetch("/.netlify/functions/jupiter?action=price");
  const body = (await response.json()) as {
    sol?: { usdPrice?: number };
    tcode?: { usdPrice?: number; liquidity?: number };
    error?: string;
  };
  if (!response.ok) throw new Error(body.error || "Price unavailable.");
  return {
    solUsd: body.sol?.usdPrice ?? null,
    tcodeUsd: body.tcode?.usdPrice ?? null,
    tcodeLiquidity: body.tcode?.liquidity ?? null,
  };
}

export async function signAndSendSwap(opts: {
  connection: Connection;
  signer: Keypair;
  quote: JupiterQuote;
  prioritizationFeeLamports?: number;
}): Promise<string> {
  const response = await fetch("/.netlify/functions/jupiter", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quoteResponse: opts.quote,
      userPublicKey: opts.signer.publicKey.toBase58(),
      prioritizationFeeLamports: opts.prioritizationFeeLamports || undefined,
    }),
  });
  const body = (await response.json()) as { swapTransaction?: string; error?: string };
  if (!response.ok || !body.swapTransaction) {
    throw new Error(body.error || "Jupiter could not build the swap.");
  }
  const raw = Uint8Array.from(atob(body.swapTransaction), (char) => char.charCodeAt(0));
  const transaction = VersionedTransaction.deserialize(raw);
  transaction.sign([opts.signer]);
  const signature = await opts.connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });
  await opts.connection.confirmTransaction(signature, "confirmed");
  return signature;
}

export async function createLimitOrder(opts: {
  connection: Connection;
  signer: Keypair;
  inputMint: string;
  outputMint: string;
  makingAmount: string;
  takingAmount: string;
}): Promise<string> {
  const created = await fetch("/.netlify/functions/jupiter", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "limit",
      userPublicKey: opts.signer.publicKey.toBase58(),
      inputMint: opts.inputMint,
      outputMint: opts.outputMint,
      makingAmount: opts.makingAmount,
      takingAmount: opts.takingAmount,
    }),
  });
  const order = (await created.json()) as { transaction?: string; requestId?: string; error?: string };
  if (!created.ok || !order.transaction || !order.requestId) {
    throw new Error(order.error || "Jupiter could not build the limit order.");
  }
  const raw = Uint8Array.from(atob(order.transaction), (char) => char.charCodeAt(0));
  const transaction = VersionedTransaction.deserialize(raw);
  transaction.sign([opts.signer]);
  const signed = btoa(String.fromCharCode(...transaction.serialize()));
  const executed = await fetch("/.netlify/functions/jupiter", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "limit-execute",
      signedTransaction: signed,
      requestId: order.requestId,
    }),
  });
  const result = (await executed.json()) as { signature?: string; error?: string };
  if (!executed.ok || !result.signature) throw new Error(result.error || "Limit order was not accepted.");
  await opts.connection.confirmTransaction(result.signature, "confirmed");
  return result.signature;
}

export function outputChoices(holdings: SwapAsset[]): SwapAsset[] {
  const byMint = new Map(holdings.map((item) => [item.mint, item]));
  const sol = byMint.get(SOL_MINT) ?? byMint.get("SOL");
  const rows: SwapAsset[] = [];
  if (sol) rows.push({ ...sol, mint: SOL_MINT, symbol: "SOL", decimals: SOL_DECIMALS });
  if (!byMint.has(TCODE_MINT)) {
    rows.push({ mint: TCODE_MINT, symbol: "TCODE", decimals: TCODE_DECIMALS, amount: 0n });
  }
  for (const item of holdings) {
    if (item.mint === "SOL") continue;
    rows.push(item.mint === TCODE_MINT ? { ...item, symbol: "TCODE", decimals: TCODE_DECIMALS } : item);
  }
  return rows;
}
