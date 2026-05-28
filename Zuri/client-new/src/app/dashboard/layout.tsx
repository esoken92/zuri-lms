'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Inspections', href: '/dashboard/inspections', icon: '🔍' },
    { name: 'Scraps', href: '/dashboard/scraps', icon: '♻️' },
    { name: 'Reports', href: '/dashboard/reports', icon: '📈' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: '📉' },
    { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex-shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Zuri LMS</h1>
        </div>
        <nav className="mt-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-64 p-6">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
