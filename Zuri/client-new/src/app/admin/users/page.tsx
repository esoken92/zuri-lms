'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading users:', error)
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  if (showForm) {
    return <UserForm onCancel={() => setShowForm(false)} onSuccess={loadUsers} />
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="mt-2 text-gray-600">Manage user accounts</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add User
        </button>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
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

function UserForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'inspector',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (authError) {
      alert('Failed to create user: ' + authError.message)
      setLoading(false)
      return
    }

    // Create user record
    if (authData.user) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          username: formData.username,
          email: formData.email,
          role: formData.role,
        })

      if (userError) {
        await supabase.auth.signOut()
        alert('Failed to create user record: ' + userError.message)
      } else {
        onSuccess()
        onCancel()
      }
    }

    setLoading(false)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add User</h1>
          <p className="mt-2 text-gray-600">Create a new user account</p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="inspector">Inspector</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  )
}
