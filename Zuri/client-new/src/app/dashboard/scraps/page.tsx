'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useConnection } from '@/contexts/ConnectionContext'
import { saveToSyncQueue } from '@/lib/offlineSync'

export default function ScrapsPage() {
  const { user } = useAuth()
  const { isOnline, addToSyncQueue } = useConnection()
  const [showForm, setShowForm] = useState(false)
  const [scraps, setScraps] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadScraps = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('scraps')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading scraps:', error)
    } else {
      setScraps(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadScraps()
  }, [])

  if (showForm) {
    return <ScrapForm onCancel={() => setShowForm(false)} onSuccess={loadScraps} />
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scraps</h1>
          <p className="mt-2 text-gray-600">Manage scrap entries</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          New Scrap Entry
        </button>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : scraps.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No scrap entries yet. Create your first entry.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scraps.map((scrap) => (
                <tr key={scrap.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(scrap.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {scrap.user_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {scrap.items?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      scrap.status === 'approved' ? 'bg-green-100 text-green-800' :
                      scrap.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {scrap.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">View</button>
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

function ScrapForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const { user } = useAuth()
  const { isOnline, addToSyncQueue } = useConnection()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    store_id: '',
    items: [] as any[],
  })
  const [stores, setStores] = useState<any[]>([])
  const [scrapData, setScrapData] = useState<any[]>([])

  useEffect(() => {
    loadReferenceData()
  }, [])

  const loadReferenceData = async () => {
    const { data: storesData } = await supabase.from('stores').select('*')
    const { data: scrapDataList } = await supabase.from('scrap_data').select('*')
    setStores(storesData || [])
    setScrapData(scrapDataList || [])
  }

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      location: '',
      damageCode: '',
      damageDescription: '',
      quantity: 1,
      notes: ''
    }
    setFormData({ ...formData, items: [...formData.items, newItem] })
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setFormData({ ...formData, items: updatedItems })
  }

  const removeItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: updatedItems })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const scrapData = {
      user_id: user?.id,
      user_name: user?.email,
      store_id: formData.store_id || null,
      items: formData.items,
      status: 'pending',
    }

    if (isOnline) {
      const { error } = await supabase.from('scraps').insert(scrapData)

      if (error) {
        console.error('Error creating scrap:', error)
        alert('Failed to create scrap entry')
      } else {
        onSuccess()
        onCancel()
      }
    } else {
      // Save to sync queue when offline
      saveToSyncQueue('scrap', scrapData)
      addToSyncQueue({ type: 'scrap', data: scrapData })
      alert('Scrap entry saved locally. Will sync when connection is restored.')
      onSuccess()
      onCancel()
    }

    setLoading(false)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Scrap Entry</h1>
          <p className="mt-2 text-gray-600">Create a new scrap entry</p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Store</label>
            <select
              value={formData.store_id}
              onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Scrap Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add Item
              </button>
            </div>

            {formData.items.length === 0 ? (
              <p className="text-sm text-gray-500">No items added yet. Click "Add Item" to start.</p>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <select
                          value={item.location}
                          onChange={(e) => updateItem(index, 'location', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Select Location</option>
                          {[...new Set(scrapData.map(d => d.location))].map((loc) => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Damage Code</label>
                        <select
                          value={item.damageCode}
                          onChange={(e) => {
                            const selected = scrapData.find(d => d.damage_code === e.target.value)
                            updateItem(index, 'damageCode', e.target.value)
                            if (selected) {
                              updateItem(index, 'damageDescription', selected.damage_description)
                            }
                          }}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Select Damage Code</option>
                          {scrapData
                            .filter(d => !item.location || d.location === item.location)
                            .map((d) => (
                              <option key={d.id} value={d.damage_code}>{d.damage_code} - {d.damage_description}</option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Damage Description</label>
                        <input
                          type="text"
                          value={item.damageDescription}
                          onChange={(e) => updateItem(index, 'damageDescription', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Damage description"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <textarea
                          value={item.notes}
                          onChange={(e) => updateItem(index, 'notes', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Additional notes"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Scrap Entry'}
          </button>
        </div>
      </form>
    </div>
  )
}
