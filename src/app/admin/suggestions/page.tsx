'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Suggestion {
  id: string
  username: string | null
  created_at: string
  status: string | null
  suggestion_type: string | null
  suggestion_data: unknown
  admin_notes: string | null
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)

  const loadSuggestions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('user_suggestions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading suggestions:', error)
    } else {
      setSuggestions(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    // Mount-only data load; defer so the loader's synchronous
    // setLoading(true) runs after the effect, not inside it.
    queueMicrotask(() => {
      void loadSuggestions()
    })
  }, [])

  const updateStatus = async (id: string, status: string, adminNotes: string) => {
    const { error } = await supabase
      .from('user_suggestions')
      .update({
        status,
        admin_notes: adminNotes,
        admin_reviewed_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      alert('Failed to update suggestion: ' + error.message)
    } else {
      loadSuggestions()
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Suggestions</h1>
        <p className="mt-2 text-gray-600">Review and manage user suggestions</p>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : suggestions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No suggestions yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onUpdate={updateStatus}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SuggestionCard({ suggestion, onUpdate }: { suggestion: Suggestion; onUpdate: (id: string, status: string, notes: string) => void }) {
  const [adminNotes, setAdminNotes] = useState(suggestion.admin_notes || '')
  const [showNotes, setShowNotes] = useState(false)

  const handleStatusChange = (status: string) => {
    onUpdate(suggestion.id, status, adminNotes)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{suggestion.username}</h3>
          <p className="text-sm text-gray-500">{new Date(suggestion.created_at).toLocaleString()}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          suggestion.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          suggestion.status === 'approved' ? 'bg-green-100 text-green-800' :
          suggestion.status === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {suggestion.status}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-1">Type: {suggestion.suggestion_type}</p>
        <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-40">
          {JSON.stringify(suggestion.suggestion_data, null, 2)}
        </pre>
      </div>

      {suggestion.admin_notes && (
        <div className="mb-4 bg-blue-50 p-3 rounded">
          <p className="text-sm font-medium text-gray-700">Admin Notes:</p>
          <p className="text-sm text-gray-600">{suggestion.admin_notes}</p>
        </div>
      )}

      <div className="flex items-center space-x-2">
        {showNotes && (
          <input
            type="text"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add admin notes..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        )}
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {showNotes ? 'Cancel' : 'Add Notes'}
        </button>
        {suggestion.status === 'pending' && (
          <>
            <button
              onClick={() => handleStatusChange('approved')}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => handleStatusChange('rejected')}
              className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  )
}
