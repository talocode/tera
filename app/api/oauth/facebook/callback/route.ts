import { NextRequest, NextResponse } from 'next/server'

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character] || character))
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const error = searchParams.get('error')
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (error || !code || !state) {
    return new NextResponse('Authorization could not be completed. Return to the application and try again.', { status: 400 })
  }

  return new NextResponse(`<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Authorization complete</title></head><body><main><h1>Authorization complete</h1><p>Copy this one-time code and return it to the local setup.</p><code>${escapeHtml(code)}</code></main></body></html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}
