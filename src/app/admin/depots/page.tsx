'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface DepotRow {
  id: string
  location: string
  contact_name?: string | null
  phone?: string | null
  companies?: { name: string } | null
}

interface CompanyRef {
  id: string
  name: string
}

export default function DepotsPage() {
  const [depots, setDepots] = useState<DepotRow[]>([])
  const [companies, setCompanies] = useState<CompanyRef[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const [depotsData, companiesData] = await Promise.all([
      supabase.from('depots').select('*, companies(name)').order('created_at', { ascending: false }),
      supabase.from('companies').select('*')
    ])

    if (depotsData.error) console.error('Error loading depots:', depotsData.error)
    else setDepots(depotsData.data || [])

    if (companiesData.error) console.error('Error loading companies:', companiesData.error)
    else setCompanies(companiesData.data || [])

    setLoading(false)
  }

  useEffect(() => {
    // Mount-only data load; defer so the loader's synchronous
    // setLoading(true) runs after the effect, not inside it.
    queueMicrotask(() => {
      void loadData()
    })
  }, [])

  if (showForm) {
    return <DepotForm onCancel={() => setShowForm(false)} onSuccess={loadData} companies={companies} />
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Depots</h1>
          <p className="mt-2 text-gray-600">Manage depot locations</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add Depot</button>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {depots.map((depot) => (
                <tr key={depot.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{depot.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{depot.contact_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{depot.companies?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{depot.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DepotForm({ onCancel, onSuccess, companies }: { onCancel: () => void; onSuccess: () => void; companies: CompanyRef[] }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    location: '',
    contact_name: '',
    email: '',
    phone: '',
    company_id: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('depots').insert({
      ...formData,
      company_id: formData.company_id || null
    })

    if (error) {
      alert('Failed to create depot: ' + error.message)
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
          <h1 className="text-3xl font-bold text-gray-900">Add Depot</h1>
          <p className="mt-2 text-gray-600">Create a new depot</p>
        </div>
        <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Name</label>
            <input type="text" value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Company</label>
            <select value={formData.company_id} onChange={(e) => setFormData({ ...formData, company_id: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Select Company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{loading ? 'Creating...' : 'Create Depot'}</button>
        </div>
      </form>
    </div>
  )
}
