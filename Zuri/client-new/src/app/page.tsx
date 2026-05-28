'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">Zuri LMS</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Sign in to your account</p>
        </div>
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
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          <div className="text-center">
            <a href="/register" className="text-sm text-blue-600 hover:text-blue-500">
              Don't have an account? Register
            </a>
          </div>

          {/* Demo Accounts Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <details className="text-left">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                Demo Accounts (Click to expand)
              </summary>
              <div className="mt-3 space-y-2 text-xs bg-gray-50 p-3 rounded-md">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-semibold text-blue-600">Administrator:</span><br/>
                    demoAdmin@lms.com<br/>
                    DemoAdmin123
                  </div>
                  <div>
                    <span className="font-semibold text-green-600">Management:</span><br/>
                    demoManager@lms.com<br/>
                    DemoManager123
                  </div>
                  <div>
                    <span className="font-semibold text-purple-600">Inspector:</span><br/>
                    demoInspector@lms.com<br/>
                    DemoInspector123
                  </div>
                  <div>
                    <span className="font-semibold text-orange-600">User:</span><br/>
                    demoUser@lms.com<br/>
                    DemoUser123
                  </div>
                </div>
              </div>
            </details>
          </div>
        </form>
      </div>
    </div>
  )
}
