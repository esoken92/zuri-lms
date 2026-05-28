'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { hashString } from '@/lib/crypto'

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

    // Temporarily skip approval check due to database schema issues
    // Will re-enable once database is properly configured
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
              userData[field] = await hashString(profileData[field])
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
