'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import PromptShell from '@/components/PromptShell'
import type { TeacherTool } from '@/components/ToolCard'
import { UniversalTool } from '@/lib/tools-data'

export default function ChatPage() {
  const { user, userReady } = useAuth()
  const [selectedTool, setSelectedTool] = useState<TeacherTool>(UniversalTool)
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('sessionId')
  const initialPrompt = searchParams.get('prompt') || undefined

  // Redirection logic for path-based sessions
  useEffect(() => {
    if (!sessionId) {
      const newId = crypto.randomUUID()
      const promptQuery = initialPrompt ? `?prompt=${encodeURIComponent(initialPrompt)}` : ''
      router.replace(`/new/${newId}${promptQuery}`)
    }
  }, [initialPrompt, sessionId, router])

  const handleRequireSignIn = () => {
    router.push('/auth/signin')
  }

  // If we are redirecting, we can show a loading state or just return null
  if (!sessionId) return null

  return (
    <div className="w-full h-[100dvh] bg-tera-bg overflow-hidden">
      <PromptShell
        tool={selectedTool}
        onToolChange={setSelectedTool}
        sessionId={sessionId}
        user={user}
        userReady={userReady}
        onRequireSignIn={handleRequireSignIn}
        initialPrompt={initialPrompt}
      />
    </div>
  )
}
