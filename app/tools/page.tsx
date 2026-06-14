'use client'

import { useState } from 'react'
import Link from 'next/link'
import ToolCard from '@/components/ToolCard'
import { teacherTools, studentTools, learnerTools, slugify } from '@/lib/tools-data'

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<'teachers' | 'students' | 'learners'>('teachers')

  const activeTools =
    activeTab === 'teachers'
      ? teacherTools
      : activeTab === 'students'
        ? studentTools
        : learnerTools

  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-20 md:pt-10">
        <div className="tera-page-header">
          <div>
            <p className="tera-eyebrow">Workspace</p>
            <h1 className="tera-title mt-3">Tools</h1>
            <p className="tera-subtitle mt-4">
              Launch Tera with a focused workflow. Each tool opens directly in chat with the right starting context.
            </p>
          </div>
          <div className="tera-card-subtle flex items-center gap-4 px-5 py-4">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.3em] text-tera-secondary">Available</p>
              <p className="mt-1 text-2xl font-semibold text-tera-primary">{teacherTools.length + studentTools.length + learnerTools.length}</p>
            </div>
            <div className="h-10 w-px bg-tera-border" />
            <p className="max-w-[16rem] text-sm leading-6 text-tera-secondary">Teacher, student, and general-purpose flows share the same dark interface system.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <div className="tera-segmented">
            <button type="button" className="tera-segmented-item" data-active={activeTab === 'teachers'} onClick={() => setActiveTab('teachers')}>
              Teachers
            </button>
            <button type="button" className="tera-segmented-item" data-active={activeTab === 'students'} onClick={() => setActiveTab('students')}>
              Students
            </button>
            <button type="button" className="tera-segmented-item" data-active={activeTab === 'learners'} onClick={() => setActiveTab('learners')}>
              Everyone
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {activeTools.map((tool) => (
            <Link key={tool.name} href={`/new?tool=${slugify(tool.name)}`} className="block">
              <ToolCard tool={tool} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
