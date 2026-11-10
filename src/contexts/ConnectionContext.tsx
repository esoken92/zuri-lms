'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { syncData } from '@/lib/offlineSync'

type ConnectionStatus = 'online' | 'offline' | 'slow'

interface ConnectionContextType {
  status: ConnectionStatus
  isOnline: boolean
  syncQueue: Record<string, unknown>[]
  addToSyncQueue: (data: Record<string, unknown>) => void
  clearSyncQueue: () => void
  syncNow: () => Promise<void>
  isSyncing: boolean
  lastSynced: string | null
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined)

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('online')
  const [isOnline, setIsOnline] = useState(true)
  const [syncQueue, setSyncQueue] = useState<Record<string, unknown>[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<string | null>(null)

  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing || syncQueue.length === 0) return

    setIsSyncing(true)
    try {
      const result = await syncData()
      if (result.success) {
        setSyncQueue([])
        setLastSynced(new Date().toISOString())
      } else {
        // Update queue with remaining items
        const remainingQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]') as Record<string, unknown>[]
        setSyncQueue(remainingQueue)
      }
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing, syncQueue])

  useEffect(() => {
    // Sync the initial client-only online status after mount.
    queueMicrotask(() => setIsOnline(navigator.onLine))

    // Listen for online/offline events
    const handleOnline = async () => {
      setIsOnline(true)
      setStatus('online')
      // Auto-sync when coming back online
      await syncNow()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Periodic connection check
    const checkConnection = async () => {
      try {
        await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL!, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
        })
        if (isOnline) {
          setStatus('online')
        }
      } catch {
        if (isOnline) {
          setStatus('slow')
        }
      }
    }

    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [isOnline, syncNow])

  // Load sync queue and lastSynced from localStorage on mount
  useEffect(() => {
    // Hydrate client-only persisted state after mount.
    queueMicrotask(() => {
      const savedQueue = localStorage.getItem('syncQueue')
      if (savedQueue) {
        setSyncQueue(JSON.parse(savedQueue) as Record<string, unknown>[])
      }
      const savedLastSynced = localStorage.getItem('lastSynced')
      if (savedLastSynced) {
        setLastSynced(savedLastSynced)
      }
    })
  }, [])

  // Save sync queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('syncQueue', JSON.stringify(syncQueue))
  }, [syncQueue])

  // Save lastSynced to localStorage whenever it changes
  useEffect(() => {
    if (lastSynced) {
      localStorage.setItem('lastSynced', lastSynced)
    }
  }, [lastSynced])

  // Auto-sync every 60 seconds when online
  useEffect(() => {
    if (!isOnline) return

    const autoSyncInterval = setInterval(async () => {
      if (syncQueue.length > 0 && !isSyncing) {
        await syncNow()
      }
    }, 60000) // Sync every 60 seconds

    return () => clearInterval(autoSyncInterval)
  }, [isOnline, syncQueue.length, isSyncing, syncNow])

  const addToSyncQueue = (data: Record<string, unknown>) => {
    setSyncQueue(prev => [...prev, { ...data, timestamp: new Date().toISOString() }])
  }

  const clearSyncQueue = () => {
    setSyncQueue([])
  }

  return (
    <ConnectionContext.Provider value={{ status, isOnline, syncQueue, addToSyncQueue, clearSyncQueue, syncNow, isSyncing, lastSynced }}>
      {children}
    </ConnectionContext.Provider>
  )
}

export function useConnection() {
  const context = useContext(ConnectionContext)
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider')
  }
  return context
}
