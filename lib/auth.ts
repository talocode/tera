import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { supabaseServer } from '@/lib/supabase-server'
import { sendWelcomeEmail } from '@/lib/transactional-emails'
import { resolveAppOrigin, rewriteToAppOrigin } from '@/lib/url'

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
      async signIn({ user, profile }) {
        if (!user.email) {
          return false
        }

        try {
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
            const { error: insertError } = await supabaseServer
              .from('users')
              .insert({
                id: newUserId,
                email: user.email,
                full_name: user.name || profile?.name || null,
                profile_image_url: user.image || (profile as any)?.picture || null,
                subscription_plan: 'free',
                daily_chats: 0,
                daily_file_uploads: 0,
                created_at: new Date().toISOString(),
              })

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
          }

          return true
        } catch (error) {
          console.error('SignIn callback error:', error)
          return true
        }
      },

      async jwt({ token, user }) {
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

      async session({ session, token }) {
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

          session.user.id = token.userId as string
          session.user.email = token.email as string
          session.user.name = token.name as string
          session.user.image = token.picture as string
        }
        return session
      },

      async redirect({ url, baseUrl }) {
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
