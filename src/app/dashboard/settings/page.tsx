'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type DataType = 'companies' | 'tyres' | 'depots' | 'vehicle-configs' | 'stores' | 'countries' | 'provinces' | 'regions' | 'scrap_data'

interface UserProfile {
  username?: string
  role?: string
}

interface ExtendedProfile {
  first_name?: string
  last_name?: string
  phone?: string
}

interface ExistingRow {
  id: string
  [key: string]: unknown
}

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [loadingData, setLoadingData] = useState(true)
  const [userData, setUserData] = useState<UserProfile | null>(null)
  const [extendedData, setExtendedData] = useState<ExtendedProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'data' | 'account'>('profile')
  
  // Data import state
  const [selectedType, setSelectedType] = useState<DataType>('companies')
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  
  // Data management state
  const [viewMode, setViewMode] = useState<'import' | 'view' | 'add'>('import')
  const [existingData, setExistingData] = useState<ExistingRow[]>([])
  const [loadingExistingData, setLoadingExistingData] = useState(false)
  const [singleEntry, setSingleEntry] = useState<Record<string, string>>({})
  const [addingEntry, setAddingEntry] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const loadUserData = useCallback(async () => {
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
  }, [user])

  // Check if user has admin/management role
  const canManageData = useCallback(() => {
    const role = userData?.role?.toLowerCase()
    return role === 'admin' || role === 'management' || role === 'administrator'
  }, [userData])

  // Load existing data for selected type
  const loadExistingData = useCallback(async () => {
    setLoadingExistingData(true)
    try {
      let tableName = ''
      switch (selectedType) {
        case 'companies': tableName = 'companies'; break
        case 'tyres': tableName = 'tyres'; break
        case 'depots': tableName = 'depots'; break
        case 'vehicle-configs': tableName = 'vehicle_configs'; break
        case 'stores': tableName = 'stores'; break
        case 'countries': tableName = 'countries'; break
        case 'provinces': tableName = 'provinces'; break
        case 'regions': tableName = 'regions'; break
        case 'scrap_data': tableName = 'scrap_data'; break
      }

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setExistingData(data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      setMessage('Failed to load existing data')
    } finally {
      setLoadingExistingData(false)
    }
  }, [selectedType])

  useEffect(() => {
    if (user) {
      // Load profile after mount; deferred so state updates run after the effect.
      queueMicrotask(() => {
        void loadUserData()
      })
    }
  }, [user, loadUserData])

  // Load data when type or view mode changes
  useEffect(() => {
    if (viewMode === 'view' && canManageData()) {
      queueMicrotask(() => {
        void loadExistingData()
      })
    }
  }, [viewMode, canManageData, loadExistingData])

  // Add single entry
  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageData()) {
      setMessage('You do not have permission to manage data')
      return
    }

    setAddingEntry(true)
    setMessage('')

    try {
      let tableName = ''
      const entryData: Record<string, unknown> = {}

      switch (selectedType) {
        case 'companies':
          tableName = 'companies'
          entryData.name = singleEntry.name
          entryData.contact_person = singleEntry.contact_person || null
          entryData.email = singleEntry.email || null
          entryData.phone = singleEntry.phone || null
          entryData.address = singleEntry.address || null
          break

        case 'tyres':
          tableName = 'tyres'
          entryData.brand = singleEntry.brand
          entryData.model = singleEntry.model || null
          entryData.size = singleEntry.size || null
          entryData.pattern = singleEntry.pattern || null
          entryData.load_index = singleEntry.load_index || null
          entryData.speed_rating = singleEntry.speed_rating || null
          entryData.description = singleEntry.description || null
          break

        case 'depots':
          tableName = 'depots'
          entryData.location = singleEntry.location
          entryData.company_id = singleEntry.company_id || null
          entryData.address = singleEntry.address || null
          entryData.contact_person = singleEntry.contact_person || null
          entryData.phone = singleEntry.phone || null
          break

        case 'vehicle-configs':
          tableName = 'vehicle_configs'
          entryData.name = singleEntry.name
          entryData.description = singleEntry.description || null
          entryData.tire_positions = singleEntry.tire_positions ? JSON.parse(singleEntry.tire_positions) : null
          entryData.tire_requirements = singleEntry.tire_requirements ? JSON.parse(singleEntry.tire_requirements) : null
          break

        case 'stores':
          tableName = 'stores'
          entryData.name = singleEntry.name
          entryData.location = singleEntry.location || null
          entryData.company_id = singleEntry.company_id || null
          entryData.address = singleEntry.address || null
          entryData.contact_person = singleEntry.contact_person || null
          entryData.phone = singleEntry.phone || null
          break

        case 'countries':
          tableName = 'countries'
          entryData.name = singleEntry.name
          entryData.code = singleEntry.code || null
          entryData.region = singleEntry.region || null
          break

        case 'provinces':
          tableName = 'provinces'
          entryData.name = singleEntry.name
          entryData.country_id = singleEntry.country_id || null
          entryData.code = singleEntry.code || null
          break

        case 'regions':
          tableName = 'regions'
          entryData.name = singleEntry.name
          entryData.country_id = singleEntry.country_id || null
          entryData.description = singleEntry.description || null
          break

        case 'scrap_data':
          tableName = 'scrap_data'
          entryData.tyre_id = singleEntry.tyre_id || null
          entryData.depot_id = singleEntry.depot_id || null
          entryData.scrap_date = singleEntry.scrap_date || new Date().toISOString()
          entryData.reason = singleEntry.reason || null
          entryData.notes = singleEntry.notes || null
          break
      }

      const { error } = await supabase.from(tableName).insert(entryData)

      if (error) throw error

      setMessage('Entry added successfully')
      setSingleEntry({})
      if (viewMode === 'view') {
        loadExistingData()
      }
    } catch (error) {
      setMessage('Failed to add entry: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setAddingEntry(false)
    }
  }

  // Delete entry
  const handleDeleteEntry = async (id: string) => {
    if (!canManageData()) {
      setMessage('You do not have permission to manage data')
      return
    }

    setDeletingId(id)
    setMessage('')

    try {
      let tableName = ''
      switch (selectedType) {
        case 'companies': tableName = 'companies'; break
        case 'tyres': tableName = 'tyres'; break
        case 'depots': tableName = 'depots'; break
        case 'vehicle-configs': tableName = 'vehicle_configs'; break
        case 'stores': tableName = 'stores'; break
        case 'countries': tableName = 'countries'; break
        case 'provinces': tableName = 'provinces'; break
        case 'regions': tableName = 'regions'; break
        case 'scrap_data': tableName = 'scrap_data'; break
      }

      const { error } = await supabase.from(tableName).delete().eq('id', id)

      if (error) throw error

      setMessage('Entry deleted successfully')
      loadExistingData()
    } catch (error) {
      setMessage('Failed to delete entry: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setDeletingId(null)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
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

  // Data import functions
  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    const data: Record<string, string>[] = []

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim())
        const obj: Record<string, string> = {}
        headers.forEach((header, index) => {
          obj[header] = values[index] || ''
        })
        data.push(obj)
      }
    }

    return data
  }

  const parseJSON = (text: string): Record<string, string>[] => {
    try {
      const parsed = JSON.parse(text) as Record<string, string> | Record<string, string>[]
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return []
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setImportResults(null)
    }
  }

  const importData = async () => {
    if (!file) return

    setImporting(true)
    setImportResults(null)

    try {
      const text = await file.text()
      let data: Record<string, string>[] = []

      if (file.name.endsWith('.csv')) {
        data = parseCSV(text)
      } else if (file.name.endsWith('.json')) {
        data = parseJSON(text)
      } else {
        throw new Error('Unsupported file format. Use CSV or JSON.')
      }

      let success = 0
      let failed = 0
      const errors: string[] = []

      for (const item of data) {
        try {
          switch (selectedType) {
            case 'companies':
              await supabase.from('companies').insert({
                name: item.name,
                contact_person: item.contact_person || null,
                email: item.email || null,
                phone: item.phone || null,
                address: item.address || null
              })
              break

            case 'tyres':
              await supabase.from('tyres').insert({
                brand: item.brand,
                model: item.model || null,
                size: item.size || null,
                pattern: item.pattern || null,
                load_index: item.load_index || null,
                speed_rating: item.speed_rating || null,
                description: item.description || null
              })
              break

            case 'depots':
              await supabase.from('depots').insert({
                location: item.location,
                company_id: item.company_id || null,
                address: item.address || null,
                contact_person: item.contact_person || null,
                phone: item.phone || null
              })
              break

            case 'vehicle-configs':
              await supabase.from('vehicle_configs').insert({
                name: item.name,
                description: item.description || null,
                tire_positions: item.tire_positions ? JSON.parse(item.tire_positions) : null,
                tire_requirements: item.tire_requirements ? JSON.parse(item.tire_requirements) : null
              })
              break

            case 'stores':
              await supabase.from('stores').insert({
                name: item.name,
                location: item.location || null,
                company_id: item.company_id || null,
                address: item.address || null,
                contact_person: item.contact_person || null,
                phone: item.phone || null
              })
              break

            case 'countries':
              await supabase.from('countries').insert({
                name: item.name,
                code: item.code || null,
                region: item.region || null
              })
              break

            case 'provinces':
              await supabase.from('provinces').insert({
                name: item.name,
                country_id: item.country_id || null,
                code: item.code || null
              })
              break

            case 'regions':
              await supabase.from('regions').insert({
                name: item.name,
                country_id: item.country_id || null,
                description: item.description || null
              })
              break

            case 'scrap_data':
              await supabase.from('scrap_data').insert({
                tyre_id: item.tyre_id || null,
                depot_id: item.depot_id || null,
                scrap_date: item.scrap_date || new Date().toISOString(),
                reason: item.reason || null,
                notes: item.notes || null
              })
              break
          }
          success++
        } catch (error) {
          failed++
          errors.push(`Row ${success + failed}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      setImportResults({ success, failed, errors })
    } catch (error) {
      setImportResults({ success: 0, failed: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] })
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    let template = ''
    let filename = ''

    switch (selectedType) {
      case 'companies':
        template = 'name,contact_person,email,phone,address\nExample Company,John Doe,john@example.com,+1234567890,123 Main St'
        filename = 'companies_template.csv'
        break
      case 'tyres':
        template = 'brand,model,size,pattern,load_index,speed_rating,description\nMichelin,Primacy,205/55R16,Energy Saver,91,H,All-season tire'
        filename = 'tyres_template.csv'
        break
      case 'depots':
        template = 'location,company_id,address,contact_person,phone\nMain Depot,1,456 Depot Ave,Jane Smith,+9876543210'
        filename = 'depots_template.csv'
        break
      case 'vehicle-configs':
        template = 'name,description,tire_positions,tire_requirements\nStandard Config,Standard vehicle configuration,"[{""position"":1,""size"":""205/55R16""}]","[{""min_tread"":3}]"'
        filename = 'vehicle-configs_template.csv'
        break
      case 'stores':
        template = 'name,location,company_id,address,contact_person,phone\nMain Store,1,1,123 Store St,John Doe,+1234567890'
        filename = 'stores_template.csv'
        break
      case 'countries':
        template = 'name,code,region\nSouth Africa,ZAF,Africa\nUnited States,USA,North America'
        filename = 'countries_template.csv'
        break
      case 'provinces':
        template = 'name,country_id,code\nGauteng,1,GP\nWestern Cape,1,WC'
        filename = 'provinces_template.csv'
        break
      case 'regions':
        template = 'name,country_id,description\nNorthern Region,1,Northern area of the country\nSouthern Region,1,Southern area of the country'
        filename = 'regions_template.csv'
        break
      case 'scrap_data':
        template = 'tyre_id,depot_id,scrap_date,reason,notes\n1,1,2024-01-15,Worn out,Tread depth below minimum'
        filename = 'scrap_data_template.csv'
        break
    }

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'password'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Password
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'data'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Data Management
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'account'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Account Actions
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
          
          {loadingData ? (
            <div className="text-gray-500">Loading...</div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-2xl">
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
      )}

      {activeTab === 'password' && (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
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
      )}

      {activeTab === 'data' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>
          
          {!canManageData() ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800">
                Data management is restricted to admin and management users only.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-6">
                Import data in bulk, view existing data, or add single entries. This feature is restricted to admin and management users.
              </p>

              {/* Mode Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('import')}
                    className={`px-4 py-2 rounded-md ${
                      viewMode === 'import'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Bulk Import
                  </button>
                  <button
                    onClick={() => setViewMode('view')}
                    className={`px-4 py-2 rounded-md ${
                      viewMode === 'view'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    View Existing
                  </button>
                  <button
                    onClick={() => setViewMode('add')}
                    className={`px-4 py-2 rounded-md ${
                      viewMode === 'add'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Add Single Entry
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as DataType)}
                  className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="companies">Companies</option>
                  <option value="tyres">Tyres</option>
                  <option value="depots">Depots</option>
                  <option value="vehicle-configs">Vehicle Configurations</option>
                  <option value="stores">Stores</option>
                  <option value="countries">Countries</option>
                  <option value="provinces">Provinces</option>
                  <option value="regions">Regions</option>
                  <option value="scrap_data">Scrap Data</option>
                </select>
              </div>

              {/* Import Mode */}
              {viewMode === 'import' && (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload File (CSV or JSON)</label>
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileChange}
                      className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Upload a CSV or JSON file with the data to import. Download a template to see the required format.
                    </p>
                  </div>

                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={downloadTemplate}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Download Template
                    </button>
                    <button
                      onClick={importData}
                      disabled={!file || importing}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {importing ? 'Importing...' : 'Import Data'}
                    </button>
                  </div>

                  {importResults && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Import Results</h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-green-50 p-4 rounded">
                          <div className="text-green-800 font-medium">Successful</div>
                          <div className="text-2xl font-bold text-green-900">{importResults.success}</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded">
                          <div className="text-red-800 font-medium">Failed</div>
                          <div className="text-2xl font-bold text-red-900">{importResults.failed}</div>
                        </div>
                      </div>

                      {importResults.errors.length > 0 && (
                        <div className="bg-red-50 p-4 rounded">
                          <h4 className="font-medium text-red-800 mb-2">Errors</h4>
                          <ul className="text-sm text-red-700 space-y-1 max-h-60 overflow-y-auto">
                            {importResults.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* View Mode */}
              {viewMode === 'view' && (
                <>
                  {loadingExistingData ? (
                    <div className="text-gray-500">Loading data...</div>
                  ) : existingData.length === 0 ? (
                    <div className="text-gray-500">No data found for this type.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(existingData[0] || {})
                              .filter(key => key !== 'created_at' && key !== 'updated_at')
                              .slice(0, 5)
                              .map(key => (
                                <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {key}
                                </th>
                              ))}
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {existingData.map((item) => (
                            <tr key={item.id}>
                              {Object.keys(item)
                                .filter(key => key !== 'created_at' && key !== 'updated_at' && key !== 'id')
                                .slice(0, 5)
                                .map(key => (
                                  <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {String(item[key] || '-')}
                                  </td>
                                ))}
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleDeleteEntry(item.id)}
                                  disabled={deletingId === item.id}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                >
                                  {deletingId === item.id ? 'Deleting...' : 'Delete'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* Add Single Entry Mode */}
              {viewMode === 'add' && (
                <form onSubmit={handleAddEntry} className="space-y-4 max-w-2xl">
                  {selectedType === 'companies' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name *</label>
                        <input
                          type="text"
                          required
                          value={singleEntry.name || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, name: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                        <input
                          type="text"
                          value={singleEntry.contact_person || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, contact_person: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          value={singleEntry.email || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, email: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                          type="tel"
                          value={singleEntry.phone || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, phone: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input
                          type="text"
                          value={singleEntry.address || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, address: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </>
                  )}

                  {selectedType === 'tyres' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Brand *</label>
                        <input
                          type="text"
                          required
                          value={singleEntry.brand || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, brand: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Model</label>
                        <input
                          type="text"
                          value={singleEntry.model || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, model: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Size</label>
                        <input
                          type="text"
                          value={singleEntry.size || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, size: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Pattern</label>
                        <input
                          type="text"
                          value={singleEntry.pattern || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, pattern: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Load Index</label>
                        <input
                          type="text"
                          value={singleEntry.load_index || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, load_index: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Speed Rating</label>
                        <input
                          type="text"
                          value={singleEntry.speed_rating || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, speed_rating: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          value={singleEntry.description || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, description: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  {selectedType === 'depots' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Location *</label>
                        <input
                          type="text"
                          required
                          value={singleEntry.location || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, location: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Company ID</label>
                        <input
                          type="text"
                          value={singleEntry.company_id || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, company_id: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input
                          type="text"
                          value={singleEntry.address || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, address: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                        <input
                          type="text"
                          value={singleEntry.contact_person || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, contact_person: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                          type="tel"
                          value={singleEntry.phone || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, phone: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </>
                  )}

                  {selectedType === 'vehicle-configs' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name *</label>
                        <input
                          type="text"
                          required
                          value={singleEntry.name || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, name: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          value={singleEntry.description || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, description: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tire Positions (JSON)</label>
                        <textarea
                          value={singleEntry.tire_positions || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, tire_positions: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                          placeholder='[{"position":1,"size":"205/55R16"}]'
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tire Requirements (JSON)</label>
                        <textarea
                          value={singleEntry.tire_requirements || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, tire_requirements: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                          placeholder='[{"min_tread":3}]'
                        />
                      </div>
                    </>
                  )}

                  {selectedType === 'stores' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name *</label>
                        <input
                          type="text"
                          required
                          value={singleEntry.name || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, name: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <input
                          type="text"
                          value={singleEntry.location || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, location: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Company ID</label>
                        <input
                          type="text"
                          value={singleEntry.company_id || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, company_id: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input
                          type="text"
                          value={singleEntry.address || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, address: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                        <input
                          type="text"
                          value={singleEntry.contact_person || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, contact_person: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                          type="tel"
                          value={singleEntry.phone || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, phone: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </>
                  )}

                  {selectedType === 'countries' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name *</label>
                        <input
                          type="text"
                          required
                          value={singleEntry.name || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, name: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Code</label>
                        <input
                          type="text"
                          value={singleEntry.code || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, code: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Region</label>
                        <input
                          type="text"
                          value={singleEntry.region || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, region: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </>
                  )}

                  {selectedType === 'provinces' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name *</label>
                        <input
                          type="text"
                          required
                          value={singleEntry.name || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, name: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Country ID</label>
                        <input
                          type="text"
                          value={singleEntry.country_id || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, country_id: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Code</label>
                        <input
                          type="text"
                          value={singleEntry.code || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, code: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </>
                  )}

                  {selectedType === 'regions' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name *</label>
                        <input
                          type="text"
                          required
                          value={singleEntry.name || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, name: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Country ID</label>
                        <input
                          type="text"
                          value={singleEntry.country_id || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, country_id: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          value={singleEntry.description || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, description: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  {selectedType === 'scrap_data' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tyre ID</label>
                        <input
                          type="text"
                          value={singleEntry.tyre_id || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, tyre_id: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Depot ID</label>
                        <input
                          type="text"
                          value={singleEntry.depot_id || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, depot_id: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Scrap Date</label>
                        <input
                          type="date"
                          value={singleEntry.scrap_date || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, scrap_date: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reason</label>
                        <input
                          type="text"
                          value={singleEntry.reason || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, reason: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <textarea
                          value={singleEntry.notes || ''}
                          onChange={(e) => setSingleEntry({...singleEntry, notes: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={addingEntry}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addingEntry ? 'Adding...' : 'Add Entry'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'account' && (
        <div className="bg-white rounded-lg shadow p-6">
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
      )}
    </div>
  )
}
