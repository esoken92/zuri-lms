'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { syncData } from '@/lib/offlineSync'

type ConnectionStatus = 'online' | 'offline' | 'slow'

interface ConnectionContextType {
  status: ConnectionStatus
  isOnline: boolean
  syncQueue: any[]
  addToSyncQueue: (data: any) => void
  clearSyncQueue: () => void
  syncNow: () => Promise<void>
  isSyncing: boolean
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined)

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('online')
  const [isOnline, setIsOnline] = useState(true)
  const [syncQueue, setSyncQueue] = useState<any[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine)

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
        const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL!, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
        })
        if (isOnline) {
          setStatus('online')
        }
      } catch (error) {
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
  }, [isOnline])

  // Load sync queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('syncQueue')
    if (savedQueue) {
      setSyncQueue(JSON.parse(savedQueue))
    }
  }, [])

  // Save sync queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('syncQueue', JSON.stringify(syncQueue))
  }, [syncQueue])

  const syncNow = async () => {
    if (!isOnline || isSyncing || syncQueue.length === 0) return

    setIsSyncing(true)
    try {
      const result = await syncData()
      if (result.success) {
        setSyncQueue([])
      } else {
        // Update queue with remaining items
        const remainingQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]')
        setSyncQueue(remainingQueue)
      }
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const addToSyncQueue = (data: any) => {
    setSyncQueue(prev => [...prev, { ...data, timestamp: new Date().toISOString() }])
  }

  const clearSyncQueue = () => {
    setSyncQueue([])
  }

  return (
    <ConnectionContext.Provider value={{ status, isOnline, syncQueue, addToSyncQueue, clearSyncQueue, syncNow, isSyncing }}>
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
