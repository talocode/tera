'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-tera-bg/95 backdrop-blur-2xl">
      <div className="flex flex-col items-center gap-5 rounded-[32px] border border-tera-border bg-tera-panel/82 px-8 py-6 shadow-soft-lg md:gap-6 md:px-10 md:py-8">
        <div className="relative h-[56px] w-[170px] md:h-[67px] md:w-[200px]">
          <Image src="/images/TERA_LOGO_ONLY1.png" alt="Tera Logo" fill className="object-contain block dark:hidden" priority />
          <Image src="/images/TERA_LOGO_ONLY.png" alt="Tera Logo" fill className="hidden object-contain dark:block" priority />
        </div>
        <div className="flex gap-2">
          <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-tera-neon" style={{ animationDelay: '0ms' }} />
          <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-tera-neon" style={{ animationDelay: '150ms' }} />
          <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-tera-neon" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
