"use client"

import React, { useEffect, useMemo, useRef } from 'react'
import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Tooltip,
    Legend,
    Filler,
    ScatterController,
    BubbleController,
    LineController,
    BarController,
    PieController,
    RadarController,
    type ChartType
} from 'chart.js'

Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Tooltip,
    Legend,
    Filler,
    ScatterController,
    BubbleController,
    LineController,
    BarController,
    PieController,
    RadarController
)

interface ChartData {
    type: 'line' | 'bar' | 'area' | 'pie' | 'radar' | 'scatter' | 'composed' | string
    title?: string
    xAxisKey?: string
    yAxisKey?: string
    zAxisKey?: string
    data: any[]
    series: Array<{
        key: string
        color: string
        name?: string
        type?: 'line' | 'bar' | 'area' | 'scatter'
        data?: any[]
    }>
}

interface ChartRendererProps {
    config: ChartData
}

const COLORS = ['#00FFA3', '#00B8D9', '#FF5630', '#FFAB00', '#36B37E', '#6554C0', '#FF00E6', '#2979FF']

const normalizeType = (rawType?: string): ChartType => {
    const type = (rawType || '').toLowerCase()
    if (type === 'line' || type === 'linechart' || type === 'area' || type === 'areachart' || type === 'composed' || type === 'composedchart' || type === 'combo') return 'line'
    if (type === 'bar' || type === 'barchart') return 'bar'
    if (type === 'pie' || type === 'piechart') return 'pie'
    if (type === 'radar' || type === 'radarchart') return 'radar'
    if (type === 'scatter' || type === 'scatterplot') return 'scatter'
    return 'bar'
}

export default function ChartRenderer({ config }: ChartRendererProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const chartInstanceRef = useRef<Chart | null>(null)

    const processed = useMemo(() => {
        const hasRootData = Array.isArray(config?.data) && config.data.length > 0
        const hasSeries = Array.isArray(config?.series) && config.series.length > 0
        const firstSeries = config?.series?.[0] as any
        const hasNestedData = hasSeries && Array.isArray(firstSeries?.data)

        let effectiveSeries = config?.series
        let effectiveData = config?.data

        if (hasRootData && !hasSeries) {
            const axisKeys = ['name', 'label', 'category', 'date', 'year', 'month', 'x', 'axis', config?.xAxisKey].filter(Boolean) as string[]
            const firstDataItem = effectiveData?.[0] || {}
            const inferredSeriesKeys = Object.keys(firstDataItem).filter(k => {
                const val = firstDataItem[k]
                const keyLower = k.toLowerCase()
                if (axisKeys.includes(keyLower)) return false
                return typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)) && val.trim() !== '')
            })

            if (inferredSeriesKeys.length > 0) {
                effectiveSeries = inferredSeriesKeys.map((key, i) => ({
                    key,
                    color: COLORS[i % COLORS.length],
                    name: key.charAt(0).toUpperCase() + key.slice(1)
                }))
            }
        }

        const hasEffectiveSeries = Array.isArray(effectiveSeries) && effectiveSeries.length > 0

        if (!config || (!hasRootData && !hasNestedData) || !hasEffectiveSeries) {
            return { isValid: false, type: 'bar' as ChartType, xAxisKey: 'name', yAxisKey: undefined as string | undefined, zAxisKey: undefined as string | undefined, title: config?.title, data: [], series: [] }
        }

        let { type, xAxisKey = 'name', yAxisKey, zAxisKey, title } = config
        let data = effectiveData
        const series = effectiveSeries || []

        if (Array.isArray(data)) {
            data = data.map(item => {
                const normalized: any = {}
                for (const [key, val] of Object.entries(item)) {
                    if (typeof val === 'string' && !isNaN(parseFloat(val)) && val.trim() !== '' && key !== xAxisKey) {
                        normalized[key] = parseFloat(val)
                    } else {
                        normalized[key] = val
                    }
                }
                return normalized
            })
        }

        if (!hasRootData && hasNestedData && firstSeries?.data) {
            const dataMap = new Map<string, any>()
            let detectedAxisKey = xAxisKey

            if (xAxisKey === 'name') {
                const firstItem = firstSeries.data[0] || {}
                const candidate = Object.keys(firstItem).find(k => k !== 'value')
                if (candidate) detectedAxisKey = candidate
                xAxisKey = detectedAxisKey
            }

            series.forEach((s: any) => {
                if (Array.isArray(s.data)) {
                    s.data.forEach((item: any) => {
                        const axisValue = item[detectedAxisKey]
                        if (axisValue !== undefined) {
                            if (!dataMap.has(axisValue)) {
                                dataMap.set(axisValue, { [detectedAxisKey]: axisValue })
                            }
                            let val = item.value !== undefined ? item.value : item
                            if (typeof val === 'object' && val !== null) {
                                if (Array.isArray(val)) val = val[1]
                                else val = val.y ?? val.value ?? val.count ?? val.score ?? val.amount ?? 0
                            }
                            dataMap.get(axisValue)[s.key] = val
                        }
                    })
                }
            })
            data = Array.from(dataMap.values())
        }

        return {
            isValid: true,
            type: normalizeType(type),
            xAxisKey,
            yAxisKey,
            zAxisKey,
            title,
            data: Array.isArray(data) ? data : [],
            series
        }
    }, [config])

    useEffect(() => {
        if (!canvasRef.current) return

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy()
            chartInstanceRef.current = null
        }

        if (!processed.isValid || processed.series.length === 0) return

        const isScatter = processed.type === 'scatter'
        const isPie = processed.type === 'pie'
        const labels = isScatter ? [] : processed.data.map((item: any) => item[processed.xAxisKey] ?? '')

        const datasets = processed.series.map((s: any, i: number) => {
            const color = s.color || COLORS[i % COLORS.length]
            const isArea = (config?.type || '').toLowerCase().includes('area') || s.type === 'area'

            if (isScatter) {
                const scatterData = (Array.isArray(s.data) && s.data.length > 0 ? s.data : processed.data).map((point: any) => ({
                    x: Number(point[processed.xAxisKey || 'x']) || 0,
                    y: Number(point[processed.yAxisKey || 'y']) || Number(point[s.key]) || 0,
                    ...(processed.zAxisKey ? { r: Number(point[processed.zAxisKey]) || 4 } : {})
                }))

                return {
                    label: s.name || s.key,
                    data: scatterData,
                    borderColor: color,
                    backgroundColor: `${color}99`,
                    pointRadius: processed.zAxisKey ? undefined : 5
                }
            }

            if (isPie) {
                return {
                    label: s.name || s.key,
                    data: processed.data.map((item: any) => Number(item[s.key]) || 0),
                    backgroundColor: processed.data.map((_: any, idx: number) => COLORS[idx % COLORS.length]),
                    borderColor: '#0A0A0A',
                    borderWidth: 2
                }
            }

            return {
                label: s.name || s.key,
                data: processed.data.map((item: any) => Number(item[s.key]) || 0),
                borderColor: color,
                backgroundColor: isArea ? `${color}55` : `${color}CC`,
                fill: isArea,
                tension: 0.35
            }
        })

        chartInstanceRef.current = new Chart(canvasRef.current, {
            type: processed.type,
            data: {
                labels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#d1d5db' }
                    },
                    tooltip: {
                        backgroundColor: '#111827',
                        titleColor: '#f9fafb',
                        bodyColor: '#f9fafb'
                    }
                },
                scales: isPie || isScatter
                    ? undefined
                    : {
                        x: {
                            ticks: { color: '#9ca3af' },
                            grid: { color: '#1f2937' }
                        },
                        y: {
                            ticks: { color: '#9ca3af' },
                            grid: { color: '#1f2937' }
                        }
                    }
            }
        })

        return () => {
            chartInstanceRef.current?.destroy()
            chartInstanceRef.current = null
        }
    }, [processed, config?.type])

    const handleDownload = () => {
        const chart = chartInstanceRef.current
        if (!chart) return

        const downloadLink = document.createElement('a')
        downloadLink.href = chart.toBase64Image('image/png', 1)
        downloadLink.download = `${(processed.title || 'tera_chart').replace(/\s+/g, '_')}.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
    }

    if (!processed.isValid) {
        return (
            <div className="w-full my-4 rounded-xl border border-tera-border bg-[#0A0A0A] p-4 text-white/50 text-sm">
                <p className="font-semibold text-red-400">Chart Configuration Error</p>
                <p className="mt-1">Missing chart data or plottable series.</p>
                <pre className="mt-2 rounded bg-black/30 p-2 text-xs overflow-x-auto">{JSON.stringify(config, null, 2)}</pre>
            </div>
        )
    }

    return (
        <div className="w-full my-4 space-y-3">
            <div className="rounded-lg border border-tera-border bg-[#0a0a0a]/60 overflow-hidden">
                <div className="flex items-center justify-between border-b border-tera-border bg-tera-surface-muted px-4 py-2">
                    <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                        📝 Chart.js Configuration (JSON)
                    </h3>
                </div>
                <pre className="p-4 text-xs text-white/70 overflow-x-auto max-h-[200px]">
                    <code>{JSON.stringify({ type: processed.type, data: processed.data, series: processed.series, xAxisKey: processed.xAxisKey, yAxisKey: processed.yAxisKey }, null, 2)}</code>
                </pre>
            </div>

            <div className="group relative w-full overflow-hidden rounded-xl border border-tera-border bg-[#0A0A0A] p-4 shadow-lg">
                {processed.title && (
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider text-center flex-1 flex items-center justify-center gap-2">
                            <span>✨</span>
                            {processed.title}
                        </h3>
                        <button
                            onClick={handleDownload}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/40 hover:text-tera-neon"
                            title="Download Chart"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 12 12 16.5m0 0 4.5-4.5M12 16.5V3" />
                            </svg>
                        </button>
                    </div>
                )}
                <div className="h-[320px] w-full text-xs">
                    <canvas ref={canvasRef} className="h-full w-full" />
                </div>
            </div>
        </div>
    )
}
