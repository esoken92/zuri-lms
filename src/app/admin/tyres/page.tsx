'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface TyreRow {
  id: string
  brand: string
  pattern?: string | null
  section_width?: string | null
  aspect_ratio?: string | null
  rim_size?: string | null
  tread_depth?: number | null
  product_code?: string | null
}

export default function TyresPage() {
  const [tyres, setTyres] = useState<TyreRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const loadTyres = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tyres')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading tyres:', error)
    } else {
      setTyres(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    // Mount-only data load; defer so the loader's synchronous
    // setLoading(true) runs after the effect, not inside it.
    queueMicrotask(() => {
      void loadTyres()
    })
  }, [])

  if (showForm) {
    return <TyreForm onCancel={() => setShowForm(false)} onSuccess={loadTyres} />
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tyres</h1>
          <p className="mt-2 text-gray-600">Manage tyre inventory</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add Tyre</button>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pattern</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tread Depth</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tyres.map((tyre) => (
                <tr key={tyre.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tyre.brand}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tyre.pattern}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tyre.section_width}/{tyre.aspect_ratio} R{tyre.rim_size}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tyre.tread_depth}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tyre.product_code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function TyreForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    brand: '',
    pattern: '',
    ply_rating: '',
    tread_depth: '',
    load_rating: '',
    speed_rating: '',
    tube_rating: '',
    section_width: '',
    aspect_ratio: '',
    rim_size: '',
    product_code: '',
    depth_inner: '',
    depth_middle: '',
    depth_outer: '',
    comments: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('tyres').insert({
      ...formData,
      tread_depth: formData.tread_depth ? parseFloat(formData.tread_depth) : null,
      depth_inner: formData.depth_inner ? parseFloat(formData.depth_inner) : null,
      depth_middle: formData.depth_middle ? parseFloat(formData.depth_middle) : null,
      depth_outer: formData.depth_outer ? parseFloat(formData.depth_outer) : null
    })

    if (error) {
      alert('Failed to create tyre: ' + error.message)
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
          <h1 className="text-3xl font-bold text-gray-900">Add Tyre</h1>
          <p className="mt-2 text-gray-600">Add a new tyre to inventory</p>
        </div>
        <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Brand</label>
            <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Pattern</label>
            <input type="text" value={formData.pattern} onChange={(e) => setFormData({ ...formData, pattern: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Code</label>
            <input type="text" value={formData.product_code} onChange={(e) => setFormData({ ...formData, product_code: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Section Width</label>
            <input type="text" value={formData.section_width} onChange={(e) => setFormData({ ...formData, section_width: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Aspect Ratio</label>
            <input type="text" value={formData.aspect_ratio} onChange={(e) => setFormData({ ...formData, aspect_ratio: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rim Size</label>
            <input type="text" value={formData.rim_size} onChange={(e) => setFormData({ ...formData, rim_size: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ply Rating</label>
            <input type="text" value={formData.ply_rating} onChange={(e) => setFormData({ ...formData, ply_rating: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Load Rating</label>
            <input type="text" value={formData.load_rating} onChange={(e) => setFormData({ ...formData, load_rating: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Speed Rating</label>
            <input type="text" value={formData.speed_rating} onChange={(e) => setFormData({ ...formData, speed_rating: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tube Rating</label>
            <input type="text" value={formData.tube_rating} onChange={(e) => setFormData({ ...formData, tube_rating: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tread Depth</label>
            <input type="number" step="0.1" value={formData.tread_depth} onChange={(e) => setFormData({ ...formData, tread_depth: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Depth Inner</label>
            <input type="number" step="0.1" value={formData.depth_inner} onChange={(e) => setFormData({ ...formData, depth_inner: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Depth Middle</label>
            <input type="number" step="0.1" value={formData.depth_middle} onChange={(e) => setFormData({ ...formData, depth_middle: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Depth Outer</label>
            <input type="number" step="0.1" value={formData.depth_outer} onChange={(e) => setFormData({ ...formData, depth_outer: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Comments</label>
            <textarea value={formData.comments} onChange={(e) => setFormData({ ...formData, comments: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" rows={2} />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{loading ? 'Creating...' : 'Add Tyre'}</button>
        </div>
      </form>
    </div>
  )
}
