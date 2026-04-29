"use client"

import React, { ChangeEvent, useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { generateAnswer } from '@/app/actions/generate'
import type { TeacherTool } from './ToolCard'

type User = {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
}
import type { AttachmentReference, AttachmentType } from '@/lib/attachment'
import { fetchChatHistory } from '@/app/actions/user'
import { dispatchUsageRefresh } from '@/lib/usage-events'
import { compressImage } from '@/lib/image-compression'
import UpgradePrompt from './UpgradePrompt'
import VoiceControls from './VoiceControls'
import LimitModal from './LimitModal'

type Message = {
    id: string
    role: 'user' | 'tera'
    content: string
    attachments?: AttachmentReference[]
    timestamp?: number
}

type ConversationEntry = {
    id: string
    userMessage?: Message
    assistantMessage?: Message
    sessionId?: string | null
}

type QueuedMessage = {
    prompt: string
    attachments: AttachmentReference[]
}

const createId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()))

import dynamic from 'next/dynamic'

const ChartRenderer = dynamic(() => import('./visuals/ChartRenderer'), { ssr: false })
const MermaidRenderer = dynamic(() => import('./visuals/MermaidRenderer'), { ssr: false })
const SpreadsheetRenderer = dynamic(() => import('./visuals/SpreadsheetRenderer'), { ssr: false })
const UniversalVisualRenderer = dynamic(() => import('./visuals/UniversalVisualRenderer'), { ssr: false })

import { Renderer } from '@json-render/react'
import { teraRegistry } from '@/lib/tera-registry'

const SearchHistoryRenderer = dynamic(() => import('./search/SearchHistory'), { ssr: false })
const MarkdownRenderer = dynamic(() => import('./MarkdownRenderer'), { ssr: false })
const QuizRenderer = dynamic(() => import('./visuals/QuizRenderer'), { ssr: false })

type ContentBlock =
    | { type: 'text', content: string, isHeader: boolean }
    | { type: 'chart', config: any }
    | { type: 'mermaid', chart: string }
    | { type: 'code', language: string, code: string }
    | { type: 'spreadsheet', config: any }
    | { type: 'universal-visual', code: string, language: string, title: string }
    | { type: 'quiz', config: { action: 'quiz'; topic: string; questions: any[] } }
    | { type: 'tera-ui', spec: any }

const parseContent = (content: string): ContentBlock[] => {
    const blocks: ContentBlock[] = []
    let contentToProcess = content

    const parts = contentToProcess.split(/(```[\s\S]*?```)/g)

    parts.forEach(part => {
        if (!part.trim()) return

        if (part.startsWith('```')) {
            const match = part.match(/```(\w+)?(?::(\w+))?\n([\s\S]*?)```/)
            if (match) {
                const [, lang, type, code] = match
                const cleanCode = code ? code.trim() : ''

                if (type === 'tera-ui' || (lang === 'json' && type === 'tera-ui')) {
                    try {
                        const spec = JSON.parse(cleanCode)
                        if (spec.root && spec.elements) {
                            blocks.push({ type: 'tera-ui', spec })
                            return
                        }
                    } catch (e) {
                        console.warn('[parseContent] Failed to parse tera-ui spec', e)
                    }
                }

                const isChart = (c: string) => (c.includes('"data"') && c.includes('"type"')) || (c.includes('"series"'))
                const isSpreadsheet = (c: string) => c.includes('"action"') && (c.includes('"data"') || c.includes('"title"')) && !c.includes('"questions"')
                const isQuiz = (c: string) => c.includes('"action"') && c.includes('"quiz"') && c.includes('"questions"')
                const isHTML = (c: string) => c.includes('<!DOCTYPE') || c.includes('<html') || c.includes('<body')
                const isVisualization = (c: string) => c.includes('THREE.') || c.includes('requestAnimationFrame') || c.includes('canvas.getContext')

                if (type === 'visual' || isHTML(cleanCode) || isVisualization(cleanCode) || ['html', 'svg', 'canvas', 'jsx', 'javascript', 'js'].includes(lang || '')) {
                    blocks.push({
                        type: 'universal-visual',
                        code: cleanCode,
                        language: lang || 'html',
                        title: `${lang?.toUpperCase() || 'Visual'} Visualization`
                    })
                } else if (lang === 'mermaid' || /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|journey|gitGraph|pie|mindmap|timeline)/.test(cleanCode.trim())) {
                    blocks.push({ type: 'mermaid', chart: cleanCode })
                } else if ((lang === 'json' && type === 'quiz') || isQuiz(cleanCode)) {
                    try {
                        const jsonStr = cleanCode.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
                        const config = JSON.parse(jsonStr)
                        if (config.action === 'quiz' && config.questions) {
                            blocks.push({ type: 'quiz', config })
                        } else {
                            blocks.push({ type: 'code', language: 'json', code: cleanCode })
                        }
                    } catch (e) {
                        blocks.push({ type: 'code', language: 'json', code: cleanCode })
                    }
                } else if ((lang === 'json' && type === 'spreadsheet') || isSpreadsheet(cleanCode)) {
                    try {
                        const jsonStr = cleanCode.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
                        const config = JSON.parse(jsonStr)
                        blocks.push({ type: 'spreadsheet', config })
                    } catch (e) {
                        blocks.push({ type: 'code', language: lang || 'json', code: cleanCode })
                    }
                } else if ((lang === 'json' && type === 'chart') || isChart(cleanCode)) {
                    try {
                        const jsonStr = cleanCode.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
                        const config = JSON.parse(jsonStr)
                        const hasData = config.data && Array.isArray(config.data) && config.data.length > 0
                        const hasSeries = config.series && Array.isArray(config.series) && config.series.length > 0

                        if (!hasData && !hasSeries) {
                            blocks.push({ type: 'code', language: 'json', code: cleanCode })
                        } else {
                            blocks.push({ type: 'chart', config })
                        }
                    } catch (e) {
                        blocks.push({ type: 'code', language: lang || 'json', code: cleanCode })
                    }
                } else {
                    blocks.push({ type: 'code', language: lang || 'text', code: cleanCode })
                }
                return
            }
        }

        if (part.trim()) {
            const mermaidKeywords = /^(graph\s+(TD|TB|BT|RL|LR)|flowchart\s+(TD|TB|BT|RL|LR)|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|journey|gitGraph|pie|mindmap|timeline)/m
            const trimmedPart = part.trim()
            if (mermaidKeywords.test(trimmedPart)) {
                blocks.push({ type: 'mermaid', chart: trimmedPart })
            } else {
                blocks.push({
                    type: 'text',
                    content: part,
                    isHeader: false
                })
            }
        }
    })

    return blocks
}

const AttachmentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
)

const MicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-12 0v1.5a6 6 0 006 6m0 0v3m-3-3h6M12 3.75a3 3 0 00-3 3v6a3 3 0 006 0v-6a3 3 0 00-3-3z" />
    </svg>
)

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.77 59.77 0 0121.485 12 59.769 59.769 0 013.27 20.875L6 12Zm0 0h7.5" />
    </svg>
)

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <rect x="7" y="7" width="10" height="10" rx="2" />
    </svg>
)

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-[18px] w-[18px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75A2.25 2.25 0 016 7.5h1.628a1.5 1.5 0 001.06-.44l.879-.879a1.5 1.5 0 011.06-.44h2.746a1.5 1.5 0 011.06.44l.879.88a1.5 1.5 0 001.06.439H18a2.25 2.25 0 012.25 2.25v7.5A2.25 2.25 0 0118 19.5H6a2.25 2.25 0 01-2.25-2.25v-7.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 13.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
)

const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-[18px] w-[18px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0L21.75 15.75m-16.5 4.5h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
    </svg>
)

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-[18px] w-[18px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375H14.25V6.375A2.625 2.625 0 0011.625 3.75h-4.5A2.625 2.625 0 004.5 6.375v11.25a2.625 2.625 0 002.625 2.625h9.75A2.625 2.625 0 0019.5 17.625V14.25z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 12h7.5m-7.5 3h4.5" />
    </svg>
)

export default function PromptShell({
    tool,
    user,
    userReady,
    onRequireSignIn,
    sessionId,
    initialPrompt
}: {
    tool: TeacherTool
    onToolChange?: (tool: TeacherTool) => void
    user?: User | null
    userReady?: boolean
    onRequireSignIn?: () => void
    sessionId?: string | null
    initialPrompt?: string
}) {
    const [prompt, setPrompt] = useState(initialPrompt || '')
    const [status, setStatus] = useState<'idle' | 'loading'>('idle')
    const [conversations, setConversations] = useState<ConversationEntry[]>([])
    const [attachmentOpen, setAttachmentOpen] = useState(false)
    const [attachmentMessage, setAttachmentMessage] = useState<string | null>(null)
    const [pendingAttachments, setPendingAttachments] = useState<AttachmentReference[]>([])
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
    const [conversationActive, setConversationActive] = useState(false)
    const [hasBumpedInput, setHasBumpedInput] = useState(false)
    const [historyLoading, setHistoryLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const imageInputRef = useRef<HTMLInputElement | null>(null)
    const cameraInputRef = useRef<HTMLInputElement | null>(null)
    const [, startTransition] = useTransition()
    const conversationRef = useRef<HTMLDivElement | null>(null)
    const [queuedMessage, setQueuedMessage] = useState<QueuedMessage | null>(null)
    const showInitialPrompt = conversations.every((entry) => !entry.userMessage)
    const [isListening, setIsListening] = useState(false)
    const recognitionRef = useRef<any>(null)
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null)
    const [upgradePromptType, setUpgradePromptType] = useState<'chats' | 'file-uploads' | 'research-mode' | 'credits' | null>(null)
    const [limitModalType, setLimitModalType] = useState<'chats' | 'file-uploads' | 'research-mode' | 'credits' | null>(null)
    const [limitUnlocksAt, setLimitUnlocksAt] = useState<Date | undefined>(undefined)
    const [researchMode, setResearchMode] = useState(false)
    const [searchHistoryOpen, setSearchHistoryOpen] = useState(false)
    const [thinkingMessage, setThinkingMessage] = useState('Tera is Thinking...')
    const requestIdRef = useRef(0)

    const getThinkingMessage = (p: string) => {
        const lp = p.toLowerCase()
        if (lp.includes('draw') || lp.includes('visual') || lp.includes('chart') || lp.includes('diagram') || lp.includes('image')) return 'Tera is Creating Visuals...'
        if (lp.includes('code') || lp.includes('function') || lp.includes('script') || lp.includes('debug') || lp.includes('api')) return 'Tera is Coding...'
        if (lp.includes('analyze') || lp.includes('data') || lp.includes('trend')) return 'Tera is Analyzing Data...'
        if (lp.includes('solve') || lp.includes('calculate') || lp.includes('math') || lp.includes('equation')) return 'Tera is Solving...'
        if (lp.includes('write') || lp.includes('essay') || lp.includes('story') || lp.includes('poem') || lp.includes('draft')) return 'Tera is Writing...'
        return 'Tera is Thinking...'
    }

    useEffect(() => { setCurrentSessionId(sessionId || null) }, [sessionId])
    useEffect(() => { if (initialPrompt) setPrompt(initialPrompt) }, [initialPrompt])

    const uploadAttachment = async (file: File, type: AttachmentType) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', type)
        if (user?.id) formData.append('userId', user.id)

        const response = await fetch('/api/user/attachments', { method: 'POST', body: formData })
        if (!response.ok) {
            let errorMsg = 'Unable to upload attachment'
            try {
                const data = await response.json()
                if (data.error) errorMsg = data.error
            } catch (e) { }
            throw new Error(errorMsg)
        }
        return (await response.json()) as AttachmentReference
    }

    const handleFileSelect = (type: 'image' | 'file' | 'camera') => {
        if (type === 'image') imageInputRef.current?.click()
        else if (type === 'camera') cameraInputRef.current?.click()
        else fileInputRef.current?.click()
        setAttachmentOpen(false)
    }

    const handleAttachmentUpload = async (event: ChangeEvent<HTMLInputElement>, type: AttachmentType) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            setAttachmentMessage('Compressing & Uploading...')
            let fileToUpload = file
            if (type === 'image') {
                try { fileToUpload = await compressImage(file) } catch (err) { }
            }
            const attachment = await uploadAttachment(fileToUpload, type)
            setPendingAttachments((prev) => [...prev, attachment])
            dispatchUsageRefresh('uploads')
            setAttachmentMessage(null)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Upload failed'
            if (message.includes('limit') && (message.includes('upload') || message.includes('file'))) {
                setLimitModalType('file-uploads')
                setLimitUnlocksAt(new Date(Date.now() + 24 * 60 * 60 * 1000))
                setAttachmentMessage(null)
            } else setAttachmentMessage(message)
        } finally { event.target.value = '' }
    }

    const handleEditMessage = (id: string, message: Message) => {
        setPrompt(message.content)
        setPendingAttachments(message.attachments || [])
        setEditingMessageId(id)
        const textarea = document.querySelector('textarea')
        if (textarea) textarea.focus()
    }

    const processMessage = useCallback((messageToSend: string, attachmentsToSend: AttachmentReference[]) => {
        setStatus('loading')
        const currentRequestId = ++requestIdRef.current
        const entryId = editingMessageId ?? createId()
        const userMessage: Message = { id: `${entryId}-user`, role: 'user', content: messageToSend, attachments: attachmentsToSend.length > 0 ? attachmentsToSend : undefined, timestamp: Date.now() }
        
        setConversations((prev) => editingMessageId ? prev.map(e => e.id === editingMessageId ? { ...e, userMessage, assistantMessage: undefined } : e) : [...prev, { id: entryId, userMessage }])
        setConversationActive(true)
        if (!hasBumpedInput) setHasBumpedInput(true)

        startTransition(async () => {
            try {
                setThinkingMessage(getThinkingMessage(messageToSend))
                const result = await generateAnswer({ prompt: messageToSend, tool: tool.name, authorId: user?.id ?? '', authorEmail: user?.email ?? undefined, attachments: attachmentsToSend, sessionId: currentSessionId, chatId: editingMessageId ?? undefined, researchMode })

                if (currentRequestId !== requestIdRef.current) return

                if (result.error) {
                    if (result.error.toLowerCase().includes('credit cap')) setLimitModalType('credits')
                    else if (result.error.includes('file uploads')) setLimitModalType('file-uploads')

                    setConversations(prev => prev.map(e => e.id === entryId ? { ...e, assistantMessage: { id: createId(), role: 'tera', content: result.error || 'Error' } } : e))
                    setStatus('idle')
                    return
                }

                if (result.sessionId && result.sessionId !== currentSessionId) setCurrentSessionId(result.sessionId)
                const assistantMessage: Message = { id: createId(), role: 'tera', content: result.answer, timestamp: Date.now() }
                setConversations(prev => prev.map(e => e.id === entryId ? { ...e, assistantMessage, sessionId: result.sessionId } : e))
                setAttachmentMessage(result.warning || null)
                dispatchUsageRefresh('messages')
                if (editingMessageId && result.chatId) setEditingMessageId(result.chatId)
            } catch (error) {
                if (currentRequestId !== requestIdRef.current) return
                const msg = error instanceof Error ? error.message : 'Unable to generate a reply'
                setConversations(prev => prev.map(e => e.id === entryId ? { ...e, assistantMessage: { id: createId(), role: 'tera', content: msg } } : e))
            } finally { if (currentRequestId === requestIdRef.current) setStatus('idle') }
            setEditingMessageId(null)
            setQueuedMessage(null)
        })
    }, [editingMessageId, hasBumpedInput, tool.name, user?.id, currentSessionId, researchMode])

    const handleStop = () => {
        requestIdRef.current += 1
        setStatus('idle')
        setThinkingMessage('Tera is Thinking...')
    }

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        if (status === 'loading') return
        const messageToSend = prompt.trim()
        if (!messageToSend && pendingAttachments.length === 0) return

        if (!user) {
            const data = { prompt: messageToSend, attachments: [...pendingAttachments] }
            localStorage.setItem('tera_queued_message', JSON.stringify(data))
            onRequireSignIn?.()
            return
        }
        if (!userReady) {
            setQueuedMessage({ prompt: messageToSend, attachments: [...pendingAttachments] })
            return
        }

        const atts = [...pendingAttachments]
        setPrompt('')
        setPendingAttachments([])
        processMessage(messageToSend, atts)
    }

    useEffect(() => {
        const saved = localStorage.getItem('tera_queued_message')
        if (saved) {
            try { setQueuedMessage(JSON.parse(saved)) } catch (e) { localStorage.removeItem('tera_queued_message') }
        }
    }, [])

    useEffect(() => {
        if (userReady && queuedMessage) {
            processMessage(queuedMessage.prompt, queuedMessage.attachments)
            localStorage.removeItem('tera_queued_message')
            setQueuedMessage(null)
        }
    }, [userReady, queuedMessage, processMessage])

    useEffect(() => {
        if (!user?.id || !sessionId) return
        setHistoryLoading(true)
        fetchChatHistory(user.id, sessionId).then(data => {
            if (data) {
                const loaded: ConversationEntry[] = data.map(s => ({
                    id: s.id, sessionId: s.id,
                    userMessage: { id: `${s.id}-user`, role: 'user', content: s.prompt, attachments: s.attachments as AttachmentReference[], timestamp: new Date(s.created_at).getTime() },
                    assistantMessage: { id: `${s.id}-assistant`, role: 'tera', content: s.response, timestamp: new Date(s.created_at).getTime() + 1000 }
                }))
                setConversations(prev => loaded.length === 0 && prev.length > 0 ? prev : loaded)
                setConversationActive(loaded.length > 0)
            }
            setHistoryLoading(false)
        })
    }, [user?.id, sessionId])

    const messagesEndRef = useRef<HTMLDivElement | null>(null)
    useEffect(() => { if (conversationActive || status === 'loading') setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100) }, [conversations, conversationActive, status])

    useEffect(() => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition
            recognitionRef.current = new SpeechRecognition()
            recognitionRef.current.continuous = true
            recognitionRef.current.interimResults = true
            recognitionRef.current.onresult = (event: any) => {
                let final = ''
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) final += event.results[i][0].transcript
                }
                if (final) setPrompt(p => p + (p ? ' ' : '') + final)
            }
            recognitionRef.current.onend = () => setIsListening(false)
        }
    }, [])

    const toggleListening = () => {
        if (isListening) { recognitionRef.current?.stop(); setIsListening(false) }
        else { recognitionRef.current?.start(); setIsListening(true) }
    }

    const showSend = (prompt.trim().length > 0 || pendingAttachments.length > 0) && status !== 'loading'
    const showStop = status === 'loading'
    const showMic = !showSend && !showStop

    return (
        <div className="relative flex h-full w-full flex-col overflow-hidden bg-transparent text-tera-primary">
            <div className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-24 md:px-10 md:pb-10 md:pt-10" ref={conversationRef}>
                <div className="mx-auto min-h-full max-w-4xl space-y-8">
                    {showInitialPrompt ? (
                        <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center px-4 text-center pointer-events-none -mt-16">
                            <div className="pointer-events-auto flex max-w-3xl flex-col items-center">
                                <div className="mx-auto mb-8 w-fit p-7">
                                    <div className="relative w-32 h-32">
                                        <Image src="/images/TERA_LOGO_ONLY1.png" alt="Tera" fill className="object-contain block dark:hidden opacity-80" />
                                        <Image src="/images/TERA_LOGO_ONLY.png" alt="Tera" fill className="object-contain hidden dark:block opacity-80" />
                                    </div>
                                </div>
                                <h2 className="text-4xl font-semibold tracking-[-0.03em] text-tera-primary md:text-5xl">How can Tera help you today?</h2>
                            </div>
                        </div>
                    ) : (
                        conversations.map((entry) => (
                            <div key={entry.id} className="space-y-6">
                                {entry.userMessage && (
                                    <div className="flex justify-end group">
                                        <div className="flex items-end gap-2 max-w-[80%]">
                                            <button onClick={() => handleEditMessage(entry.id, entry.userMessage!)} className="opacity-0 group-hover:opacity-100 p-2 text-tera-primary/50 hover:text-tera-primary transition">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
                                            </button>
                                            <div className="flex flex-col items-end gap-1 w-full">
                                                <div className="w-full rounded-[26px] border border-white/10 bg-tera-elevated/90 px-5 py-4 text-tera-primary shadow-soft-lg backdrop-blur-xl">
                                                    <p className="whitespace-pre-wrap leading-relaxed">{entry.userMessage.content}</p>
                                                    {entry.userMessage.attachments && entry.userMessage.attachments.length > 0 && (
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {entry.userMessage.attachments.map((att, idx) => (
                                                                <div key={idx} className="flex items-center gap-2 rounded-lg bg-black/5 px-3 py-2 text-xs">
                                                                    <span>{att.type === 'image' ? '🖼️' : '📄'}</span>
                                                                    <span className="truncate max-w-[150px]">{att.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {entry.assistantMessage && (
                                    <div className="flex justify-start w-full">
                                        <div className="w-full">
                                            <div className="overflow-x-auto overflow-y-hidden rounded-[28px] border border-tera-border bg-tera-panel/82 px-4 py-4 text-tera-primary shadow-panel backdrop-blur-2xl md:px-6 md:py-5">
                                                <div className="space-y-4 w-full break-words overflow-hidden">
                                                    {parseContent(entry.assistantMessage.content).map((block, idx) => {
                                                        if (block.type === 'tera-ui') return <div key={idx} className="w-full my-4 animate-in fade-in slide-in-from-bottom-2 duration-300"><Renderer spec={block.spec} registry={teraRegistry} /></div>
                                                        if (block.type === 'universal-visual') return <UniversalVisualRenderer key={idx} code={block.code} language={block.language} title={block.title} />
                                                        if (block.type === 'chart') return <ChartRenderer key={idx} config={block.config} />
                                                        if (block.type === 'spreadsheet') return <SpreadsheetRenderer key={idx} config={block.config} userId={user?.id} />
                                                        if (block.type === 'mermaid') return <MermaidRenderer key={idx} chart={block.chart} />
                                                        if (block.type === 'quiz') return <QuizRenderer key={idx} quiz={block.config} />
                                                        if (block.type === 'code') return (
                                                            <div key={idx} className="my-4 w-full overflow-hidden rounded-[22px] border border-tera-border bg-[#08101a]/90 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                                <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-tera-border/50 bg-black/10 gap-2">
                                                                    <span className="text-xs font-semibold text-white/60 uppercase tracking-wider truncate">{block.language || 'code'}</span>
                                                                    <button onClick={() => navigator.clipboard.writeText(block.code)} className="p-1.5 text-white/40 hover:text-tera-neon transition-colors flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3.75H19.5A2.25 2.25 0 0121.75 6v10.5A2.25 2.25 0 0119.5 18.75h-2.25m-16.5 0h2.25m0 0v2.25m0-2.25v-8.25m0 0H3.75A2.25 2.25 0 015.25 5.25H7.5" /></svg></button>
                                                                </div>
                                                                <pre className="p-3 md:p-4 font-mono text-xs md:text-sm overflow-x-auto text-tera-primary dark:text-tera-neon w-full"><code>{block.code}</code></pre>
                                                            </div>
                                                        )
                                                        return block.type === 'text' ? <div key={idx} className="w-full animate-in fade-in duration-300"><MarkdownRenderer content={block.content} /></div> : null
                                                    })}
                                                </div>
                                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-tera-border">
                                                    <span className="text-xs text-tera-secondary/60">Tera</span>
                                                    <VoiceControls text={entry.assistantMessage.content} messageId={entry.id} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {status === 'loading' && (
                        <div className="flex justify-start"><div className="max-w-[85%]"><div className="flex items-center gap-3 rounded-[24px] border border-tera-border bg-tera-panel/80 px-6 py-4 text-tera-primary/70 shadow-soft-lg backdrop-blur-xl"><div className="flex gap-1"><span className="w-2 h-2 bg-tera-neon/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span><span className="w-2 h-2 bg-tera-neon/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span><span className="w-2 h-2 bg-tera-neon/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span></div><div className="flex items-center gap-2.5"><div className="relative"><div className="h-4 w-4 animate-spin rounded-full border-[2px] border-tera-secondary border-t-transparent"></div></div><span className="font-medium animate-pulse">{thinkingMessage}</span></div></div></div></div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="sticky bottom-0 z-50 w-full shrink-0 bg-tera-bg/92 px-2 py-2.5 backdrop-blur-xl md:px-8 md:py-3">
                <div className="relative mx-auto max-w-4xl">
                    <div className={`relative flex flex-col gap-2 rounded-[26px] border border-tera-border bg-tera-panel p-2.5 shadow-soft-lg transition-colors`}>
                        <div className="flex flex-wrap items-center gap-2 px-2 pt-2">
                            {pendingAttachments.length > 0 && (
                                <div className="flex flex-wrap gap-3 p-2">
                                    {pendingAttachments.map((att, idx) => (
                                        <div key={idx} className="group relative overflow-hidden rounded-[20px] border border-tera-border bg-tera-elevated/90 shadow-soft-lg">
                                            {att.type === 'image' ? <div className="relative w-24 h-24 md:w-32 md:h-32"><img src={att.url} alt={att.name} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2"><span className="text-xs text-white truncate w-full">{att.name}</span></div></div> : <div className="flex items-center gap-2 px-4 py-3 min-w-[120px]"><FileIcon /><span className="text-xs text-tera-primary truncate max-w-[150px]">{att.name}</span></div>}
                                            <button onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== idx))} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500">×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-end gap-2 rounded-[18px] bg-transparent px-2 py-1.5">
                            <div className="flex items-center">
                                <div className="relative">
                                    <button onClick={() => setAttachmentOpen(!attachmentOpen)} className="composer-action-button" title="Add attachment"><AttachmentIcon /></button>
                                    {attachmentOpen && (
                                        <div className="absolute bottom-full left-0 mb-3 w-64 overflow-hidden rounded-2xl border border-tera-border bg-tera-panel p-2 text-tera-primary shadow-2xl">
                                            <button onClick={() => handleFileSelect('camera')} className="composer-menu-row"><CameraIcon /><span>Open Camera</span></button>
                                            <button onClick={() => handleFileSelect('image')} className="composer-menu-row"><ImageIcon /><span>Upload image</span></button>
                                            <button onClick={() => handleFileSelect('file')} className="composer-menu-row border-b border-tera-border/70"><FileIcon /><span>Upload file</span></button>
                                            <button onClick={() => { setResearchMode(!researchMode); setAttachmentOpen(false) }} className={`composer-menu-row border-t border-tera-border/70 ${researchMode ? 'text-tera-neon bg-tera-neon/5' : 'text-tera-primary'}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-[18px] w-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-1.313-3.938a4.5 4.5 0 1 1 5.862-5.862L18.75 9l-2.846.813a4.5 4.5 0 0 1-6.09 6.091Z" /></svg>
                                                <div className="flex-1 flex items-center justify-between"><span>Deep Research</span>{researchMode && <span className="text-[10px] font-bold bg-tera-neon/20 px-1.5 py-0.5 rounded text-tera-neon">ON</span>}</div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) } }} placeholder={isListening ? 'Listening...' : 'Ask Tera Anything...'} className="m-0 min-h-[50px] max-h-[140px] w-full resize-none border-0 bg-transparent px-1 py-2 text-[0.98rem] leading-relaxed text-tera-primary placeholder:text-tera-secondary/60 focus:outline-none focus:ring-0" rows={1} style={{ height: 'auto' }} onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 120)}px` }} />

                            <div className="flex items-end gap-1">
                                {showStop && <button onClick={handleStop} className="composer-action-button flex h-10 w-10 items-center justify-center rounded-full border border-tera-border bg-white/[0.92] text-[#08101a] transition hover:bg-white"><StopIcon /></button>}
                                {showSend && <button onClick={handleSubmit} className="composer-action-button flex h-10 w-10 items-center justify-center rounded-full border border-tera-accent bg-tera-accent text-[#08101a] transition hover:brightness-95"><SendIcon /></button>}
                                {showMic && <button onClick={toggleListening} className={`composer-action-button ${isListening ? 'border-red-400/40 bg-red-500/18 text-red-300 animate-pulse' : ''}`}><MicIcon /></button>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleAttachmentUpload(e, 'file')} />
            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleAttachmentUpload(e, 'image')} />
            <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={(e) => handleAttachmentUpload(e, 'image')} />

            {searchHistoryOpen && user?.id && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md">
                        <button onClick={() => setSearchHistoryOpen(false)} className="absolute -top-10 right-0 text-white/80 hover:text-white">Close ×</button>
                        <SearchHistoryRenderer userId={user.id} onSelectQuery={(q) => { setPrompt(q); setSearchHistoryOpen(false) }} onSelectBookmark={(u) => window.open(u, '_blank')} />
                    </div>
                </div>
            )}

            {upgradePromptType && <UpgradePrompt type={upgradePromptType} onClose={() => setUpgradePromptType(null)} />}
            <LimitModal isOpen={limitModalType !== null} limitType={limitModalType} currentPlan={'free'} unlocksAt={limitUnlocksAt} onClose={() => { setLimitModalType(null); setLimitUnlocksAt(undefined) }} />
        </div>
    )
}
