import { randomBytes } from 'node:crypto'
import { supabaseServer } from '@/lib/supabase-server'
import {
  TcodeError,
  decodeBase58,
  decodeSignature,
  isSolanaAddress,
  periodUtc,
  tokensFromRaw,
  verifyEd25519,
} from './crypto'
import {
  CHALLENGE_TTL_MS,
  TCODE_DECIMALS,
  TCODE_MINT,
  challengeMessage,
  getSolanaRpcUrl,
  tierFromTokens,
} from './config'

type LinkRow = {
  walletAddress: string
  linkedAt: string
}

async function rpcCall(rpcUrl: string, method: string, params: unknown[]) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  if (!response.ok) {
    throw new TcodeError(503, 'rpc_unavailable', 'Could not read $TCODE holdings from chain')
  }
  const payload = await response.json()
  if (payload.error) {
    throw new TcodeError(503, 'rpc_unavailable', 'Could not read $TCODE holdings from chain')
  }
  return payload.result
}

export async function fetchTokenRawBalance(owner: string, mint = TCODE_MINT): Promise<string> {
  const result = await rpcCall(getSolanaRpcUrl(), 'getTokenAccountsByOwner', [
    owner,
    { mint },
    { encoding: 'jsonParsed' },
  ])
  const accounts = result?.value || []
  let total = 0n
  for (const account of accounts) {
    const amount = account?.account?.data?.parsed?.info?.tokenAmount?.amount
    if (amount && /^\d+$/.test(String(amount))) total += BigInt(amount)
  }
  return total.toString()
}

export async function createChallenge(userId: string) {
  const nonce = randomBytes(32).toString('hex')
  const created = new Date()
  const expiresAt = new Date(created.getTime() + CHALLENGE_TTL_MS).toISOString()
  const message = challengeMessage({ userId, nonce, expiresAt })

  const { error } = await supabaseServer
    .from('credit_usage_events')
    .insert({
      user_id: userId,
      event_type: 'tcode_challenge',
      credits_charged: 0,
      token_usage: 0,
      metadata: {
        kind: 'tcode_challenge',
        nonce,
        message,
        expiresAt,
        used: false,
      },
    })

  if (error) {
    console.error('[tcode_challenge_save_failed]', { userId, error })
    throw new TcodeError(503, 'challenge_unavailable', 'Could not create wallet challenge')
  }

  return { nonce, expiresAt, message }
}

export async function linkWallet({
  userId,
  walletAddress,
  signature,
  nonce,
}: {
  userId: string
  walletAddress: string
  signature: string
  nonce: string
}) {
  if (!isSolanaAddress(walletAddress)) {
    throw new TcodeError(400, 'invalid_address', 'walletAddress must be a Solana address')
  }
  if (!nonce) throw new TcodeError(400, 'invalid_request', 'nonce is required')

  const now = new Date()
  const { data: challengeRows, error: challengeError } = await supabaseServer
    .from('credit_usage_events')
    .select('id, user_id, event_type, metadata')
    .eq('event_type', 'tcode_challenge')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (challengeError) {
    throw new TcodeError(503, 'challenge_unavailable', 'Could not read wallet challenge')
  }

  const row = (challengeRows || []).find((r) => r.metadata?.nonce === nonce)
  if (!row) throw new TcodeError(400, 'invalid_nonce', 'Challenge not found')
  if (row.metadata?.used) throw new TcodeError(400, 'invalid_nonce', 'Challenge already used')
  if (row.user_id !== userId) throw new TcodeError(400, 'invalid_nonce', 'Challenge does not match this account')
  const expiresAt = row.metadata?.expiresAt
  if (!expiresAt || new Date(expiresAt).getTime() <= now.getTime()) {
    throw new TcodeError(400, 'invalid_nonce', 'Challenge expired')
  }

  const pubkey = decodeBase58(walletAddress)
  const sig = decodeSignature(signature)
  const ok = verifyEd25519(pubkey, String(row.metadata?.message || ''), sig)
  if (!ok) throw new TcodeError(400, 'invalid_signature', 'Wallet signature did not match address')

  const { data: existingLinks, error: linkError } = await supabaseServer
    .from('credit_usage_events')
    .select('id, user_id')
    .eq('event_type', 'tcode_link')
    .eq('metadata->>walletAddress', walletAddress)
    .limit(5)

  if (linkError) {
    throw new TcodeError(503, 'link_unavailable', 'Could not persist wallet link')
  }

  const claimedByOther = (existingLinks || []).find((r) => r.user_id !== userId)
  if (claimedByOther) {
    throw new TcodeError(409, 'wallet_in_use', 'This Solana wallet is already linked to another Tera account')
  }

  const verifiedAt = now.toISOString()
  const { data: myLink, error: myLinkError } = await supabaseServer
    .from('credit_usage_events')
    .select('id')
    .eq('event_type', 'tcode_link')
    .eq('user_id', userId)
    .limit(1)

  if (myLinkError) {
    throw new TcodeError(503, 'link_unavailable', 'Could not persist wallet link')
  }

  const linkPayload = {
    event_type: 'tcode_link',
    credits_charged: 0,
    token_usage: 0,
    metadata: {
      kind: 'tcode_link',
      walletAddress,
      linkedAt: verifiedAt,
    },
  }

  if (myLink && myLink.length > 0) {
    const { error: updateError } = await supabaseServer
      .from('credit_usage_events')
      .update({ metadata: linkPayload.metadata })
      .eq('id', myLink[0].id)
    if (updateError) {
      throw new TcodeError(503, 'link_unavailable', 'Could not persist wallet link')
    }
  } else {
    const { error: insertError } = await supabaseServer
      .from('credit_usage_events')
      .insert({ user_id: userId, ...linkPayload })
    if (insertError) {
      throw new TcodeError(503, 'link_unavailable', 'Could not persist wallet link')
    }
  }

  await supabaseServer
    .from('credit_usage_events')
    .update({ metadata: { ...row.metadata, used: true } })
    .eq('id', row.id)

  return { linked: true, walletAddress, verifiedAt }
}

export async function getLink(userId: string): Promise<LinkRow | null> {
  const { data, error } = await supabaseServer
    .from('credit_usage_events')
    .select('metadata')
    .eq('event_type', 'tcode_link')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) return null
  const row = data?.[0]
  if (!row?.metadata?.walletAddress) return null
  return { walletAddress: row.metadata.walletAddress, linkedAt: row.metadata.linkedAt || null }
}

export async function hasClaimedPeriod(userId: string, period: string): Promise<boolean> {
  const { data, error } = await supabaseServer
    .from('credit_usage_events')
    .select('id')
    .eq('event_type', 'tcode_claim')
    .eq('user_id', userId)
    .eq('metadata->>period', period)
    .limit(1)

  if (error) return false
  return (data || []).length > 0
}

export async function getHoldings(userId: string) {
  const link = await getLink(userId)
  if (!link) throw new TcodeError(404, 'not_found', 'No linked wallet for this account')

  let rawBalance: string
  try {
    rawBalance = await fetchTokenRawBalance(link.walletAddress)
  } catch (error) {
    if (error instanceof TcodeError) throw error
    throw new TcodeError(503, 'rpc_unavailable', 'Could not read $TCODE holdings from chain')
  }

  const tcodeTokens = tokensFromRaw(rawBalance, TCODE_DECIMALS)
  const tier = tierFromTokens(tcodeTokens)
  const period = periodUtc()
  const claimedThisPeriod = await hasClaimedPeriod(userId, period)

  return {
    walletAddress: link.walletAddress,
    rawBalance,
    decimals: TCODE_DECIMALS,
    tcodeTokens,
    tier: tier ? { key: tier.key, minTCODE: tier.minTCODE, monthlyCredits: tier.monthlyCredits } : null,
    period,
    claimedThisPeriod,
    linkedAt: link.linkedAt,
  }
}

export async function claimForPeriod(userId: string, period: string) {
  const holdings = await getHoldings(userId)
  const periodToGrant = period || holdings.period
  if (periodToGrant !== holdings.period) {
    throw new TcodeError(400, 'invalid_request', `Period mismatch: expected ${holdings.period}`)
  }
  if (holdings.claimedThisPeriod) {
    return {
      granted: 0,
      alreadyClaimed: true,
      reason: 'already_claimed',
      period: periodToGrant,
      tier: holdings.tier,
      tcodeTokens: holdings.tcodeTokens,
    }
  }
  if (!holdings.tier) {
    return {
      granted: 0,
      alreadyClaimed: false,
      reason: 'below_tier',
      period: periodToGrant,
      tier: null,
      tcodeTokens: holdings.tcodeTokens,
    }
  }

  const credits = holdings.tier.monthlyCredits

  const receipt = {
    kind: 'tcode_claim',
    period: periodToGrant,
    tierKey: holdings.tier.key,
    credits,
    walletAddress: holdings.walletAddress,
    rawBalance: holdings.rawBalance,
    decimals: holdings.decimals,
    tcodeTokens: holdings.tcodeTokens,
  }

  const { data: inserted, error: insertError } = await supabaseServer
    .from('credit_usage_events')
    .insert({
      user_id: userId,
      event_type: 'tcode_claim',
      credits_charged: credits,
      token_usage: 0,
      metadata: receipt,
    })
    .select('id')
    .maybeSingle()

  if (insertError) {
    console.error('[tcode_claim_save_failed]', { userId, period: periodToGrant, error: insertError })
    throw new TcodeError(503, 'claim_unavailable', 'Could not record monthly credit claim')
  }

  return {
    granted: credits,
    alreadyClaimed: false,
    reason: 'granted',
    period: periodToGrant,
    tier: holdings.tier,
    tcodeTokens: holdings.tcodeTokens,
    receiptId: inserted?.id || null,
  }
}