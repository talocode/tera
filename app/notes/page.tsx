'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { fetchNotes, addNote, updateNote, deleteNote, type Note } from '@/app/actions/notes'

export default function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (user) {
      void loadNotes()
    }
  }, [user])

  const loadNotes = async () => {
    if (!user) return
    setLoading(true)
    const data = await fetchNotes(user.id)
    setNotes(data)
    setLoading(false)
  }

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return

    const createdNote = await addNote(user.id, newNote)
    if (createdNote) {
      setNotes([createdNote, ...notes])
      setNewNote('')
      setIsAdding(false)
    }
  }

  const handleUpdateNote = async () => {
    if (!editingNote || !editingNote.content.trim() || !user) return

    const success = await updateNote(user.id, editingNote.id, editingNote.content)
    if (success) {
      setNotes(notes.map((note) => (note.id === editingNote.id ? editingNote : note)))
      setEditingNote(null)
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!user) return
    const success = await deleteNote(user.id, id)
    if (success) {
      setNotes(notes.filter((note) => note.id !== id))
    }
  }

  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-24 md:pt-10">
        <div className="tera-page-header">
          <div>
            <p className="tera-eyebrow">Workspace</p>
            <h1 className="tera-title mt-3">Notes</h1>
            <p className="tera-subtitle mt-4">Capture quick ideas, snippets, and working thoughts without leaving the main Tera workspace.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/search" className="tera-button-secondary">
              Search workspace
            </Link>
            <button type="button" onClick={() => setIsAdding((current) => !current)} className={isAdding ? 'tera-button-secondary' : 'tera-button-primary'}>
              {isAdding ? 'Cancel' : 'Add note'}
            </button>
          </div>
        </div>

        <div className="tera-surface mt-8 p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 pb-5">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.3em] text-tera-secondary">Notebook</p>
              <h2 className="mt-2 text-xl font-semibold text-tera-primary">Thoughts and references</h2>
            </div>
            <p className="text-sm text-tera-secondary">{notes.length} saved</p>
          </div>

          {isAdding && (
            <div className="mt-6 tera-card-subtle p-5 transition-transform duration-200 hover:-translate-y-px">
              <textarea
                value={newNote}
                onChange={(event) => setNewNote(event.target.value)}
                placeholder="Write your note here..."
                className="min-h-28 w-full resize-none bg-transparent text-sm leading-7 text-tera-primary placeholder:text-tera-secondary focus:outline-none"
              />
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={handleAddNote} className="tera-button-primary">
                  Save note
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-tera-secondary">Loading notes...</p>
            ) : notes.length === 0 && !isAdding ? (
              <div className="tera-card-subtle px-5 py-6 text-sm text-tera-secondary">
                No notes yet. Capture your first idea.
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="group tera-card-subtle p-5 transition-transform duration-200 hover:-translate-y-px hover:bg-white/[0.06]">
                  {editingNote?.id === note.id ? (
                    <div>
                      <textarea
                        value={editingNote.content}
                        onChange={(event) => setEditingNote({ ...editingNote, content: event.target.value })}
                        className="min-h-28 w-full resize-none bg-transparent text-sm leading-7 text-tera-primary focus:outline-none"
                      />
                      <div className="mt-4 flex justify-end gap-2">
                        <button type="button" onClick={() => setEditingNote(null)} className="tera-button-secondary">
                          Cancel
                        </button>
                        <button type="button" onClick={handleUpdateNote} className="tera-button-primary">
                          Update
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <p className="whitespace-pre-wrap text-sm leading-7 text-tera-primary/95">{note.content}</p>
                        <div className="flex gap-2 opacity-0 transition group-hover:opacity-100">
                          <button type="button" onClick={() => setEditingNote(note)} className="tera-button-ghost text-xs">
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDeleteNote(note.id)} className="tera-button-ghost px-2 text-xs text-red-300 hover:text-red-200">
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="mt-4 text-[0.62rem] uppercase tracking-[0.24em] text-tera-secondary">
                        {new Date(note.updated_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
