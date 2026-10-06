import { randomBytes } from 'node:crypto'
import { supabaseServer } from '@/lib/supabase-server'
import { getUserCreditsRemaining } from '@/lib/free-plan-credits'
import {
  TcodeError,
  decodeBase58,
  decodeSignature,
  isSolanaAddress,
  periodUtc,
  tokensFromRaw,
  verifyEd25519,
} from './crypto'
import { rpcCall as solanaRpc } from '@/lib/blockchain-lab/real/rpc'
import {
  CHALLENGE_TTL_MS,
  TCODE_DECIMALS,
  TCODE_MINT,
  TCODE_REFILL_CREDITS,
  TCODE_REFILL_MAX_PER_PERIOD,
  TCODE_REFILL_MIN_EXTRA,
  challengeMessage,
  refillClawback,
  tierFromTokens,
} from './config'

type LinkRow = {
  walletAddress: string
  linkedAt: string
}

type CreditEventRow = {
  id: string
  metadata?: Record<string, any> | null
  created_at?: string
}

export async function fetchTokenRawBalance(owner: string, mint = TCODE_MINT): Promise<string> {
  const result = await solanaRpc<{ value?: { account?: { data?: { parsed?: { info?: { tokenAmount?: { amount?: string } } } } } }[] }>(
    'getTokenAccountsByOwner',
    [owner, { mint }, { encoding: 'jsonParsed' }],
  )
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

async function listCreditEvents(userId: string, eventType: string): Promise<CreditEventRow[]> {
  const { data, error } = await supabaseServer
    .from('credit_usage_events')
    .select('id, metadata, created_at')
    .eq('event_type', eventType)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) {
    throw new TcodeError(503, 'claim_unavailable', 'Could not read credit history')
  }
  return (data || []) as CreditEventRow[]
}

function wholeFromMetadata(row: CreditEventRow | null | undefined, key: string) {
  return Math.floor(Number(row?.metadata?.[key] || 0))
}

async function unsettledRefills(userId: string, period: string) {
  const rows = await listCreditEvents(userId, 'tcode_refill')
  return rows.filter((row) => {
    const refillPeriod = String(row.metadata?.period || '')
    return refillPeriod && refillPeriod < period && row.metadata?.settled !== true
  })
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

export async function getRefillStatusForUser(userId: string, wholeTokens: number) {
  const period = periodUtc()
  const whole = Math.floor(Number(wholeTokens) || 0)
  let creditsRemaining = 0
  try {
    const credits = await getUserCreditsRemaining(userId)
    creditsRemaining = Math.max(0, Math.floor(Number(credits.remaining) || 0))
  } catch (error) {
    console.error('[tcode_refill_credit_read_failed]', { userId, error })
    return {
      credits: TCODE_REFILL_CREDITS,
      maxPerPeriod: TCODE_REFILL_MAX_PER_PERIOD,
      usedThisPeriod: 0,
      remainingThisPeriod: 0,
      baselineTokens: null,
      requiredTokens: null,
      eligible: false,
      reason: 'credits_unknown',
      period,
      creditsRemaining: null,
    }
  }

  const [refills, claims] = await Promise.all([
    listCreditEvents(userId, 'tcode_refill'),
    listCreditEvents(userId, 'tcode_claim'),
  ])
  const periodRefills = refills.filter((row) => row.metadata?.period === period)
  const periodClaim = [...claims].reverse().find((row) => row.metadata?.period === period) || null
  const used = periodRefills.length
  const baseline = periodRefills.length
    ? wholeFromMetadata(periodRefills[periodRefills.length - 1], 'balanceAtRefill')
    : periodClaim
      ? wholeFromMetadata(periodClaim, 'tcodeTokens')
      : null
  const required = baseline == null ? null : baseline + TCODE_REFILL_MIN_EXTRA

  let reason = 'eligible'
  if (whole < 1) reason = 'below_mint'
  else if (!periodClaim) reason = 'claim_first'
  else if (used >= TCODE_REFILL_MAX_PER_PERIOD) reason = 'limit'
  else if (creditsRemaining > 0) reason = 'has_credits'
  else if (required != null && whole < required) reason = 'need_more_tokens'

  return {
    credits: TCODE_REFILL_CREDITS,
    maxPerPeriod: TCODE_REFILL_MAX_PER_PERIOD,
    usedThisPeriod: used,
    remainingThisPeriod: Math.max(0, TCODE_REFILL_MAX_PER_PERIOD - used),
    baselineTokens: baseline,
    requiredTokens: required,
    eligible: reason === 'eligible',
    reason,
    period,
    creditsRemaining,
  }
}

export async function refillCredits(userId: string) {
  const holdings = await getHoldings(userId)
  const whole = Math.floor(holdings.tcodeTokens)
  const status = await getRefillStatusForUser(userId, whole)
  if (!status.eligible) {
    return {
      granted: 0,
      reason: status.reason,
      period: status.period,
      requiredTokens: status.requiredTokens,
      balanceAtRefill: whole,
      usedThisPeriod: status.usedThisPeriod,
      remainingThisPeriod: status.remainingThisPeriod,
      tcodeTokens: holdings.tcodeTokens,
      receiptId: null,
    }
  }

  const receipt = {
    kind: 'tcode_refill',
    period: holdings.period,
    credits: TCODE_REFILL_CREDITS,
    baselineTokens: status.baselineTokens,
    requiredTokens: status.requiredTokens,
    balanceAtRefill: whole,
    walletAddress: holdings.walletAddress,
    rawBalance: holdings.rawBalance,
    tcodeTokens: holdings.tcodeTokens,
    settled: false,
  }

  const { data: inserted, error: insertError } = await supabaseServer
    .from('credit_usage_events')
    .insert({
      user_id: userId,
      event_type: 'tcode_refill',
      credits_charged: TCODE_REFILL_CREDITS,
      token_usage: 0,
      metadata: receipt,
    })
    .select('id')
    .maybeSingle()

  if (insertError) {
    console.error('[tcode_refill_save_failed]', { userId, period: holdings.period, error: insertError })
    throw new TcodeError(503, 'refill_unavailable', 'Could not record refill')
  }

  return {
    granted: TCODE_REFILL_CREDITS,
    reason: 'granted',
    period: holdings.period,
    requiredTokens: status.requiredTokens,
    balanceAtRefill: whole,
    usedThisPeriod: status.usedThisPeriod + 1,
    remainingThisPeriod: Math.max(0, status.remainingThisPeriod - 1),
    tcodeTokens: holdings.tcodeTokens,
    receiptId: inserted?.id || null,
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
      clawedBack: 0,
      receiptId: null,
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
      clawedBack: 0,
      receiptId: null,
    }
  }

  const whole = Math.floor(holdings.tcodeTokens)
  const unsettled = await unsettledRefills(userId, periodToGrant)
  const clawedBack = refillClawback(
    whole,
    unsettled.map((row) => ({
      balanceAtRefill: Number(row.metadata?.balanceAtRefill || 0),
      credits: Number(row.metadata?.credits || 0),
    })),
  )
  const credits = Math.max(0, holdings.tier.monthlyCredits - clawedBack)

  const receipt = {
    kind: 'tcode_claim',
    period: periodToGrant,
    tierKey: holdings.tier.key,
    credits,
    grossCredits: holdings.tier.monthlyCredits,
    clawedBack,
    clawedRefillIds: unsettled
      .filter((row) => whole < Math.floor(Number(row.metadata?.balanceAtRefill || 0)))
      .map((row) => row.id),
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

  for (const row of unsettled) {
    const { error: settleError } = await supabaseServer
      .from('credit_usage_events')
      .update({
        metadata: {
          ...row.metadata,
          settled: true,
          settledPeriod: periodToGrant,
          kept: whole >= Math.floor(Number(row.metadata?.balanceAtRefill || 0)),
        },
      })
      .eq('id', row.id)
    if (settleError) {
      console.error('[tcode_refill_settle_failed]', { userId, refillId: row.id, error: settleError })
    }
  }

  return {
    granted: credits,
    alreadyClaimed: false,
    reason: 'granted',
    period: periodToGrant,
    tier: holdings.tier,
    tcodeTokens: holdings.tcodeTokens,
    clawedBack,
    receiptId: inserted?.id || null,
  }
}
