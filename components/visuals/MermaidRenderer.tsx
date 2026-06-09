"use client"

import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

interface MermaidRendererProps {
    chart: string
}

let mermaidInitialized = false

/**
 * Sanitize the chart content to fix common AI-generated mermaid issues.
 */
function sanitizeChart(raw: string): string {
    let chart = raw.trim()

    // Remove any leading/trailing code fence markers that might have leaked through
    chart = chart.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')

    // Remove BOM or zero-width characters
    chart = chart.replace(/[\u200B\u200C\u200D\uFEFF]/g, '')

    // Remove trailing semicolons on lines (common AI mistake)
    chart = chart.replace(/;\s*$/gm, '')

    // Fix parentheses inside square bracket labels [Label (with parens)] -> [Label - with parens]
    chart = chart.replace(/\[([^\]]*)\]/g, (match, content) => {
        if (/\(/.test(content)) {
            return '[' + content.replace(/\(/g, '- ').replace(/\)/g, '') + ']'
        }
        return match
    })

    // Fix parentheses inside edge labels |Label (with parens)| -> |Label - with parens|
    chart = chart.replace(/\|([^|]*)\|/g, (match, content) => {
        if (/\(/.test(content)) {
            return '|' + content.replace(/\(/g, '- ').replace(/\)/g, '') + '|'
        }
        return match
    })

    // Fix parentheses inside curly brace labels {Label (with parens)} -> {Label - with parens}
    chart = chart.replace(/\{([^}]*)\}/g, (match, content) => {
        if (/\(/.test(content)) {
            return '{' + content.replace(/\(/g, '- ').replace(/\)/g, '') + '}'
        }
        return match
    })

    // Fix common "subgraph" issues - ensure subgraph has a label
    chart = chart.replace(/subgraph\s*\n/g, 'subgraph default\n')

    // Normalize line endings
    chart = chart.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // Remove empty lines at start (mermaid needs the diagram type on the first line)
    chart = chart.replace(/^\s*\n+/, '')

    return chart
}

export default function MermaidRenderer({ chart }: MermaidRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [svg, setSvg] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    const [rawChart, setRawChart] = useState<string>('')

    // Initialize mermaid only once globally
    useEffect(() => {
        if (!mermaidInitialized) {
            mermaid.initialize({
                startOnLoad: false,
                theme: 'dark',
                securityLevel: 'loose',
                fontFamily: 'Inter, sans-serif',
                suppressErrorRendering: true,
                logLevel: 'error' as any,
            })
            mermaidInitialized = true
        }
    }, [])

    useEffect(() => {
        const renderChart = async () => {
            if (!chart || !containerRef.current) return

            const sanitized = sanitizeChart(chart)
            setRawChart(sanitized)
            console.log('[MermaidRenderer] Attempting to render chart:', sanitized.substring(0, 200))

            try {
                // Validate syntax first
                await mermaid.parse(sanitized)

                // Generate a unique ID for this render
                const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

                // Render directly — mermaid will create a temp element in the body
                // Don't pass a custom container — let mermaid handle DOM placement
                // so that getBBox works correctly on the SVG
                const { svg: renderedSvg } = await mermaid.render(id, sanitized)
                setSvg(renderedSvg)
                setError(null)
                console.log('[MermaidRenderer] Successfully rendered diagram')

                // Clean up any leftover temp elements mermaid may have created
                const tempEl = document.getElementById(id)
                if (tempEl) tempEl.remove()
                // Also clean up the d prefix container mermaid sometimes creates
                const dEl = document.getElementById('d' + id)
                if (dEl) dEl.remove()
            } catch (err: any) {
                console.error('[MermaidRenderer] Render error:', err?.message || err)
                const errorMsg = err?.message || 'Unknown error'
                setError(`Could not render this diagram: ${errorMsg.substring(0, 150)}`)
                setSvg('')
            }
        }

        renderChart()
    }, [chart])

    return (
        <div className="w-full my-4 space-y-3">
            {/* Code Section */}
            <div className="rounded-lg border border-tera-border bg-[#0a0a0a]/60 overflow-hidden">
                <div className="flex items-center justify-between border-b border-tera-border bg-white/5 px-4 py-2">
                    <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                        📝 Mermaid Diagram Code
                    </h3>
                </div>
                <pre className="p-4 text-xs text-white/70 overflow-x-auto max-h-[200px]">
                    <code>{rawChart || chart}</code>
                </pre>
            </div>

            {/* Diagram Rendering Section */}
            <div className="rounded-xl border border-tera-border bg-[#0A0A0A] p-4 shadow-lg overflow-x-auto">
                {error ? (
                    <div className="rounded border border-red-900/20 bg-red-900/10 p-3 text-xs text-red-400">
                        <p className="font-semibold mb-2">⚠️ Diagram Render Issue</p>
                        <p className="mb-2">{error}</p>
                        <p className="text-white/40 text-[10px]">Tip: Try asking Tera to &quot;redraw the diagram with simpler labels&quot;</p>
                    </div>
                ) : svg ? (
                    <div className="flex flex-col items-center gap-3">
                        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider flex items-center gap-2">
                            <span>✨</span>
                            Generated Diagram
                        </h3>
                        <div
                            ref={containerRef}
                            className="flex justify-center min-w-[300px]"
                            dangerouslySetInnerHTML={{ __html: svg }}
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-6">
                        <div className="animate-pulse text-white/30 text-sm">Rendering diagram...</div>
                    </div>
                )}
            </div>
        </div>
    )
}
