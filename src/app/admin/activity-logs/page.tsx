'use client'

import { useState, useEffect } from 'react'
import { getActivityLogs } from '@/lib/activityLog'
import { ActivityLog } from '@/types'

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const loadLogs = async () => {
    setLoading(true)
    const data = await getActivityLogs(100)
    setLogs(data)
    setLoading(false)
  }

  useEffect(() => {
    // Mount-only data load; defer so the loader's synchronous
    // setLoading(true) runs after the effect, not inside it.
    queueMicrotask(() => {
      void loadLogs()
    })
  }, [])

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.action === filter)

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'user_created': 'bg-blue-100 text-blue-800',
      'user_approved': 'bg-green-100 text-green-800',
      'inspection_created': 'bg-purple-100 text-purple-800',
      'inspection_updated': 'bg-purple-100 text-purple-800',
      'scrap_created': 'bg-orange-100 text-orange-800',
      'scrap_updated': 'bg-orange-100 text-orange-800',
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)))

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          <p className="mt-2 text-gray-600">Track all user actions in the system</p>
        </div>
        <button
          onClick={loadLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Action</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">All Actions</option>
          {uniqueActions.map(action => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.users?.username || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.entity_type && (
                      <span>
                        {log.entity_type}
                        {log.entity_id && ` (${log.entity_id})`}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                    {log.details && JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
