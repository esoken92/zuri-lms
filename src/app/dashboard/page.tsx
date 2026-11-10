'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ActivityEntry {
  id: string
  activity_type: string
  activity_description: string
  created_at: string
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    inspectionsToday: 0,
    totalVehicles: 0,
    pendingScraps: 0,
    activeUsers: 0
  })
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([])
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      // Don't auto-load data - let user refresh manually to avoid slow initial load.
      // Deferred so the state update runs after the effect, not inside it.
      queueMicrotask(() => setStatsLoading(false))
    }
  }, [user])

  const loadDashboardData = async () => {
    setStatsLoading(true)

    try {
      const today = new Date().toISOString().split('T')[0]

      // Run only essential queries in parallel for faster initial load
      const [
        { count: inspectionsCount },
        { count: scrapsCount },
        { count: usersCount }
      ] = await Promise.all([
        // Get today's inspections
        supabase
          .from('inspections')
          .select('*', { count: 'exact', head: true })
          .gte('inspection_date', today),

        // Get pending scraps
        supabase
          .from('scraps')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),

        // Get active users
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
      ])

      setStats({
        inspectionsToday: inspectionsCount || 0,
        totalVehicles: 0, // Skip vehicle count for now
        pendingScraps: scrapsCount || 0,
        activeUsers: usersCount || 0
      })
      setRecentActivity([]) // Skip activity log for now
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setStatsLoading(false)
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">Welcome back, {user.email}</p>
          </div>
          <button
            onClick={loadDashboardData}
            disabled={statsLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {statsLoading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Inspections Today</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {statsLoading ? '...' : stats.inspectionsToday}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Vehicles</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {statsLoading ? '...' : stats.totalVehicles}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Pending Scraps</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {statsLoading ? '...' : stats.pendingScraps}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Active Users</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {statsLoading ? '...' : stats.activeUsers}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a
                href="/dashboard/inspections"
                className="block w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                New Inspection
              </a>
              <a
                href="/dashboard/scraps"
                className="block w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                New Scrap Entry
              </a>
              <a
                href="/dashboard/reports"
                className="block w-full text-left px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                View Reports
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            {statsLoading ? (
              <div className="text-gray-500 text-sm">Loading...</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-gray-500 text-sm">No recent activity</div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="text-sm">
                    <div className="font-medium text-gray-900">{activity.activity_type}</div>
                    <div className="text-gray-500">{activity.activity_description}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(activity.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
