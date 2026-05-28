'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="mt-2 text-gray-600">Manage system resources</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/users"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-gray-900">Users</h3>
          <p className="text-sm text-gray-600 mt-2">Manage user accounts and permissions</p>
        </Link>

        <Link
          href="/admin/companies"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-4">🏢</div>
          <h3 className="text-lg font-semibold text-gray-900">Companies</h3>
          <p className="text-sm text-gray-600 mt-2">Manage company information</p>
        </Link>

        <Link
          href="/admin/depots"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-4">🏭</div>
          <h3 className="text-lg font-semibold text-gray-900">Depots</h3>
          <p className="text-sm text-gray-600 mt-2">Manage depot locations</p>
        </Link>

        <Link
          href="/admin/vehicle-configs"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-4">🚛</div>
          <h3 className="text-lg font-semibold text-gray-900">Vehicle Configs</h3>
          <p className="text-sm text-gray-600 mt-2">Manage vehicle configurations</p>
        </Link>

        <Link
          href="/admin/suggestions"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-4">💡</div>
          <h3 className="text-lg font-semibold text-gray-900">Suggestions</h3>
          <p className="text-sm text-gray-600 mt-2">Review user suggestions</p>
        </Link>

        <Link
          href="/admin/tyres"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-4">🛞</div>
          <h3 className="text-lg font-semibold text-gray-900">Tyres</h3>
          <p className="text-sm text-gray-600 mt-2">Manage tyre inventory</p>
        </Link>
      </div>
    </div>
  )
}
