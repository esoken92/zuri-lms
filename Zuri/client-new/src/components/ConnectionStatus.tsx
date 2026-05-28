'use client'

import { useConnection } from '@/contexts/ConnectionContext'

export default function ConnectionStatus() {
  const { status, syncQueue, syncNow, isSyncing, lastSynced } = useConnection()

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'offline':
        return 'bg-red-500'
      case 'slow':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const handleSync = async () => {
    await syncNow()
  }

  const formatLastSynced = () => {
    if (!lastSynced) return null
    const date = new Date(lastSynced)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-md border border-gray-200">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
        {syncQueue.length > 0 && (
          <>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              {syncQueue.length}
            </span>
            <button
              onClick={handleSync}
              disabled={isSyncing || status === 'offline'}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Sync pending data"
            >
              {isSyncing ? '...' : 'Sync'}
            </button>
          </>
        )}
        {lastSynced && syncQueue.length === 0 && (
          <span className="text-xs text-gray-500" title={`Last synced: ${new Date(lastSynced).toLocaleString()}`}>
            {formatLastSynced()}
          </span>
        )}
      </div>
    </div>
  )
}
