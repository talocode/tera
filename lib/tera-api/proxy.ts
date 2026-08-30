import { NextResponse } from 'next/server'
import { TALOCODE_BASE_URL } from '@/lib/talocode'

/**
 * Passthrough proxy: forwards a teraai.chat /v1/* request unchanged to the
 * Talocode Cloud gateway (api.talocode.site). The gateway meters the caller's
 * API key and performs the model call, so teraai.chat never charges locally
 * and never holds a direct model credential.
 */
export async function proxyToTalocode(
  request: Request,
  options: { path: string },
): Promise<NextResponse> {
  const apiKey = request.headers.get('Authorization')
  if (!apiKey) {
    return NextResponse.json(
      { error: { code: 'missing_api_key', message: 'Authorization: Bearer <TALOCODE_API_KEY> required.' } },
      { status: 401 },
    )
  }

  let body: string
  try {
    body = await request.text()
  } catch {
    body = ''
  }

  const upstreamUrl = `${TALOCODE_BASE_URL}${options.path}`

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        Authorization: apiKey,
      },
      body: request.method === 'GET' ? undefined : body,
    })

    const text = await upstream.text()

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gateway unreachable.'
    return NextResponse.json(
      { error: { code: 'gateway_unavailable', message } },
      { status: 502 },
    )
  }
}