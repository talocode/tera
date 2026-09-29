import "./polyfill.ts";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  type ParsedTransactionWithMeta,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  clusterLabel,
  explorerTx,
  rpcUrlFor,
  tcodeMint,
  type Cluster,
  SOL_DECIMALS,
  TCODE_DECIMALS,
} from "./network";
import { formatTokenAmount } from "./amounts";

const BASE_FEE = 5_000n;
const TOKEN_ACCOUNT_SIZE = 165;

export type Holding = {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  amount: bigint;
  trusted: boolean;
  native: boolean;
};

export type Activity = {
  signature: string;
  time: number | null;
  status: "success" | "failed";
  direction: "in" | "out" | "other";
  label: string;
  amountText: string | null;
  explorerUrl: string;
};

export function connectionFor(cluster: Cluster): Connection {
  return new Connection(rpcUrlFor(cluster), "confirmed");
}

export function describeMint(mint: string, cluster: Cluster): Pick<Holding, "symbol" | "name" | "trusted"> {
  if (mint === "SOL") return { symbol: "SOL", name: "Solana", trusted: true };
  if (cluster === "mainnet-beta" && mint === tcodeMint()) {
    return { symbol: "TCODE", name: "Talocode", trusted: true };
  }
  return {
    symbol: "SPL",
    name: `${mint.slice(0, 4)}…${mint.slice(-4)}`,
    trusted: false,
  };
}

export async function loadHoldings(connection: Connection, owner: PublicKey, cluster: Cluster): Promise<Holding[]> {
  const lamports = BigInt(await connection.getBalance(owner));
  const sol: Holding = {
    mint: "SOL",
    symbol: "SOL",
    name: "Solana",
    decimals: SOL_DECIMALS,
    amount: lamports,
    trusted: true,
    native: true,
  };
  const tokens: Holding[] = [];
  for (const programId of [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]) {
    const response = await connection.getParsedTokenAccountsByOwner(owner, { programId });
    for (const item of response.value) {
      const info = item.account.data.parsed?.info;
      const amount = info?.tokenAmount;
      if (!info?.mint || !amount) continue;
      const mint = String(info.mint);
      const decimals = Number(amount.decimals);
      const base = BigInt(String(amount.amount));
      if (base === 0n) continue;
      const meta = describeMint(mint, cluster);
      tokens.push({
        mint,
        decimals,
        amount: base,
        native: false,
        ...meta,
      });
    }
  }
  tokens.sort((a, b) => {
    if (a.symbol === "TCODE") return -1;
    if (b.symbol === "TCODE") return 1;
    return a.symbol.localeCompare(b.symbol);
  });
  const tcode = tokens.find((token) => token.mint === tcodeMint());
  if (!tcode && cluster === "mainnet-beta") {
    tokens.unshift({
      mint: tcodeMint(),
      symbol: "TCODE",
      name: "Talocode",
      decimals: TCODE_DECIMALS,
      amount: 0n,
      trusted: true,
      native: false,
    });
  }
  return [sol, ...tokens];
}

async function mintProgram(connection: Connection, mint: PublicKey) {
  const info = await connection.getAccountInfo(mint);
  if (!info) throw new Error("That token mint was not found on this network.");
  if (info.owner.equals(TOKEN_2022_PROGRAM_ID)) return TOKEN_2022_PROGRAM_ID;
  if (info.owner.equals(TOKEN_PROGRAM_ID)) return TOKEN_PROGRAM_ID;
  throw new Error("This token uses a program Tera Wallet does not support.");
}

export async function estimateFee(opts: {
  connection: Connection;
  owner: PublicKey;
  mint: string;
  destination: PublicKey;
}): Promise<{ feeLamports: bigint; createsTokenAccount: boolean }> {
  let createsTokenAccount = false;
  let rent = 0n;
  if (opts.mint !== "SOL") {
    const mint = new PublicKey(opts.mint);
    const programId = await mintProgram(opts.connection, mint);
    const ata = await getAssociatedTokenAddress(mint, opts.destination, true, programId);
    const info = await opts.connection.getAccountInfo(ata);
    if (!info) {
      createsTokenAccount = true;
      rent = BigInt(await opts.connection.getMinimumBalanceForRentExemption(TOKEN_ACCOUNT_SIZE));
    }
  }
  return { feeLamports: BASE_FEE + rent, createsTokenAccount };
}

export async function submitTransfer(opts: {
  connection: Connection;
  signer: Keypair;
  destination: PublicKey;
  mint: string;
  amount: bigint;
}): Promise<string> {
  if (opts.amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Amount is too large for this client.");
  }
  const { blockhash, lastValidBlockHeight } = await opts.connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({
    feePayer: opts.signer.publicKey,
    blockhash,
    lastValidBlockHeight,
  });
  if (opts.mint === "SOL") {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: opts.signer.publicKey,
        toPubkey: opts.destination,
        lamports: Number(opts.amount),
      }),
    );
  } else {
    const mint = new PublicKey(opts.mint);
    const programId = await mintProgram(opts.connection, mint);
    const fromAta = await getAssociatedTokenAddress(mint, opts.signer.publicKey, false, programId);
    const toAta = await getAssociatedTokenAddress(mint, opts.destination, true, programId);
    const destInfo = await opts.connection.getAccountInfo(toAta);
    if (!destInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          opts.signer.publicKey,
          toAta,
          opts.destination,
          mint,
          programId,
        ),
      );
    }
    tx.add(createTransferInstruction(fromAta, toAta, opts.signer.publicKey, opts.amount, [], programId));
  }
  tx.sign(opts.signer);
  const signature = await opts.connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  const result = await opts.connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  if (result.value.err) {
    throw new Error("The network rejected the transaction.");
  }
  return signature;
}

function accountIndex(tx: ParsedTransactionWithMeta, owner: string): number {
  const keys = tx.transaction.message.accountKeys;
  return keys.findIndex((key) => key.pubkey.toBase58() === owner);
}

export async function loadActivity(connection: Connection, owner: PublicKey, cluster: Cluster): Promise<Activity[]> {
  const signatures = await connection.getSignaturesForAddress(owner, { limit: 12 });
  if (signatures.length === 0) return [];
  const parsed = await connection.getParsedTransactions(
    signatures.map((item) => item.signature),
    { maxSupportedTransactionVersion: 0 },
  );
  return signatures.map((item, index) => {
    const tx = parsed[index];
    const failed = Boolean(item.err);
    let direction: Activity["direction"] = "other";
    let label = "Transaction";
    let amountText: string | null = null;
    if (tx) {
      const ownerIndex = accountIndex(tx, owner.toBase58());
      const delta =
        ownerIndex >= 0 && tx.meta
          ? BigInt(tx.meta.postBalances[ownerIndex] ?? 0) - BigInt(tx.meta.preBalances[ownerIndex] ?? 0)
          : 0n;
      if (delta > 0n) {
        direction = "in";
        label = "Received SOL";
        amountText = `+${formatTokenAmount(delta, SOL_DECIMALS, 6)} SOL`;
      } else if (delta < 0n) {
        direction = "out";
        const fee = BigInt(tx.meta?.fee ?? 0);
        const spent = -delta > fee ? -delta - fee : -delta;
        label = "Sent SOL";
        amountText = `-${formatTokenAmount(spent, SOL_DECIMALS, 6)} SOL`;
      }
      const tokenChange = tokenDelta(tx, owner.toBase58());
      if (tokenChange) {
        direction = tokenChange.amount > 0n ? "in" : "out";
        const meta = describeMint(tokenChange.mint, cluster);
        label = `${tokenChange.amount > 0n ? "Received" : "Sent"} ${meta.symbol}`;
        const abs = tokenChange.amount > 0n ? tokenChange.amount : -tokenChange.amount;
        amountText = `${tokenChange.amount > 0n ? "+" : "-"}${formatTokenAmount(abs, tokenChange.decimals, 6)} ${meta.symbol}`;
      }
    }
    return {
      signature: item.signature,
      time: item.blockTime ? item.blockTime * 1000 : null,
      status: failed ? "failed" : "success",
      direction,
      label: failed ? `${label} failed` : label,
      amountText,
      explorerUrl: explorerTx(item.signature, cluster),
    };
  });
}

function tokenDelta(
  tx: ParsedTransactionWithMeta,
  owner: string,
): { mint: string; decimals: number; amount: bigint } | null {
  const pre = tx.meta?.preTokenBalances ?? [];
  const post = tx.meta?.postTokenBalances ?? [];
  const rows = new Map<string, { mint: string; decimals: number; pre: bigint; post: bigint }>();
  for (const row of pre) {
    if (row.owner !== owner) continue;
    rows.set(row.mint, {
      mint: row.mint,
      decimals: row.uiTokenAmount.decimals,
      pre: BigInt(row.uiTokenAmount.amount),
      post: 0n,
    });
  }
  for (const row of post) {
    if (row.owner !== owner) continue;
    const existing = rows.get(row.mint);
    if (existing) {
      existing.post = BigInt(row.uiTokenAmount.amount);
      existing.decimals = row.uiTokenAmount.decimals;
    } else {
      rows.set(row.mint, {
        mint: row.mint,
        decimals: row.uiTokenAmount.decimals,
        pre: 0n,
        post: BigInt(row.uiTokenAmount.amount),
      });
    }
  }
  let best: { mint: string; decimals: number; amount: bigint } | null = null;
  for (const row of rows.values()) {
    const amount = row.post - row.pre;
    if (amount === 0n) continue;
    const abs = amount < 0n ? -amount : amount;
    const bestAbs = best ? (best.amount < 0n ? -best.amount : best.amount) : -1n;
    if (!best || abs > bestAbs) best = { mint: row.mint, decimals: row.decimals, amount };
  }
  return best;
}

export function networkWarning(cluster: Cluster): string {
  return `Only send assets on ${clusterLabel(cluster)}. Assets sent on the wrong network can be lost.`;
}
