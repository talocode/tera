/**
 * Server-safe visual prompt for Tera's AI.
 * 
 * This file MUST NOT import from @json-render/react or any React-dependent module,
 * because it is used in server-side code (lib/mistral.ts).
 * 
 * The component descriptions here must stay in sync with tera-catalog.ts.
 */

export const teraVisualPrompt = `
AVAILABLE COMPONENTS:

- Chart: Display a data chart. Use for comparing values, showing trends, distributions.
  Props: { type: "line"|"bar"|"area"|"pie"|"radar"|"scatter"|"composed", title?: string, xAxisKey?: string, yAxisKey?: string, data: Array<Record<string, any>>, series: Array<{ key: string, color: string, name?: string, type?: "line"|"bar"|"area"|"scatter" }> }
  Types: line (trends over time), bar (comparisons), area (cumulative), pie (proportions), radar (multi-attribute comparison), scatter (correlation), composed (mix bar+line).

- MermaidDiagram: Render a Mermaid diagram. Use for flowcharts, process diagrams, sequence diagrams, class diagrams, state diagrams, ER diagrams, Gantt charts, mind maps, and timelines.
  Props: { chart: string }
  The chart prop contains raw mermaid syntax. CRITICAL: Never use parentheses () inside labels - use hyphens instead.

- Quiz: Interactive quiz component. Use when the user wants to test understanding or practice concepts.
  Props: { topic: string, questions: Array<{ id: number, type: "multiple_choice"|"true_false"|"short_answer", question: string, options: string[], correct: number|string, explanation: string }> }

- Spreadsheet: Create a spreadsheet with tabular data. First row should be headers.
  Props: { action: string, title: string, sheetTitle?: string, data: Array<Array<any>>, chartType?: string }
  Use when user asks to organize data, create tables, or export to Google Sheets.

- RichText: Render rich markdown text content within the UI spec.
  Props: { content: string }
  Use for explanatory text, descriptions, or annotations alongside other visual components.

AVAILABLE ACTIONS:
- create_spreadsheet: Create a Google Spreadsheet from data
- copy_code: Copy code to clipboard
- export_to_sheets: Export data to Google Sheets
`.trim()
