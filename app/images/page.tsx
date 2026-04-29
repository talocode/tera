import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase-server'
import ImageGallery from '@/components/ImageGallery'

export const dynamic = 'force-dynamic'

type Attachment = {
  url?: string
  name?: string
  type?: string
}

type ImageRow = {
  url: string
  name: string
  uploadedAt: string
}

export default async function ImagesPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { data, error } = await supabaseServer
    .from('chat_sessions')
    .select('attachments, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(250)

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold text-tera-primary">Your Images</h1>
        <p className="mt-3 text-sm text-red-300">Unable to load your uploads right now. Please try again.</p>
      </div>
    )
  }

  const images: ImageRow[] = []

  for (const row of data || []) {
    const attachments = (Array.isArray(row.attachments) ? row.attachments : []) as Attachment[]
    for (const attachment of attachments) {
      if (attachment?.type !== 'image' || !attachment.url) continue
      images.push({
        url: attachment.url,
        name: attachment.name || 'Uploaded image',
        uploadedAt: row.created_at,
      })
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-tera-secondary">Library</p>
          <h1 className="mt-2 text-3xl font-semibold text-tera-primary">Your Images</h1>
          <p className="mt-2 text-sm text-tera-secondary">All images you uploaded with the upload date.</p>
        </div>
        <Link href="/new" className="tera-button-secondary rounded-full px-5 py-2 text-sm">
          Back to chat
        </Link>
      </div>

      {images.length === 0 ? (
        <div className="rounded-3xl border border-tera-border bg-tera-elevated p-8 text-sm text-tera-secondary">
          You have not uploaded any images yet.
        </div>
      ) : (
        <ImageGallery images={images} />
      )}
    </div>
  )
}
