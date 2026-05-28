'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [loadingData, setLoadingData] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [extendedData, setExtendedData] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    setLoadingData(true)
    
    // Get user data
    const { data: userRecord } = await supabase
      .from('users')
      .select('*')
      .eq('id', user?.id)
      .single()

    // Get extended profile
    const { data: extendedRecord } = await supabase
      .from('users_extended')
      .select('*')
      .eq('user_id', user?.id)
      .single()

    setUserData(userRecord)
    setExtendedData(extendedRecord)
    setLoadingData(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const phone = formData.get('phone') as string

    // Update or create extended profile
    const { error } = await supabase
      .from('users_extended')
      .upsert({
        user_id: user?.id,
        first_name: firstName,
        last_name: lastName,
        phone,
        updated_at: new Date().toISOString()
      })

    if (error) {
      setMessage('Failed to update profile')
    } else {
      setMessage('Profile updated successfully')
      loadUserData()
    }

    setSaving(false)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match')
      setSaving(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      setMessage('Failed to update password: ' + error.message)
    } else {
      setMessage('Password updated successfully')
      ;(e.currentTarget as HTMLFormElement).reset()
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your account settings</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded ${
          message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
          
          {loadingData ? (
            <div className="text-gray-500">Loading...</div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={userData?.username || ''}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <input
                  type="text"
                  value={userData?.role || ''}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 capitalize"
                />
              </div>
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  defaultValue={extendedData?.first_name || ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  defaultValue={extendedData?.last_name || ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={extendedData?.phone || ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Update Profile'}
              </button>
            </form>
          )}
        </div>

        {/* Password Change */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h2>
          <div className="space-y-4">
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
