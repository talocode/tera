'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from './ThemeProvider'

const WALLET_SRC = 'https://tera-wallet.netlify.app/?embed=1'

export default function WalletFrame() {
  const { theme } = useTheme()
  const frameRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const send = () => frame.contentWindow?.postMessage({ type: 'tera-theme', theme }, 'https://tera-wallet.netlify.app')
    send()
    frame.addEventListener('load', send)
    return () => frame.removeEventListener('load', send)
  }, [theme])

  return (
    <iframe
      ref={frameRef}
      title="Tera Wallet"
      src={WALLET_SRC}
      className={`h-[calc(100dvh-4.25rem)] w-full border-0 md:h-[100dvh] ${theme === 'light' ? 'bg-[#f6f6f6]' : 'bg-[#0a0a0a]'}`}
    />
  )
}
