'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { hashString } from '@/lib/crypto'

// Error values surfaced to callers: AuthError, PostgrestError, or Error —
// all expose `message`, which is what the forms render.
interface AuthActionResult {
  error: { message: string } | null
  user?: User
  requiresApproval?: boolean
}

interface AuthContextType {
  user: User | null
  session: Session | null
  role: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<AuthActionResult>
  signUp: (email: string, password: string, username: string, role: string, profileData?: Record<string, unknown>) => Promise<AuthActionResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function applySession(session: Session | null) {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()
        if (!cancelled) setRole(data?.role ?? null)
      } else {
        setRole(null)
      }
      if (!cancelled) setLoading(false)
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) return { error }

    // Check if user is approved - handle database errors gracefully
    if (data.user) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('approval_status')
          .eq('id', data.user.id)
          .single()

        if (userError) {
          console.warn('User table query failed:', userError.message)
          // Allow sign-in if database query fails
          return { error: null }
        }

        if (userData && userData.approval_status !== 'approved') {
          await supabase.auth.signOut()
          return { 
            error: new Error(userData.approval_status === 'pending' 
              ? 'Your account is pending approval. Please wait for an administrator to approve your account.' 
              : 'Your account has been rejected. Please contact an administrator.'),
            requiresApproval: true
          }
        }
      } catch (err) {
        console.error('Error checking approval status:', err)
        // Allow sign-in if check fails
        return { error: null }
      }
    }

    return { error: null }
  }

  const signUp = async (email: string, password: string, username: string, role: string, profileData?: Record<string, unknown>) => {
    // First sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) return { error }

    // Then create user record in our users table
    if (data.user) {
      const userData: Record<string, unknown> = {
        id: data.user.id,
        username,
        role,
        email,
        approval_status: 'pending', // Require admin approval
      }

      // Add extended profile data if provided with validation
      if (profileData) {
        // Whitelist allowed fields to prevent injection
        const allowedFields = [
          'first_name', 'last_name', 'phone', 'dialling_code',
          'country_id', 'province_id', 'region_id', 'store_id', 'branch',
          'security_question_1', 'security_answer_1',
          'security_question_2', 'security_answer_2'
        ]
        
        for (const field of allowedFields) {
          if (profileData[field] !== undefined) {
            // Hash security answers before storage
            if (field === 'security_answer_1' || field === 'security_answer_2') {
              userData[field] = await hashString(String(profileData[field]))
            } else {
              userData[field] = profileData[field]
            }
          }
        }
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
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signUp, signOut }}>
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
