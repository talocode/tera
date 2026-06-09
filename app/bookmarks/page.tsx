'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import SearchHistory from '@/components/search/SearchHistory'

export default function BookmarksPage() {
    const router = useRouter()
    const { user } = useAuth()

    if (!user) {
        return (
            <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-16">
                <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-tera-panel/90 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
                    <p className="text-[0.62rem] uppercase tracking-[0.28em] text-tera-secondary">Bookmarks</p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-tera-primary">
                        Save research sources in one place.
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-tera-secondary">
                        Sign in to review, filter, export, and edit the bookmarks you save from research answers.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/auth/signin"
                            className="rounded-full bg-tera-primary px-4 py-2 text-sm font-medium text-tera-bg transition hover:opacity-90"
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/search"
                            className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-tera-primary transition hover:border-white/20 hover:bg-white/5"
                        >
                            Workspace search
                        </Link>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-tera-panel/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[0.62rem] uppercase tracking-[0.28em] text-tera-secondary">Bookmarks</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-tera-primary">
                        Saved research sources
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-tera-secondary">
                        Review the sources you saved from chat, refine notes and tags, export your library, or reopen anything you need again.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => router.push('/search')}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-tera-primary transition hover:border-white/20 hover:bg-white/5"
                    >
                        Open workspace search
                    </button>
                </div>
            </div>

            <SearchHistory
                userId={user.id}
                onSelectQuery={() => router.push('/search')}
                onSelectBookmark={(url) => window.open(url, '_blank', 'noopener,noreferrer')}
                initialTab="bookmarks"
                showHistoryTab={false}
                className="max-w-none"
                contentClassName="max-h-none"
            />
        </main>
    )
}
