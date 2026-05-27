import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { getCurrencyForCountry, EXCHANGE_RATES } from '@/lib/currency-converter'
import { getUserProfileServer, incrementFileUploadsServer } from '@/lib/usage-tracking-server'
import { canUploadFile, getPlanConfig } from '@/lib/plan-config'
import { auth } from '@/lib/auth'

const DEFAULT_SETTINGS = (userId: string) => ({
    user_id: userId,
    notifications_enabled: true,
    dark_mode: true,
    email_notifications: true,
    marketing_emails: false,
    data_retention_days: 90,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params
    const action = slug[0]

    if (action === 'geo-currency') {
        try {
            let countryCode = request.headers.get('cf-ipcountry') || ''
            if (!countryCode) {
                try {
                    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
                    const ipResponse = await fetch(`http://ip-api.com/json/${clientIp}`, { headers: { 'Accept': 'application/json' }, cache: 'no-store' })
                    if (ipResponse.ok) {
                        const ipData = await ipResponse.json()
                        countryCode = (ipData.countryCode || 'US').toUpperCase()
                    } else countryCode = 'US'
                } catch (e) { countryCode = 'US' }
            }
            return NextResponse.json({ success: true, countryCode, currency: getCurrencyForCountry(countryCode) })
        } catch (e) {
            return NextResponse.json({ success: true, countryCode: 'US', currency: EXCHANGE_RATES.USD })
        }
    }

    if (action === 'settings') {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id
        try {
            const { data, error } = await supabaseServer.from('user_settings').select('*').eq('user_id', userId).single()
            if (error && (error.code === 'PGRST116' || error.message?.includes('relation'))) return NextResponse.json(DEFAULT_SETTINGS(userId))
            if (error) throw error
            return NextResponse.json(data)
        } catch (err) {
            return NextResponse.json(DEFAULT_SETTINGS(userId))
        }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params
    const action = slug[0]

    if (action === 'settings') {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id
        try {
            const settings = await request.json()
            const { data, error } = await supabaseServer.from('user_settings').upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).select().single()
            if (error && error.message?.includes('relation')) return NextResponse.json({ user_id: userId, ...settings, updated_at: new Date().toISOString() })
            if (error) throw error
            return NextResponse.json(data)
        } catch (err) { return NextResponse.json({ user_id: userId, ...(await request.json().catch(() => ({}))), updated_at: new Date().toISOString() }) }
    }

    if (action === 'attachments') {
        try {
            const formData = await request.formData()
            const file = formData.get('file') as File
            const type = formData.get('type') as string
            const session = await auth()
            if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            const userId = session.user.id
            if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

            if (userId) {
                const userProfile = await getUserProfileServer(userId)
                if (userProfile && !canUploadFile(userProfile.subscriptionPlan, userProfile.dailyFileUploads)) {
                    const limit = getPlanConfig(userProfile.subscriptionPlan).limits.fileUploadsPerDay
                    return NextResponse.json({ error: `Daily upload limit reached (${limit}). Upgrade for more.` }, { status: 403 })
                }

                if (userProfile) {
                    const maxFileSizeMb = getPlanConfig(userProfile.subscriptionPlan).limits.maxFileSize
                    const fileSizeMb = file.size / (1024 * 1024)
                    if (fileSizeMb > maxFileSizeMb) {
                        return NextResponse.json(
                            { error: `File too large (${fileSizeMb.toFixed(1)}MB). Max allowed on ${userProfile.subscriptionPlan} plan is ${maxFileSizeMb}MB.` },
                            { status: 413 }
                        )
                    }
                }
            }

            const fileExt = file.name.split('.').pop()
            const filePath = `${type}s/${Math.random().toString(36).substring(2)}.${fileExt}`
            const { error: uploadError } = await supabaseServer.storage.from('attachments').upload(filePath, file)

            if (uploadError) {
                console.error('Supabase Storage Error:', uploadError)
                throw new Error(uploadError.message)
            }

            if (userId) await incrementFileUploadsServer(userId)

            const { data: { publicUrl } } = supabaseServer.storage.from('attachments').getPublicUrl(filePath)
            return NextResponse.json({ name: file.name, url: publicUrl, type })
        } catch (error) {
            console.error('Attachment API Error:', error)
            const message = error instanceof Error ? error.message : 'Unknown upload error'
            return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 })
        }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
