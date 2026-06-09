import type { Metadata } from 'next'
import ContinueLaterQueue from '@/components/ContinueLaterQueue'
import ContinueLaterReminders from '@/components/ContinueLaterReminders'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Continue Later Queue',
  description: 'Resume chats, notes, memories, and workflows from one organized workspace queue.',
  path: '/queue',
})

export default function QueuePage() {
  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-24 md:pt-10">
        <div className="tera-page-header">
          <div>
            <p className="tera-eyebrow">Workspace</p>
            <h1 className="tera-title mt-3">Continue later</h1>
            <p className="tera-subtitle mt-4">
              A single queue for the work that deserves another pass.
            </p>
          </div>
        </div>

        <ContinueLaterQueue />

        <ContinueLaterReminders />
      </div>
    </div>
  )
}
