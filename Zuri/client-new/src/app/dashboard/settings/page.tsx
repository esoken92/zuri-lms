'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type DataType = 'companies' | 'tyres' | 'depots' | 'vehicle-configs' | 'stores' | 'countries' | 'provinces' | 'regions' | 'scrap_data'

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [loadingData, setLoadingData] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [extendedData, setExtendedData] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'data' | 'account'>('profile')
  
  // Data import state
  const [selectedType, setSelectedType] = useState<DataType>('companies')
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null)

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

  // Data import functions
  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    const data = []

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim())
        const obj: any = {}
        headers.forEach((header, index) => {
          obj[header] = values[index] || ''
        })
        data.push(obj)
      }
    }

    return data
  }

  const parseJSON = (text: string): any[] => {
    try {
      const parsed = JSON.parse(text)
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
      let data: any[] = []

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
          <p className="text-sm text-gray-600 mb-6">
            Import data in bulk using CSV or JSON files. This feature is restricted to settings to prevent casual data modifications.
          </p>

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
