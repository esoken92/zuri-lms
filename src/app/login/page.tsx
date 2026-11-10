'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-hot-curry-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md border border-hot-curry-200">
        <div>
          <h2 className="text-center text-3xl font-bold text-hot-curry-950">Zuri LMS</h2>
          <p className="mt-2 text-center text-sm text-hot-curry-800/70">Sign in to your account</p>
        </div>
        {!isSupabaseConfigured && (
          <div className="bg-burrito-100 border border-burrito-300 text-burrito-900 px-4 py-3 rounded text-sm">
            Supabase is not configured — copy <code>.env.example</code> to{' '}
            <code>.env.local</code> and set your project URL and keys.
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-hot-curry-700 hover:bg-hot-curry-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hot-curry-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          <div className="text-center">
            <a href="/register" className="text-sm text-hot-curry-700 hover:text-hot-curry-600">
              Don&apos;t have an account? Register
            </a>
          </div>

          {/* Demo accounts — only rendered when NEXT_PUBLIC_DEMO_MODE=true.
              The accounts themselves come from supabase/seed.sql. */}
          {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <details className="text-left">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                  Demo Accounts (Click to expand)
                </summary>
                <div className="mt-3 space-y-2 text-xs bg-gray-50 p-3 rounded-md">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-semibold text-hot-curry-700">Administrator:</span><br/>
                      demoAdmin@lms.com<br/>
                      DemoAdmin123
                    </div>
                    <div>
                      <span className="font-semibold text-burnt-coffee-700">Management:</span><br/>
                      demoManager@lms.com<br/>
                      DemoManager123
                    </div>
                    <div>
                      <span className="font-semibold text-puma-700">Inspector:</span><br/>
                      demoInspector@lms.com<br/>
                      DemoInspector123
                    </div>
                    <div>
                      <span className="font-semibold text-shadow-play-700">User:</span><br/>
                      demoUser@lms.com<br/>
                      DemoUser123
                    </div>
                  </div>
                </div>
              </details>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
