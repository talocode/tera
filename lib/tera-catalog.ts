'use client'

import { defineCatalog } from '@json-render/core'
import { schema } from '@json-render/react'
import { z } from 'zod'

/**
 * Tera Component Catalog
 *
 * Defines what visual components the AI can generate.
 * json-render uses this catalog to:
 * 1. Validate AI-generated specs at runtime
 * 2. Provide type-safe rendering via the registry
 * 
 * NOTE: The system prompt is generated separately in tera-visual-prompt.ts
 * to avoid pulling @json-render/react into server bundles.
 */
export const teraCatalog = defineCatalog(schema, {
    components: {
        Chart: {
            props: z.object({
                type: z.enum(['line', 'bar', 'area', 'pie', 'radar', 'scatter', 'composed']),
                title: z.string().optional(),
                xAxisKey: z.string().optional(),
                yAxisKey: z.string().optional(),
                data: z.array(z.record(z.string(), z.any())),
                series: z.array(z.object({
                    key: z.string(),
                    color: z.string(),
                    name: z.string().optional(),
                    type: z.enum(['line', 'bar', 'area', 'scatter']).optional(),
                })),
            }),
            description: 'Display a data chart. Use for comparing values, showing trends, distributions. Types: line (trends over time), bar (comparisons), area (cumulative), pie (proportions), radar (multi-attribute comparison), scatter (correlation), composed (mix bar+line).',
        },

        MermaidDiagram: {
            props: z.object({
                chart: z.string(),
            }),
            description: 'Render a Mermaid diagram. Use for flowcharts, process diagrams, sequence diagrams, class diagrams, state diagrams, ER diagrams, Gantt charts, mind maps, and timelines. The chart prop contains raw mermaid syntax. CRITICAL: Never use parentheses () inside labels - use hyphens instead.',
        },

        Quiz: {
            props: z.object({
                topic: z.string(),
                questions: z.array(z.object({
                    id: z.number(),
                    type: z.enum(['multiple_choice', 'true_false', 'short_answer']),
                    question: z.string(),
                    options: z.array(z.string()),
                    correct: z.union([z.number(), z.string()]),
                    explanation: z.string(),
                })),
            }),
            description: 'Interactive quiz component. Use when the user wants to test understanding or practice coding concepts.',
        },

        Spreadsheet: {
            props: z.object({
                action: z.string(),
                title: z.string(),
                sheetTitle: z.string().optional(),
                data: z.array(z.array(z.any())),
                chartType: z.string().optional(),
            }),
            description: 'Create a spreadsheet with tabular data. First row should be headers. Use when user asks to organize data, create tables, or export to Google Sheets.',
        },

        RichText: {
            props: z.object({
                content: z.string(),
            }),
            description: 'Render rich markdown text content within the UI spec. Use for explanatory text, descriptions, or annotations alongside other visual components.',
        },
    },

    actions: {
        create_spreadsheet: { description: 'Create a Google Spreadsheet from data' },
        copy_code: { description: 'Copy code to clipboard' },
        export_to_sheets: { description: 'Export data to Google Sheets' },
    },
})

