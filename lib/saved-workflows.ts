export type SavedWorkflow = {
  id: string
  name: string
  prompt: string
  createdAt: string
}

export const SAVED_WORKFLOWS_STORAGE_KEY = 'tera_saved_workflows'

export function loadSavedWorkflows(): SavedWorkflow[] {
  if (typeof window === 'undefined') return []

  const stored = window.localStorage.getItem(SAVED_WORKFLOWS_STORAGE_KEY)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored) as SavedWorkflow[]
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Error loading saved workflows:', error)
    return []
  }
}

export function persistSavedWorkflows(workflows: SavedWorkflow[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SAVED_WORKFLOWS_STORAGE_KEY, JSON.stringify(workflows))
}

export function createSavedWorkflow(name: string, prompt: string): SavedWorkflow {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    prompt: prompt.trim(),
    createdAt: new Date().toISOString(),
  }
}
