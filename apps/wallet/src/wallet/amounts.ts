const DECIMAL = /^(\d+)(?:\.(\d+))?$/;

export function parseTokenAmount(raw: string, decimals: number): bigint | null {
  const input = raw.trim();
  if (!DECIMAL.test(input)) return null;
  const match = DECIMAL.exec(input);
  if (!match) return null;
  const whole = match[1] ?? "0";
  const frac = match[2] ?? "";
  if (whole.length > 1 && whole.startsWith("0")) return null;
  if (frac.length > decimals) return null;
  const padded = frac.padEnd(decimals, "0");
  try {
    return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(padded || "0");
  } catch {
    return null;
  }
}

export function formatTokenAmount(base: bigint, decimals: number, maxFrac = decimals): string {
  const negative = base < 0n;
  const value = negative ? -base : base;
  const scale = 10n ** BigInt(decimals);
  const whole = value / scale;
  const frac = value % scale;
  let fracText = frac.toString().padStart(decimals, "0").slice(0, maxFrac);
  fracText = fracText.replace(/0+$/, "");
  const body = fracText ? `${whole.toString()}.${fracText}` : whole.toString();
  return negative ? `-${body}` : body;
}

export type AmountCheck =
  | { ok: true; base: bigint }
  | { ok: false; error: string };

export function validateSpend(opts: {
  raw: string;
  decimals: number;
  balance: bigint;
  feeLamports?: bigint;
  solBalance?: bigint;
  isNativeSol: boolean;
}): AmountCheck {
  const base = parseTokenAmount(opts.raw, opts.decimals);
  if (base === null) return { ok: false, error: "Enter a valid amount." };
  if (base <= 0n) return { ok: false, error: "Amount must be greater than zero." };
  if (opts.isNativeSol) {
    const fee = opts.feeLamports ?? 0n;
    if (base + fee > opts.balance) {
      return {
        ok: false,
        error: "Not enough SOL to cover the amount and the network fee.",
      };
    }
    return { ok: true, base };
  }
  if (base > opts.balance) return { ok: false, error: "Amount is higher than your balance." };
  const fee = opts.feeLamports ?? 0n;
  if ((opts.solBalance ?? 0n) < fee) {
    return { ok: false, error: "Not enough SOL to pay the network fee." };
  }
  return { ok: true, base };
}

export function maxSolSend(balance: bigint, feeLamports: bigint): bigint {
  const max = balance - feeLamports;
  return max > 0n ? max : 0n;
}
