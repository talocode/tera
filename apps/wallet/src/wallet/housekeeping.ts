import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  StakeProgram,
  SystemProgram,
  Transaction,
  type Connection,
} from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, createCloseAccountInstruction } from "@solana/spl-token";

export type EmptyAccount = { address: string; mint: string; lamports: number };
export type ValidatorChoice = { vote: string; commission: number; stakeSol: number };

const PRIORITY_UNITS = 200_000;

export function priorityLamports(microLamports: number): bigint {
  return BigInt(Math.floor((PRIORITY_UNITS * microLamports) / 1_000_000));
}

export function withPriority(tx: Transaction, microLamports: number) {
  if (microLamports <= 0) return tx;
  tx.instructions.unshift(
    ComputeBudgetProgram.setComputeUnitLimit({ units: PRIORITY_UNITS }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
  );
  return tx;
}

export async function findEmptyTokenAccounts(connection: Connection, owner: PublicKey): Promise<EmptyAccount[]> {
  const found: EmptyAccount[] = [];
  for (const programId of [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]) {
    const accounts = await connection.getParsedTokenAccountsByOwner(owner, { programId });
    for (const item of accounts.value) {
      const info = item.account.data.parsed.info;
      if (BigInt(info.tokenAmount.amount) !== 0n) continue;
      found.push({
        address: item.pubkey.toBase58(),
        mint: String(info.mint),
        lamports: item.account.lamports,
      });
    }
  }
  return found;
}

export async function closeEmptyAccounts(opts: {
  connection: Connection;
  signer: Keypair;
  accounts: EmptyAccount[];
  microLamports: number;
}): Promise<string> {
  const { blockhash, lastValidBlockHeight } = await opts.connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({ feePayer: opts.signer.publicKey, blockhash, lastValidBlockHeight });
  for (const account of opts.accounts.slice(0, 8)) {
    const info = await opts.connection.getAccountInfo(new PublicKey(account.address));
    const programId = info?.owner.equals(TOKEN_2022_PROGRAM_ID) ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
    tx.add(
      createCloseAccountInstruction(
        new PublicKey(account.address),
        opts.signer.publicKey,
        opts.signer.publicKey,
        [],
        programId,
      ),
    );
  }
  withPriority(tx, opts.microLamports);
  tx.sign(opts.signer);
  const signature = await opts.connection.sendRawTransaction(tx.serialize());
  const result = await opts.connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  if (result.value.err) throw new Error("The network rejected the close.");
  return signature;
}

export async function listValidators(connection: Connection): Promise<ValidatorChoice[]> {
  const accounts = await connection.getVoteAccounts();
  return accounts.current
    .filter((item) => item.commission <= 10)
    .sort((a, b) => b.activatedStake - a.activatedStake)
    .slice(0, 6)
    .map((item) => ({
      vote: item.votePubkey,
      commission: item.commission,
      stakeSol: item.activatedStake / 1_000_000_000,
    }));
}

const STAKE_KEY = "tera.wallet.stake-accounts";

export function rememberedStakeAccounts(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STAKE_KEY) || "[]") as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function delegateSol(opts: {
  connection: Connection;
  signer: Keypair;
  vote: string;
  lamports: number;
  microLamports: number;
}): Promise<{ signature: string; stakeAccount: string }> {
  const rent = await opts.connection.getMinimumBalanceForRentExemption(StakeProgram.space);
  if (opts.lamports < rent) throw new Error("That amount does not cover the stake account rent.");
  const stake = Keypair.generate();
  const { blockhash, lastValidBlockHeight } = await opts.connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({ feePayer: opts.signer.publicKey, blockhash, lastValidBlockHeight });
  tx.add(
    SystemProgram.createAccount({
      fromPubkey: opts.signer.publicKey,
      newAccountPubkey: stake.publicKey,
      lamports: opts.lamports,
      space: StakeProgram.space,
      programId: StakeProgram.programId,
    }),
    StakeProgram.initialize({
      stakePubkey: stake.publicKey,
      authorized: { staker: opts.signer.publicKey, withdrawer: opts.signer.publicKey },
    }),
    StakeProgram.delegate({
      stakePubkey: stake.publicKey,
      authorizedPubkey: opts.signer.publicKey,
      votePubkey: new PublicKey(opts.vote),
    }),
  );
  withPriority(tx, opts.microLamports);
  tx.sign(opts.signer, stake);
  const signature = await opts.connection.sendRawTransaction(tx.serialize());
  const result = await opts.connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  if (result.value.err) throw new Error("The network rejected the stake.");
  const next = [stake.publicKey.toBase58(), ...rememberedStakeAccounts()].slice(0, 20);
  localStorage.setItem(STAKE_KEY, JSON.stringify(next));
  return { signature, stakeAccount: stake.publicKey.toBase58() };
}
