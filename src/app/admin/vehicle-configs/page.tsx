'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface VehicleConfigRow {
  id: string
  item_code: string
  name: string
  tire_config: unknown
  spares?: number | null
}

export default function VehicleConfigsPage() {
  const [configs, setConfigs] = useState<VehicleConfigRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const loadConfigs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('vehicle_configs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading vehicle configs:', error)
    } else {
      setConfigs(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    // Mount-only data load; defer so the loader's synchronous
    // setLoading(true) runs after the effect, not inside it.
    queueMicrotask(() => {
      void loadConfigs()
    })
  }, [])

  if (showForm) {
    return <VehicleConfigForm onCancel={() => setShowForm(false)} onSuccess={loadConfigs} />
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Configurations</h1>
          <p className="mt-2 text-gray-600">Manage vehicle configurations</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add Config</button>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tire Config</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spares</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {configs.map((config) => (
                <tr key={config.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{config.item_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{config.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{JSON.stringify(config.tire_config).substring(0, 50)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{config.spares}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function VehicleConfigForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    item_code: '',
    name: '',
    tire_config: '{}',
    tire_sizes: '{}',
    ideal_pressures: '{}',
    pressure_units: 'psi',
    spares: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('vehicle_configs').insert({
      ...formData,
      tire_config: JSON.parse(formData.tire_config),
      tire_sizes: JSON.parse(formData.tire_sizes),
      ideal_pressures: JSON.parse(formData.ideal_pressures)
    })

    if (error) {
      alert('Failed to create vehicle config: ' + error.message)
    } else {
      onSuccess()
      onCancel()
    }

    setLoading(false)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Vehicle Configuration</h1>
          <p className="mt-2 text-gray-600">Create a new vehicle configuration</p>
        </div>
        <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Item Code</label>
            <input type="text" value={formData.item_code} onChange={(e) => setFormData({ ...formData, item_code: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tire Config (JSON)</label>
            <textarea value={formData.tire_config} onChange={(e) => setFormData({ ...formData, tire_config: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" rows={3} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tire Sizes (JSON)</label>
            <textarea value={formData.tire_sizes} onChange={(e) => setFormData({ ...formData, tire_sizes: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" rows={2} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ideal Pressures (JSON)</label>
            <textarea value={formData.ideal_pressures} onChange={(e) => setFormData({ ...formData, ideal_pressures: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" rows={2} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Pressure Units</label>
              <select value={formData.pressure_units} onChange={(e) => setFormData({ ...formData, pressure_units: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="psi">PSI</option>
                <option value="bar">Bar</option>
                <option value="kpa">kPa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Spares</label>
              <input type="number" value={formData.spares} onChange={(e) => setFormData({ ...formData, spares: parseInt(e.target.value) || 0 })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{loading ? 'Creating...' : 'Create Config'}</button>
        </div>
      </form>
    </div>
  )
}
