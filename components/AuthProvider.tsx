'use client'

import { createContext, useContext } from 'react'
import { SessionProvider, useSession, signOut as nextAuthSignOut } from 'next-auth/react'

type AuthContextType = {
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
    subscriptionPlan?: string
  } | null
  loading: boolean
  signOut: () => Promise<void>
  userReady: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const loading = status === 'loading'
  const userReady = status === 'authenticated' && !!session?.user?.id

  const user = session?.user ? {
    id: session.user.id as string,
    email: session.user.email as string,
    name: session.user.name,
    image: session.user.image,
    subscriptionPlan: session.user.subscriptionPlan ?? undefined,
  } : null

  const signOut = async () => {
    await nextAuthSignOut({ callbackUrl: '/' })
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, userReady }}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </SessionProvider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
