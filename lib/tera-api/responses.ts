import { NextResponse } from 'next/server'
import type { TeraApiError } from './errors'

export interface UsageMeta {
  credits: number
  action: string
}

export interface TeraApiSuccess<T> {
  id: string
  object: string
  result: T
  usage: UsageMeta
}

export function okJson<T>(data: TeraApiSuccess<T>, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

export function errorJson(err: TeraApiError, status: number, extraHeaders?: Record<string, string>): NextResponse {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...extraHeaders,
  }
  return new NextResponse(JSON.stringify(err), { status, headers })
}

export interface TeraApiHeaders {
  'x-tera-request-id': string
  'x-tera-api-action': string
  'x-tera-credits-charged': string
  'x-tera-billing-provider': string
  'x-tera-capability': string
}

export function makeResponseHeaders(opts: {
  requestId: string
  action: string
  credits: number
  capability: string
}): TeraApiHeaders {
  return {
    'x-tera-request-id': opts.requestId,
    'x-tera-api-action': opts.action,
    'x-tera-credits-charged': String(opts.credits),
    'x-tera-billing-provider': 'stacklane',
    'x-tera-capability': opts.capability,
  }
}
