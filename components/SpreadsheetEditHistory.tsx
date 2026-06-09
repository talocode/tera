'use client'

import { useState, useEffect } from 'react'

interface Edit {
  id: string
  operation_type: string
  operation_data: Record<string, any>
  created_at: string
  previous_data?: Record<string, any>
  new_data?: Record<string, any>
}

interface SpreadsheetEditHistoryProps {
  spreadsheetId: string
  limit?: number
}

export default function SpreadsheetEditHistory({
  spreadsheetId,
  limit = 20
}: SpreadsheetEditHistoryProps) {
  const [edits, setEdits] = useState<Edit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchEditHistory()
  }, [spreadsheetId])

  const fetchEditHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/sheets/edit-history?spreadsheetId=${spreadsheetId}&limit=${limit}&count=true`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch edit history')
      }

      const data = await response.json()
      setEdits(data.edits || [])
      setTotalCount(data.count || 0)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('Error fetching edit history:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  const getOperationLabel = (type: string) => {
    const labels: Record<string, string> = {
      cell_update: '📝 Cell Updated',
      row_add: '➕ Row Added',
      row_delete: '❌ Row Deleted',
      column_add: '➕ Column Added',
      column_delete: '❌ Column Deleted'
    }
    return labels[type] || type
  }

  const getOperationDetails = (edit: Edit) => {
    const { operation_type, operation_data } = edit

    switch (operation_type) {
      case 'cell_update':
        return `Cell [${operation_data.row}, ${operation_data.column}] → "${operation_data.value}"`
      case 'row_add':
        return `Added row at position ${operation_data.position || 'end'}`
      case 'row_delete':
        return `Deleted row at index ${operation_data.rowIndex}`
      case 'column_add':
        return `Added column "${operation_data.columnName}" at index ${operation_data.columnIndex}`
      case 'column_delete':
        return `Deleted column "${operation_data.columnName}" at index ${operation_data.columnIndex}`
      default:
        return JSON.stringify(operation_data)
    }
  }

  if (loading) {
    return (
      <div className="tera-card space-y-4">
        <h3 className="text-lg font-semibold text-tera-primary">Edit History</h3>
        <div className="text-sm text-tera-secondary">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="tera-card space-y-4">
        <h3 className="text-lg font-semibold text-tera-primary">Edit History</h3>
        <div className="text-sm text-red-300">Error: {error}</div>
        <button
          onClick={fetchEditHistory}
          className="text-sm text-tera-neon hover:text-tera-primary"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="tera-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-tera-primary">Edit History</h3>
        <span className="text-xs text-tera-secondary">{totalCount} edits total</span>
      </div>

      {edits.length === 0 ? (
        <div className="text-sm text-tera-secondary">No edits yet</div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {edits.map((edit) => (
            <div
              key={edit.id}
              className="rounded-lg border border-tera-border bg-white/[0.03] p-3 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-tera-primary">
                  {getOperationLabel(edit.operation_type)}
                </span>
                <span className="text-xs text-tera-secondary">
                  {formatDate(edit.created_at)}
                </span>
              </div>
              <p className="text-xs text-tera-secondary">
                {getOperationDetails(edit)}
              </p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={fetchEditHistory}
        className="text-xs text-tera-neon hover:text-tera-primary"
      >
        Refresh
      </button>
    </div>
  )
}
