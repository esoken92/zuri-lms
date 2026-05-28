'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any, requiresApproval?: boolean }>
  signUp: (email: string, password: string, username: string, role: string, profileData?: any) => Promise<{ error: any, user?: User, requiresApproval?: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) return { error }

    // Check if user is approved
    if (data.user) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('approval_status')
        .eq('id', data.user.id)
        .single()

      if (userError || !userData) {
        await supabase.auth.signOut()
        return { error: new Error('Failed to fetch user data') }
      }

      if (userData.approval_status !== 'approved') {
        await supabase.auth.signOut()
        return { 
          error: new Error(userData.approval_status === 'pending' 
            ? 'Your account is pending approval. Please wait for an administrator to approve your account.' 
            : 'Your account has been rejected. Please contact an administrator.'),
          requiresApproval: true
        }
      }
    }

    return { error: null }
  }

  const signUp = async (email: string, password: string, username: string, role: string, profileData?: any) => {
    // First sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) return { error }

    // Then create user record in our users table
    if (data.user) {
      const userData: any = {
        id: data.user.id,
        username,
        role,
        email,
        approval_status: 'pending', // Require admin approval
      }

      // Add extended profile data if provided
      if (profileData) {
        Object.assign(userData, profileData)
      }

      const { error: userError } = await supabase
        .from('users')
        .insert(userData)

      if (userError) {
        // Rollback auth if user creation fails
        await supabase.auth.signOut()
        return { error: userError }
      }
    }

    return { error: null, user: data?.user || undefined, requiresApproval: true }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
