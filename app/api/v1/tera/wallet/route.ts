import { NextResponse } from 'next/server'
import { TcodeError } from '@/lib/tcode/crypto'
import { assertNoWalletSecrets, readPublicWallet, TERA_WALLET_PUBLIC } from '@/lib/blockchain-lab/real/public-wallet'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    object: 'tera.wallet',
    ...TERA_WALLET_PUBLIC,
  })
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: { code: 'invalid_request', message: 'Request body must be JSON.' } }, { status: 400 })
  }

  try {
    assertNoWalletSecrets(body)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Rejected.'
    return NextResponse.json({ error: { code: 'secret_rejected', message } }, { status: 400 })
  }

  const address = typeof body === 'object' && body && 'address' in body ? String((body as { address?: unknown }).address || '') : ''
  if (!address) {
    return NextResponse.json({
      object: 'tera.wallet',
      ...TERA_WALLET_PUBLIC,
    })
  }

  try {
    const result = await readPublicWallet(address.trim())
    return NextResponse.json({ object: 'tera.wallet.address', result })
  } catch (error) {
    if (error instanceof TcodeError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status })
    }
    return NextResponse.json({ error: { code: 'rpc_unavailable', message: 'Could not read that address from Solana.' } }, { status: 503 })
  }
}
