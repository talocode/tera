'use client'

import React, { useMemo, useState } from 'react'

interface UniversalVisualRendererProps {
  code: string
  language?: string
  title?: string
}

export default function UniversalVisualRenderer({
  code,
  language = 'html',
  title = 'Generated Visual'
}: UniversalVisualRendererProps) {
  const [showCode, setShowCode] = useState(false)

  // Use useMemo instead of useEffect to prevent re-render loops
  const srcDoc = useMemo(() => {
    try {
      const isFullHtml = code.includes('<!DOCTYPE html>') || code.includes('<html')

      if (isFullHtml) {
        return code
      }

      // Construct a robust environment with common libraries
      const htmlStart = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
          <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
          <script src="https://d3js.org/d3.v7.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
          <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
          
          <style>
            html, body { 
              width: 100%; height: 100%; margin: 0; padding: 0;
              background: #0a0a0a; color: #ffffff;
              font-family: -apple-system, system-ui, sans-serif;
              overflow: auto;
            }
            body { padding: 1rem; box-sizing: border-box; }
            #root { 
              width: 100%; min-height: 100%; 
              display: flex; flex-direction: column; align-items: center; justify-content: center;
            }
            canvas { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <div id="root">
            <canvas id="canvas"></canvas>
          </div>
          <script>
            window.onerror = function(msg, url, line, col, error) {
              document.body.innerHTML = '<div style="color:#ff6b6b;padding:20px;font-family:monospace;white-space:pre-wrap;">Runtime Error: ' + msg + '</div>';
              return true;
            };
            window.onunhandledrejection = function(e) {
              e.preventDefault();
              document.body.innerHTML = '<div style="color:#ff6b6b;padding:20px;font-family:monospace;">Promise rejected: ' + e.reason + '</div>';
            };
          </script>
      `

      let scriptContent = code
      if (!code.trim().startsWith('<')) {
        scriptContent = `<script>(function(){try{${code}}catch(e){document.body.innerHTML='<div style="color:#ff6b6b;padding:20px;">Error: '+e.message+'</div>';}})();</script>`
      }

      return htmlStart + scriptContent + '</body></html>'
    } catch {
      return '<html><body style="color:#ff6b6b;padding:20px;">Failed to prepare visual</body></html>'
    }
  }, [code])

  // Generate a stable key based on code hash
  const iframeKey = useMemo(() => {
    let hash = 0
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return `visual-${hash}`
  }, [code])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
  }

  return (
    <div className="w-full my-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-lg border border-tera-border bg-tera-surface-muted px-4 py-2">
        <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
          📝 {title}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCode(!showCode)}
            className="text-xs text-white/40 hover:text-tera-neon transition-colors"
          >
            {showCode ? 'Hide Code' : 'View Code'}
          </button>
          <button
            onClick={handleCopyCode}
            className="p-1.5 text-white/40 hover:text-tera-neon transition-colors"
            title="Copy code"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Code Preview (collapsible) */}
      {showCode && (
        <pre className="max-h-[200px] overflow-x-auto rounded-lg border border-tera-border bg-black/50 p-4 text-xs text-white/70">
          <code>{code}</code>
        </pre>
      )}

      {/* Main Container */}
      <div className="relative h-[500px] overflow-hidden rounded-b-xl border border-tera-border bg-[#0A0A0A] shadow-lg">
        <iframe
          key={iframeKey}
          srcDoc={srcDoc}
          title="Generated Visual"
          className="w-full h-full border-0"
          sandbox="allow-scripts"
        />
      </div>
    </div>
  )
}
