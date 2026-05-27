'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface LimitModalProps {
    isOpen: boolean
    limitType: 'chats' | 'file-uploads' | 'research-mode' | 'credits' | null
    currentPlan: string
    onClose: () => void
    unlocksAt?: Date
}

const LIMIT_INFO = {
    chats: {
        title: 'Something Went Wrong',
        message: 'There was an issue processing your message. Chats themselves are unlimited on every plan.',
        upgrade: 'Try again, or contact support if this keeps happening.',
    },
    'file-uploads': {
        title: 'File Upload Limit Reached',
        message: 'You have reached your daily file upload limit.',
        upgrade: 'Upgrade to Pro for 25 uploads or Plus for unlimited uploads.',
    },
    'research-mode': {
        title: 'Deep Research Mode',
        message: 'Deep Research uses Grokipedia as a canonical source for multi-step analytical reasoning and is available on Pro and Plus plans.',
        upgrade: 'Upgrade to unlock comprehensive research depth and high-density citations.',
    },
    credits: {
        title: 'Credit limit reached',
        message: 'Conversations are unlimited, but AI computational credits power responses. You have used your current credit allowance.',
        upgrade: 'Upgrade for more computational credits, or wait for your reset date.',
    },
} as const

export default function LimitModal({ isOpen, limitType, currentPlan: _currentPlan, onClose, unlocksAt }: LimitModalProps) {
    const router = useRouter()
    const [isClosing, setIsClosing] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState('')

    useEffect(() => {
        if (!unlocksAt) {
            setTimeRemaining('')
            return
        }

        const updateTime = () => {
            const diff = unlocksAt.getTime() - Date.now()

            if (diff <= 0) {
                setTimeRemaining('Available now')
                return
            }

            const hours = Math.floor(diff / (60 * 60 * 1000))
            const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
            setTimeRemaining(hours > 0 ? `${hours}h ${minutes}m remaining` : `${minutes}m remaining`)
        }

        updateTime()
        const interval = setInterval(updateTime, 60000)
        return () => clearInterval(interval)
    }, [unlocksAt])

    if (!isOpen || !limitType) return null

    const info = LIMIT_INFO[limitType]

    const closeModal = () => {
        setIsClosing(true)
        setTimeout(() => {
            setIsClosing(false)
            onClose()
        }, 200)
    }

    const handleUpgrade = () => {
        setIsClosing(true)
        setTimeout(() => {
            router.push('/pricing')
            setIsClosing(false)
            onClose()
        }, 200)
    }

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
            onClick={closeModal}
        >
            <div
                className={`relative w-full max-w-md rounded-2xl border border-tera-border bg-tera-panel p-6 shadow-2xl transition-all duration-200 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={closeModal}
                    className="absolute right-4 top-4 text-tera-secondary transition hover:text-tera-primary"
                    aria-label="Close modal"
                >
                    ×
                </button>

                <p className="tera-eyebrow">Usage limit</p>
                <h2 className="mt-3 text-2xl font-semibold text-tera-primary">{info.title}</h2>
                <p className="mt-4 text-sm leading-7 text-tera-secondary">{info.message}</p>
                <p className="mt-3 text-sm leading-7 text-tera-primary/90">{info.upgrade}</p>

                {timeRemaining && (
                    <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        {timeRemaining}
                    </div>
                )}

                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={closeModal}
                        className="tera-button-secondary flex-1 justify-center"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={handleUpgrade}
                        className="tera-button-primary flex-1 justify-center"
                    >
                        View plans
                    </button>
                </div>
            </div>
        </div>
    )
}
