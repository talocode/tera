import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { supabaseServer } from '@/lib/supabase-server'
import { sendWelcomeEmail, sendPromotionalCreditsExpiredEmail } from '@/lib/transactional-emails'
import { resolveAppOrigin, rewriteToAppOrigin } from '@/lib/url'

type UtmParams = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  referrer_url?: string
  landing_page?: string
}

function extractUtmFromRequest(req?: Request & { nextUrl?: URL }): UtmParams {
  if (!req) return {}

  // 1. Try from query params (direct link, e.g. /auth/signin?utm_source=twitter)
  const sp = req.nextUrl?.searchParams
  if (sp) {
    const fromQuery = {
      utm_source: sp.get('utm_source') || undefined,
      utm_medium: sp.get('utm_medium') || undefined,
      utm_campaign: sp.get('utm_campaign') || undefined,
      utm_term: sp.get('utm_term') || undefined,
      utm_content: sp.get('utm_content') || undefined,
      referrer_url: sp.get('ref') || sp.get('referrer') || undefined,
      landing_page: sp.get('lp') || undefined,
    }
    if (fromQuery.utm_source) return fromQuery
  }

  // 2. Try from cookie (set by sign-in page before OAuth redirect)
  try {
    const cookieHeader = req.headers?.get('cookie') || ''
    const match = cookieHeader.match(/tera_utm=([^;]+)/)
    if (match) {
      const decoded = JSON.parse(decodeURIComponent(match[1]))
      return {
        utm_source: decoded.utm_source || undefined,
        utm_medium: decoded.utm_medium || undefined,
        utm_campaign: decoded.utm_campaign || undefined,
        utm_term: decoded.utm_term || undefined,
        utm_content: decoded.utm_content || undefined,
        referrer_url: decoded.ref || decoded.referrer || undefined,
        landing_page: decoded.lp || undefined,
      }
    }
  } catch {}

  return {}
}

function syncAuthOriginFromRequest(req?: Request & { nextUrl?: URL }) {
  if (!req || process.env.NODE_ENV !== 'production') {
    return
  }

  const forwardedProto = req.headers.get('x-forwarded-proto') ?? req.nextUrl?.protocol.replace(':', '') ?? 'https'
  const forwardedHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? req.nextUrl?.host

  if (!forwardedHost) {
    return
  }

  const requestOrigin = `${forwardedProto}://${forwardedHost}`
  process.env.AUTH_URL = requestOrigin
  process.env.NEXTAUTH_URL = requestOrigin
}

export const { handlers, signIn, signOut, auth } = NextAuth((req) => {
  syncAuthOriginFromRequest(req)

  return {
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ],
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
    },
    callbacks: {
      async signIn({ user, profile }: { user: any; profile: any }) {
        if (!user.email) {
          return false
        }

        try {
          // Extract UTM params from cookie (set by sign-in page before OAuth redirect)
          const utm = extractUtmFromRequest(req)

          const { data: existingUser, error: fetchError } = await supabaseServer
            .from('users')
            .select('id')
            .eq('email', user.email)
            .single()

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error checking user:', fetchError)
          }

          if (!existingUser) {
            const newUserId = crypto.randomUUID()
            const insertData: any = {
              id: newUserId,
              email: user.email,
              full_name: user.name || profile?.name || null,
              profile_image_url: user.image || (profile as any)?.picture || null,
              subscription_plan: 'free',
              daily_chats: 0,
              monthly_file_uploads: 0,
              created_at: new Date().toISOString(),
            }

            // Attach UTM/referral data if present
            if (utm.utm_source) insertData.utm_source = utm.utm_source
            if (utm.utm_medium) insertData.utm_medium = utm.utm_medium
            if (utm.utm_campaign) insertData.utm_campaign = utm.utm_campaign
            if (utm.utm_term) insertData.utm_term = utm.utm_term
            if (utm.utm_content) insertData.utm_content = utm.utm_content
            if (utm.referrer_url) insertData.referrer_url = utm.referrer_url
            if (utm.landing_page) insertData.landing_page = utm.landing_page

            const { error: insertError } = await supabaseServer
              .from('users')
              .insert(insertData)

            if (insertError) {
              console.error('Error creating user:', insertError)
            } else {
              user.id = newUserId
              sendWelcomeEmail({
                userId: newUserId,
                email: user.email,
                name: user.name || profile?.name || null,
              }).catch((error) => console.error('[welcome_email_failed]', { userId: newUserId, error }))
            }
          } else {
            user.id = existingUser.id

            // Check if promotional credits have expired
            try {
              const { data: userData } = await supabaseServer
                .from('users')
                .select('promotional_credits, promotional_credits_expiry')
                .eq('id', existingUser.id)
                .maybeSingle()

              if (userData?.promotional_credits > 0 && userData?.promotional_credits_expiry) {
                const expiryDate = new Date(userData.promotional_credits_expiry)
                if (new Date() > expiryDate) {
                  // Zero out expired promotional credits
                  await supabaseServer
                    .from('users')
                    .update({ promotional_credits: 0 })
                    .eq('id', existingUser.id)

                  // Send expiry email (non-blocking)
                  sendPromotionalCreditsExpiredEmail({
                    userId: existingUser.id,
                    email: user.email,
                  }).catch((error) => console.error('[promotional_expiry_email_failed]', { userId: existingUser.id, error }))
                }
              }
            } catch {
              // Non-critical: don't block sign-in if expiry check fails
            }
          }

          return true
        } catch (error) {
          console.error('SignIn callback error:', error)
          return true
        }
      },

      async jwt({ token, user }: { token: any; user: any }) {
        if (user && user.email) {
          try {
            const { data } = await supabaseServer.from('users').select('id').eq('email', user.email).single()
            token.userId = data?.id || user.id
          } catch {
            token.userId = user.id
          }

          token.email = user.email
          token.name = user.name
          token.picture = user.image
        }

        if (!token.userId && token.email) {
          try {
            const { data } = await supabaseServer
              .from('users')
              .select('id')
              .eq('email', token.email)
              .maybeSingle()

            if (data?.id) {
              token.userId = data.id
            }
          } catch {
          }
        }

        return token
      },

      async session({ session, token }: { session: any; token: any }) {
        if (session.user && token) {
          if (!token.userId && token.email) {
            try {
              const { data } = await supabaseServer
                .from('users')
                .select('id')
                .eq('email', token.email)
                .maybeSingle()

              if (data?.id) {
                token.userId = data.id
              }
            } catch {
            }
          }

          let subscriptionPlan: string | undefined
          if (token.userId) {
            try {
              const { data: profileData } = await supabaseServer
                .from('users')
                .select('subscription_plan')
                .eq('id', token.userId)
                .maybeSingle()

              subscriptionPlan = profileData?.subscription_plan || 'free'
            } catch {
              subscriptionPlan = 'free'
            }
          }

          session.user.id = token.userId as string
          session.user.email = token.email as string
          session.user.name = token.name as string
          session.user.image = token.picture as string
          session.user.subscriptionPlan = subscriptionPlan || 'free'

          if (!session.user.image && token.userId) {
            try {
              const { data: profileData } = await supabaseServer
                .from('users')
                .select('profile_image_url')
                .eq('id', token.userId)
                .single()
              if (profileData?.profile_image_url) {
                session.user.image = profileData.profile_image_url
              }
            } catch {
            }
          }
        }
        return session
      },

      async redirect({ url, baseUrl }: { url: any; baseUrl: any }) {
        const appOrigin = resolveAppOrigin(baseUrl)

        if (url.startsWith('/')) {
          return `${appOrigin}${url}`
        }

        const normalizedUrl = rewriteToAppOrigin(url, appOrigin)
        const normalizedOrigin = new URL(normalizedUrl).origin

        if (normalizedOrigin === appOrigin) {
          return normalizedUrl
        }

        return appOrigin
      },
    },
    session: {
      strategy: 'jwt',
    },
    trustHost: true,
  }
})
