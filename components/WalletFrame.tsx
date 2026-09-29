'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from './ThemeProvider'

export default function WalletFrame() {
  const { theme } = useTheme()
  const frameRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const send = () => frame.contentWindow?.postMessage({ type: 'tera-theme', theme }, window.location.origin)
    send()
    frame.addEventListener('load', send)
    return () => frame.removeEventListener('load', send)
  }, [theme])

  return (
    <iframe
      ref={frameRef}
      title="Tera Wallet"
      src="/wallet-app/index.html?embed=1"
      className={`h-[calc(100dvh-4.25rem)] w-full border-0 md:h-[100dvh] ${theme === 'light' ? 'bg-[#f6f6f6]' : 'bg-[#0a0a0a]'}`}
    />
  )
}
