'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { hashString } from '@/lib/crypto'
import { useToast, ToastContainer } from '@/components/ui/Toast'

interface UserFormProps {
  onCancel: () => void
  onSuccess: () => void
}

export default function UserForm({ onCancel, onSuccess }: UserFormProps) {
  const { toasts, addToast, removeToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'inspector',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    dialling_code: '+27',
    country_id: '',
    province_id: '',
    region_id: '',
    store_id: '',
    branch: '',
    security_question_1: '',
    security_answer_1: '',
    security_question_2: '',
    security_answer_2: ''
  })

  const [countries, setCountries] = useState<any[]>([])
  const [provinces, setProvinces] = useState<any[]>([])
  const [regions, setRegions] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])

  useEffect(() => {
    loadGeographicData()
  }, [])

  useEffect(() => {
    if (formData.country_id) {
      loadProvinces(formData.country_id)
      loadStores(formData.country_id)
    } else {
      setProvinces([])
      setStores([])
    }
  }, [formData.country_id])

  const loadGeographicData = async () => {
    const [countriesData, regionsData, storesData] = await Promise.all([
      supabase.from('countries').select('*').order('priority', { ascending: true }),
      supabase.from('regions').select('*'),
      supabase.from('stores').select('*').eq('is_active', true)
    ])

    setCountries(countriesData.data || [])
    setRegions(regionsData.data || [])
    setStores(storesData.data || [])
  }

  const loadProvinces = async (countryId: string) => {
    const { data } = await supabase.from('provinces').select('*').eq('country_id', countryId)
    setProvinces(data || [])
  }

  const loadStores = async (countryId: string) => {
    const { data } = await supabase.from('stores').select('*').eq('country_id', countryId).eq('is_active', true)
    setStores(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (authError) {
      addToast('Failed to create user: ' + authError.message, 'error')
      setLoading(false)
      return
    }

    // Create user record with extended profile
    if (authData.user) {
      // Hash security answers before storage
      const hashedAnswer1 = await hashString(formData.security_answer_1)
      const hashedAnswer2 = await hashString(formData.security_answer_2)

      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          username: formData.username,
          email: formData.email,
          role: formData.role,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone ? `${formData.dialling_code}${formData.phone}` : null,
          country_id: formData.country_id || null,
          province_id: formData.province_id || null,
          region_id: formData.region_id || null,
          store_id: formData.store_id || null,
          branch: formData.branch,
          security_question_1: formData.security_question_1,
          security_answer_1: hashedAnswer1,
          security_question_2: formData.security_question_2,
          security_answer_2: hashedAnswer2
        })

      if (userError) {
        await supabase.auth.signOut()
        addToast('Failed to create user record: ' + userError.message, 'error')
      } else {
        addToast('User created successfully', 'success')
        onSuccess()
        onCancel()
      }
    }

    setLoading(false)
  }

  return (
    <div className="p-8">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
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

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Personal Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Code</label>
                <input
                  type="text"
                  value={formData.dialling_code}
                  onChange={(e) => setFormData({ ...formData, dialling_code: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Geographic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Geographic Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <select
                value={formData.country_id}
                onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name} {country.is_sadc && '(SADC)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Province/State</label>
              <select
                value={formData.province_id}
                onChange={(e) => setFormData({ ...formData, province_id: e.target.value })}
                disabled={!formData.country_id}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
              >
                <option value="">Select Province</option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Region</label>
              <select
                value={formData.region_id}
                onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Region</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Store/Branch</label>
              <select
                value={formData.store_id}
                onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.branch_code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Branch Name</label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Security Questions */}
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Security Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Security Question 1</label>
              <select
                value={formData.security_question_1}
                onChange={(e) => setFormData({ ...formData, security_question_1: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Question</option>
                <option value="What was your first pet's name?">What was your first pet's name?</option>
                <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                <option value="What city were you born in?">What city were you born in?</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Answer 1</label>
              <input
                type="text"
                value={formData.security_answer_1}
                onChange={(e) => setFormData({ ...formData, security_answer_1: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Security Question 2</label>
              <select
                value={formData.security_question_2}
                onChange={(e) => setFormData({ ...formData, security_question_2: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Question</option>
                <option value="What was your first car?">What was your first car?</option>
                <option value="What is your favorite movie?">What is your favorite movie?</option>
                <option value="What elementary school did you attend?">What elementary school did you attend?</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Answer 2</label>
              <input
                type="text"
                value={formData.security_answer_2}
                onChange={(e) => setFormData({ ...formData, security_answer_2: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Account Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                minLength={12}
              />
              <p className="mt-1 text-xs text-gray-500">Password must be at least 12 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="inspector">Inspector</option>
                <option value="manager">Manager</option>
              </select>
            </div>
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
