import { supabase } from './supabase'

export interface SyncItem {
  id: string
  type: 'inspection' | 'scrap' | 'user'
  data: Record<string, unknown>
  timestamp: string
}

export async function syncData() {
  const syncQueue: SyncItem[] = JSON.parse(localStorage.getItem('syncQueue') || '[]')

  if (syncQueue.length === 0) return { success: true, synced: 0 }

  let synced = 0
  const errors: { item: SyncItem; error: unknown }[] = []

  for (const item of syncQueue) {
    try {
      switch (item.type) {
        case 'inspection':
          const { error: inspectionError } = await supabase
            .from('inspections')
            .insert(item.data)
          if (inspectionError) throw inspectionError
          break

        case 'scrap':
          const { error: scrapError } = await supabase
            .from('scraps')
            .insert(item.data)
          if (scrapError) throw scrapError
          break

        case 'user':
          const { error: userError } = await supabase
            .from('users')
            .insert(item.data)
          if (userError) throw userError
          break

        default:
          console.error('Unknown sync item type:', item.type)
      }
      synced++
    } catch (error) {
      errors.push({ item, error })
    }
  }

  // Remove successfully synced items from queue
  const remainingQueue = syncQueue.slice(synced)
  localStorage.setItem('syncQueue', JSON.stringify(remainingQueue))

  return { success: errors.length === 0, synced, errors }
}

export function saveToSyncQueue(type: 'inspection' | 'scrap' | 'user', data: Record<string, unknown>) {
  const syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]')
  const newItem: SyncItem = {
    id: `${Date.now()}-${Math.random()}`,
    type,
    data,
    timestamp: new Date().toISOString()
  }
  syncQueue.push(newItem)
  localStorage.setItem('syncQueue', JSON.stringify(syncQueue))
  return newItem
}

export function getSyncQueueCount(): number {
  const syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]')
  return syncQueue.length
}
