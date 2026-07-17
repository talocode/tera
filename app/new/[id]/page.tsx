'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import PromptShell from '@/components/PromptShell'
import OnboardingScreen from '@/components/OnboardingScreen'
import QuickStartCards from '@/components/QuickStartCards'
import type { TeacherTool } from '@/components/ToolCard'
import { UniversalTool } from '@/lib/tools-data'
import type { QuickStartCategory } from '@/lib/activation'

export default function ChatSessionPage() {
    const params = useParams()
    const router = useRouter()
    const { user, userReady } = useAuth()
    const [selectedTool, setSelectedTool] = useState<TeacherTool>(UniversalTool)
    const searchParams = useSearchParams()
    const sessionId = params.id as string
    const initialPrompt = searchParams.get('prompt') || undefined
    const autoSend = searchParams.get('autoSend') === '1'

    const [showOnboarding, setShowOnboarding] = useState(false)
    const [onboardingChoice, setOnboardingChoice] = useState<QuickStartCategory | null>(null)
    const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false)

    // Check onboarding status
    useEffect(() => {
        if (!userReady || !user?.id || hasCheckedOnboarding) return

        const checkOnboarding = async () => {
            try {
                const res = await fetch('/api/activation', { method: 'GET' })
                const data = await res.json()
                const events = data.events || []
                const hasCompleted = events.some((e: any) => e.event_type === 'onboarding_completed')
                const hasViewed = events.some((e: any) => e.event_type === 'onboarding_viewed')

                if (!hasCompleted && !hasViewed) {
                    setShowOnboarding(true)
                    // Track onboarding viewed
                    await fetch('/api/activation', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ eventType: 'onboarding_viewed' }),
                    })
                } else if (hasCompleted) {
                    // Find the choice from events
                    const completedEvent = events.find((e: any) => e.event_type === 'onboarding_completed')
                    if (completedEvent?.metadata?.choice) {
                        setOnboardingChoice(completedEvent.metadata.choice)
                    }
                }
            } catch {
                // Non-critical: don't block chat if onboarding check fails
            } finally {
                setHasCheckedOnboarding(true)
            }
        }

        checkOnboarding()
    }, [userReady, user?.id, hasCheckedOnboarding])

    const handleOnboardingComplete = useCallback(async (choice: QuickStartCategory) => {
        setOnboardingChoice(choice)
        setShowOnboarding(false)

        try {
            await fetch('/api/activation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: 'onboarding_completed',
                    metadata: { choice },
                }),
            })
        } catch {}
    }, [])

    const handleQuickStartSelect = useCallback((prompt: string) => {
        const encoded = encodeURIComponent(prompt)
        router.replace(`/new/${sessionId}?prompt=${encoded}&autoSend=1`)
    }, [sessionId, router])

    const handleRequireSignIn = () => {
        router.push('/auth/signin')
    }

    return (
        <div className="w-full h-[100dvh] bg-tera-bg overflow-hidden text-tera-primary">
            {showOnboarding && (
                <OnboardingScreen
                    userName={user?.name}
                    onComplete={handleOnboardingComplete}
                />
            )}

            {!showOnboarding && hasCheckedOnboarding && onboardingChoice && !initialPrompt && (
                <QuickStartCards
                    category={onboardingChoice}
                    onSelect={handleQuickStartSelect}
                />
            )}

            <PromptShell
                tool={selectedTool}
                onToolChange={setSelectedTool}
                sessionId={sessionId}
                user={user}
                userReady={userReady}
                onRequireSignIn={handleRequireSignIn}
                initialPrompt={initialPrompt}
                autoSend={autoSend}
            />
        </div>
    )
}
