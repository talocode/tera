import assert from "node:assert/strict";
import test from "node:test";
import { formatTokenAmount, maxSolSend, parseTokenAmount, validateSpend } from "./amounts.ts";
import { deriveEd25519Seed, isValidMnemonic, keypairFromMnemonic, normalizeMnemonic, parseAddress, SOLANA_PATH } from "./keys.ts";
import { DEFAULT_TCODE_MINT, explorerTx, isCluster, isRetryableRpcFailure, resolveRpc, rpcEndpoints } from "./network.ts";

const PHRASE =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

test("mnemonic validation accepts a standard phrase and rejects junk", () => {
  assert.equal(isValidMnemonic(PHRASE), true);
  assert.equal(isValidMnemonic("not a real phrase of words here today"), false);
  assert.equal(normalizeMnemonic("  Abandon   ABANDON abandon "), "abandon abandon abandon");
});

test("solana derivation matches ed25519-hd-key", async () => {
  const { derivePath } = await import("ed25519-hd-key");
  const { mnemonicToSeedSync } = await import("bip39");
  const seed = Buffer.from(mnemonicToSeedSync(PHRASE)).toString("hex");
  const expected = derivePath(SOLANA_PATH, seed).key;
  const actual = deriveEd25519Seed(SOLANA_PATH, seed);
  assert.equal(Buffer.from(actual).equals(expected), true);
  const first = keypairFromMnemonic(PHRASE);
  const second = keypairFromMnemonic(PHRASE.toUpperCase());
  assert.equal(first.publicKey.toBase58(), second.publicKey.toBase58());
  assert.equal(parseAddress(first.publicKey.toBase58()), first.publicKey.toBase58());
  assert.equal(parseAddress("not-an-address"), null);
  assert.equal(parseAddress(""), null);
});

test("amount parsing respects decimals and rejects overflow precision", () => {
  assert.equal(parseTokenAmount("1.5", 9), 1_500_000_000n);
  assert.equal(parseTokenAmount("0.000001", 6), 1n);
  assert.equal(parseTokenAmount("1.0000001", 6), null);
  assert.equal(parseTokenAmount("-1", 9), null);
  assert.equal(formatTokenAmount(1_500_000_000n, 9, 9), "1.5");
});

test("spend checks block overdrafts and missing fee SOL", () => {
  const overSol = validateSpend({
    raw: "1",
    decimals: 9,
    balance: 1_000_000_000n,
    feeLamports: 5_000n,
    isNativeSol: true,
  });
  assert.equal(overSol.ok, false);
  const okSol = validateSpend({
    raw: "0.5",
    decimals: 9,
    balance: 1_000_000_000n,
    feeLamports: 5_000n,
    isNativeSol: true,
  });
  assert.equal(okSol.ok, true);
  const tokenNoFee = validateSpend({
    raw: "1",
    decimals: 6,
    balance: 2_000_000n,
    feeLamports: 5_000n,
    solBalance: 1_000n,
    isNativeSol: false,
  });
  assert.equal(tokenNoFee.ok, false);
  assert.equal(maxSolSend(10_000n, 5_000n), 5_000n);
  assert.equal(maxSolSend(1_000n, 5_000n), 0n);
});

test("network helpers keep explorer links on the selected cluster", () => {
  assert.equal(isCluster("devnet"), true);
  assert.equal(isCluster("mainnet"), false);
  assert.match(explorerTx("sig", "devnet"), /cluster=devnet/);
  assert.doesNotMatch(explorerTx("sig", "mainnet-beta"), /cluster=/);
  assert.equal(DEFAULT_TCODE_MINT.length > 30, true);
  assert.equal(
    resolveRpc("devnet", { cluster: "devnet", rpc: "https://rpc.example/dev" }),
    "https://rpc.example/dev",
  );
  assert.equal(
    resolveRpc("mainnet-beta", { cluster: "devnet", rpc: "https://rpc.example/dev" }),
    "https://api.mainnet-beta.solana.com",
  );
  assert.equal(resolveRpc("devnet", { rpc: "https://rpc.example/dev" }), "https://api.devnet.solana.com");
  const mainnet = rpcEndpoints("mainnet-beta");
  assert.equal(mainnet[0], "https://public.rpc.solanavibestation.com");
  assert.equal(mainnet.includes("https://api.mainnet-beta.solana.com"), false);
  assert.equal(isRetryableRpcFailure(403, '{"error":{"code":403,"message":"Access forbidden"}}'), true);
  assert.equal(isRetryableRpcFailure(200, '{"result":{"value":0}}'), false);
});
