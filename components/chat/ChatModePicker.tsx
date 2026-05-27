"use client"

export const CHAT_MODES = [
    {
        id: 'chat',
        label: 'Chat',
        description: 'General conversation and tutoring',
        soon: false,
        disabled: false
    },
    {
        id: 'research',
        label: 'Research',
        description: 'Deeper, source-oriented answers',
        soon: false,
        disabled: false
    },
    {
        id: 'image',
        label: 'Image',
        description: 'Image generation is coming soon',
        soon: true,
        disabled: true
    }
] as const

export type ChatMode = (typeof CHAT_MODES)[number]['id']

type ChatModePickerProps = {
    selectedMode: ChatMode
    onModeChange: (mode: ChatMode) => void
    disabled?: boolean
    loading?: boolean
    disabledModes?: ChatMode[]
    className?: string
}

export default function ChatModePicker({
    selectedMode,
    onModeChange,
    disabled = false,
    loading = false,
    disabledModes,
    className = ''
}: ChatModePickerProps) {
    const unavailableModes = disabledModes ?? CHAT_MODES.filter((mode) => mode.disabled).map((mode) => mode.id)
    const controlsDisabled = disabled || loading

    return (
        <div className={`overflow-x-auto ${className}`} aria-label="Chat mode selector">
            <div className="flex w-max min-w-full flex-nowrap items-center gap-2 px-1 py-1">
                {CHAT_MODES.map((mode) => {
                    const isSelected = selectedMode === mode.id
                    const isModeUnavailable = unavailableModes.includes(mode.id)
                    const isDisabled = controlsDisabled || isModeUnavailable

                    return (
                        <button
                            key={mode.id}
                            type="button"
                            aria-pressed={isSelected}
                            aria-label={`${mode.label} mode${isModeUnavailable ? ' (coming soon)' : ''}`}
                            disabled={isDisabled}
                            title={mode.description}
                            onClick={() => onModeChange(mode.id)}
                            className={`group inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tera-neon/70 focus-visible:ring-offset-2 focus-visible:ring-offset-tera-panel ${
                                isSelected
                                    ? 'border-tera-accent bg-tera-accent text-[#08101a] shadow-[0_0_18px_rgba(130,240,255,0.22)]'
                                    : 'border-tera-border bg-tera-panel text-tera-primary hover:border-tera-neon/60 hover:bg-tera-neon/8 hover:text-tera-neon'
                            } ${isModeUnavailable ? 'border-dashed opacity-60' : ''} ${controlsDisabled ? 'cursor-wait opacity-60' : ''} ${isDisabled ? 'cursor-not-allowed' : ''}`}
                        >
                            <span className="whitespace-nowrap">{mode.label}</span>
                            {mode.soon && (
                                <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
                                    isSelected
                                        ? 'border-[#08101a]/25 bg-[#08101a]/10 text-[#08101a]'
                                        : 'border-tera-neon/30 bg-tera-neon/10 text-tera-neon'
                                }`}>
                                    Soon
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
