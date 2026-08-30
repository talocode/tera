import { createPublicKey, verify } from 'node:crypto'

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')

export class TcodeError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'TcodeError'
    this.status = status
    this.code = code
  }
}

export function encodeBase58(input: string | Uint8Array | Buffer): string {
  const bytes = Buffer.from(input as Buffer)
  let zeros = 0
  while (zeros < bytes.length && bytes[zeros] === 0) zeros += 1
  const digits = [0]
  for (let i = zeros; i < bytes.length; i += 1) {
    let carry = bytes[i]
    for (let j = 0; j < digits.length; j += 1) {
      carry += digits[j] << 8
      digits[j] = carry % 58
      carry = (carry / 58) | 0
    }
    while (carry > 0) {
      digits.push(carry % 58)
      carry = (carry / 58) | 0
    }
  }
  let out = '1'.repeat(zeros)
  if (digits.length === 1 && digits[0] === 0) return out
  for (let i = digits.length - 1; i >= 0; i -= 1) out += BASE58[digits[i]]
  return out
}

export function decodeBase58(str: string): Buffer {
  if (!str || typeof str !== 'string') {
    throw new TcodeError(400, 'invalid_address', 'Invalid Solana address')
  }
  const bytes: number[] = []
  for (let i = 0; i < str.length; i += 1) {
    const val = BASE58.indexOf(str[i])
    if (val < 0) throw new TcodeError(400, 'invalid_address', 'Invalid Solana address')
    let carry = val
    for (let j = 0; j < bytes.length; j += 1) {
      carry += bytes[j] * 58
      bytes[j] = carry & 0xff
      carry >>= 8
    }
    while (carry > 0) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }
  for (let i = 0; i < str.length && str[i] === '1'; i += 1) bytes.push(0)
  bytes.reverse()
  return Buffer.from(bytes)
}

export function isSolanaAddress(value: string): boolean {
  try {
    return decodeBase58(value).length === 32
  } catch {
    return false
  }
}

export function decodeSignature(value: string): Buffer {
  if (!value || typeof value !== 'string') {
    throw new TcodeError(400, 'invalid_signature', 'signature is required')
  }
  const trimmed = value.trim()
  if (/^[0-9a-fA-F]{128}$/.test(trimmed)) return Buffer.from(trimmed, 'hex')
  try {
    const from58 = decodeBase58(trimmed)
    if (from58.length === 64) return from58
  } catch {
    /* try base64 next */
  }
  try {
    const from64 = Buffer.from(trimmed, 'base64')
    if (from64.length === 64) return from64
  } catch {
    /* fall through */
  }
  throw new TcodeError(400, 'invalid_signature', 'signature must be 64-byte base58, base64, or hex')
}

export function verifyEd25519(publicKey32: Buffer, messageBytes: string | Uint8Array, signature64: Buffer): boolean {
  if (!publicKey32 || publicKey32.length !== 32) return false
  if (!signature64 || signature64.length !== 64) return false
  try {
    const key = createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(publicKey32)]),
      format: 'der',
      type: 'spki',
    })
    return verify(null, Buffer.from(messageBytes), key, Buffer.from(signature64))
  } catch {
    return false
  }
}

export function periodUtc(date: Date = new Date()): string {
  return date.toISOString().slice(0, 7)
}

export function tokensFromRaw(raw: string | number, decimals: number): number {
  const rawStr = String(raw ?? '0')
  if (!/^\d+$/.test(rawStr)) return 0
  const places = Number(decimals)
  if (!Number.isInteger(places) || places < 0 || places > 18) return 0
  if (places === 0) return Number(rawStr)
  const padded = rawStr.padStart(places + 1, '0')
  const whole = padded.slice(0, padded.length - places)
  return Number(whole)
}