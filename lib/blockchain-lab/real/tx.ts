export function compactU16(value: number): number[] {
  if (value >= 0 && value < 128) return [value]
  if (value >= 128 && value < 16384) return [(value | 0x80), value >> 7]
  if (value >= 16384 && value < 2097152) return [(value | 0x80), ((value >> 7) | 0x80), value >> 14]
  throw new Error('value too large for compact-u16')
}

export function u16FromBytes(bytes: Uint8Array, offset: number): { value: number; bytesRead: number } {
  let value = 0
  let length = 0
  for (;;) {
    const byte = bytes[offset + length]
    if (byte == null) throw new Error('truncated compact-u16')
    value |= (byte & 0x7f) << (7 * length)
    length += 1
    if (byte & 0x80) {
      if (length > 3) throw new Error('compact-u16 too long')
      continue
    }
    break
  }
  return { value, bytesRead: length }
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

function u32Le(value: number): Uint8Array {
  const out = new Uint8Array(4)
  new DataView(out.buffer).setUint32(0, value, true)
  return out
}

function u64Le(value: bigint): Uint8Array {
  const out = new Uint8Array(8)
  const view = new DataView(out.buffer)
  view.setUint32(0, Number(value & 0xffffffffn), true)
  view.setUint32(4, Number(value >> 32n), true)
  return out
}

export function base58FromBytes(bytes: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const digits = [0]
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i]
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8
      digits[j] = carry % 58
      carry = (carry / 58) | 0
    }
    while (carry > 0) {
      digits.push(carry % 58)
      carry = (carry / 58) | 0
    }
  }
  let result = ''
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) result += '1'
  for (let i = digits.length - 1; i >= 0; i--) result += ALPHABET[digits[i]]
  return result
}

export function bytesFromBase58(input: string): Uint8Array {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const bytes: number[] = []
  for (const char of input) {
    const digit = ALPHABET.indexOf(char)
    if (digit < 0) throw new Error('invalid base58 character')
    let carry = digit
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58
      bytes[j] = carry & 0xff
      carry >>= 8
    }
    while (carry > 0) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }
  for (let i = 0; i < input.length && input[i] === '1'; i++) bytes.push(0)
  const out = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[bytes.length - 1 - i]
  return out
}

const SYSTEM_PROGRAM = '11111111111111111111111111111111'
const SYSTEM_TRANSFER_INSTRUCTION = 2

export interface BuildTransferTxInput {
  feePayer: string
  to: string
  lamports: bigint
  blockhash: string
}

export function buildSolTransferMessage({ feePayer, to, lamports, blockhash }: BuildTransferTxInput): Uint8Array {
  const feePayerKey = bytesFromBase58(feePayer)
  const toKey = bytesFromBase58(to)
  const programKey = bytesFromBase58(SYSTEM_PROGRAM)

  const header = new Uint8Array([1, 0, 1])
  const accountKeys = concat([
    Uint8Array.from(compactU16(3)),
    feePayerKey,
    toKey,
    programKey,
  ])
  const recentBlockhash = bytesFromBase58(blockhash)

  const instructionData = concat([u32Le(SYSTEM_TRANSFER_INSTRUCTION), u64Le(lamports)])
  const instruction = concat([
    Uint8Array.from([2]),
    Uint8Array.from([2, 0, 1]),
    Uint8Array.from(compactU16(instructionData.length)),
    instructionData,
  ])

  return concat([header, accountKeys, recentBlockhash, Uint8Array.from([1]), instruction])
}

export function serializeUnsignedTransaction(message: Uint8Array): Uint8Array {
  const emptySignature = new Uint8Array(64)
  return concat([Uint8Array.from([1]), emptySignature, message])
}

export function serializeSignedTransaction(signature: Uint8Array, message: Uint8Array): Uint8Array {
  return concat([Uint8Array.from([1]), signature, message])
}