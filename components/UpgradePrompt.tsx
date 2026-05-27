'use client'

import Link from 'next/link'

interface UpgradePromptProps {
    type: 'lesson-plans' | 'chats' | 'file-uploads' | 'research-mode' | 'credits'
    onClose?: () => void
    inline?: boolean
}

const PROMPTS = {
    'lesson-plans': {
        title: 'Lesson Plan Limit Reached',
        description: 'You have reached your monthly lesson plan limit.',
        benefit: 'Upgrade to Pro for more lesson plans and advanced features.',
        icon: 'LP',
    },
    chats: {
        title: 'Something Went Wrong',
        description: 'There was an issue processing your message. Chats themselves are unlimited on every plan.',
        benefit: 'Please try again or contact support if this persists.',
        icon: 'AI',
    },
    'file-uploads': {
        title: 'File Upload Limit Reached',
        description: 'You have reached your daily file upload limit.',
        benefit: 'Upgrade to Pro for more uploads or Plus for unlimited uploads.',
        icon: 'UP',
    },
    'research-mode': {
        title: 'Deep Research Mode',
        description: 'Deep Research uses Grokipedia as a canonical source for multi-step analytical reasoning.',
        benefit: 'Upgrade to Pro to unlock comprehensive research depth and high-density citations.',
        icon: 'DR',
    },
    credits: {
        title: 'Credit limit reached',
        description: 'Conversations are unlimited, but AI computational credits power responses.',
        benefit: 'Upgrade to Pro or Plus for more computational credits, or wait for your reset date.',
        icon: 'CR',
    },
} as const

export default function UpgradePrompt({ type, onClose, inline = false }: UpgradePromptProps) {
    const message = PROMPTS[type]

    if (inline) {
        return (
            <div className="rounded-xl border border-tera-neon/30 bg-tera-neon/10 p-4">
                <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-tera-neon/30 text-xs font-semibold text-tera-primary">
                        {message.icon}
                    </span>
                    <div className="flex-1">
                        <h3 className="mb-1 font-semibold text-tera-primary">{message.title}</h3>
                        <p className="mb-3 text-sm text-tera-primary/70">{message.description}</p>
                        <p className="mb-3 text-sm font-medium text-tera-neon">{message.benefit}</p>
                        <Link href="/pricing" className="tera-button-upgrade inline-block rounded-lg px-4 py-2 text-sm font-medium">
                            View Plans
                        </Link>
                    </div>
                    {onClose && (
                        <button type="button" onClick={onClose} className="text-tera-secondary transition hover:text-tera-primary" aria-label="Close">
                            ×
                        </button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative mx-4 w-full max-w-md rounded-2xl border border-tera-border bg-tera-panel p-6 shadow-2xl">
                {onClose && (
                    <button type="button" onClick={onClose} className="absolute right-4 top-4 text-tera-secondary transition hover:text-tera-primary" aria-label="Close">
                        ×
                    </button>
                )}

                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-tera-border text-sm font-semibold text-tera-primary">
                        {message.icon}
                    </div>
                    <h2 className="mb-2 text-2xl font-bold text-tera-primary">{message.title}</h2>
                    <p className="mb-4 text-tera-primary/70">{message.description}</p>
                    <p className="mb-6 font-medium text-tera-neon">{message.benefit}</p>

                    <div className="flex gap-3">
                        {onClose && (
                            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-tera-border px-4 py-3 text-tera-primary transition hover:bg-tera-muted">
                                Maybe Later
                            </button>
                        )}
                        <Link href="/pricing" className="tera-button-upgrade flex-1 rounded-lg px-4 py-3 text-center font-semibold">
                            View Plans
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
