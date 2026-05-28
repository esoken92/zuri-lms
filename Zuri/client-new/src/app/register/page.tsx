'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [diallingCode, setDiallingCode] = useState('+27')
  const [countryId, setCountryId] = useState('')
  const [provinceId, setProvinceId] = useState('')
  const [regionId, setRegionId] = useState('')
  const [storeId, setStoreId] = useState('')
  const [branch, setBranch] = useState('')
  const [securityQuestion1, setSecurityQuestion1] = useState('')
  const [securityAnswer1, setSecurityAnswer1] = useState('')
  const [securityQuestion2, setSecurityQuestion2] = useState('')
  const [securityAnswer2, setSecurityAnswer2] = useState('')
  const [role, setRole] = useState('inspector')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Geographic data
  const [countries, setCountries] = useState<any[]>([])
  const [provinces, setProvinces] = useState<any[]>([])
  const [regions, setRegions] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])

  useEffect(() => {
    loadGeographicData()
  }, [])

  useEffect(() => {
    if (countryId) {
      loadProvinces(countryId)
      loadStores(countryId)
    } else {
      setProvinces([])
      setStores([])
    }
  }, [countryId])

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
    setError('')
    setLoading(true)

    const profileData = {
      first_name: firstName,
      last_name: lastName,
      phone: phone ? `${diallingCode}${phone}` : null,
      country_id: countryId || null,
      province_id: provinceId || null,
      region_id: regionId || null,
      store_id: storeId || null,
      branch: branch,
      security_question_1: securityQuestion1,
      security_answer_1: securityAnswer1,
      security_question_2: securityQuestion2,
      security_answer_2: securityAnswer2
    }

    const { error } = await signUp(email, password, username, role, profileData)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-4xl w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">Zuri LMS</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Create a new account</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Personal Information</h3>
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username *</label>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="diallingCode" className="block text-sm font-medium text-gray-700">Code</label>
                  <input
                    id="diallingCode"
                    type="text"
                    value={diallingCode}
                    onChange={(e) => setDiallingCode(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    id="phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Geographic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Geographic Information</h3>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                <select
                  id="country"
                  value={countryId}
                  onChange={(e) => setCountryId(e.target.value)}
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
                <label htmlFor="province" className="block text-sm font-medium text-gray-700">Province/State</label>
                <select
                  id="province"
                  value={provinceId}
                  onChange={(e) => setProvinceId(e.target.value)}
                  disabled={!countryId}
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
                <label htmlFor="region" className="block text-sm font-medium text-gray-700">Region</label>
                <select
                  id="region"
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value)}
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
                <label htmlFor="store" className="block text-sm font-medium text-gray-700">Store/Branch</label>
                <select
                  id="store"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
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
                <label htmlFor="branch" className="block text-sm font-medium text-gray-700">Branch Name</label>
                <input
                  id="branch"
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Security Questions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Security Questions</h3>
            <div>
              <label htmlFor="securityQuestion1" className="block text-sm font-medium text-gray-700">Security Question 1</label>
              <select
                id="securityQuestion1"
                value={securityQuestion1}
                onChange={(e) => setSecurityQuestion1(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Question</option>
                <option value="What was your first pet's name?">What was your first pet's name?</option>
                <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                <option value="What city were you born in?">What city were you born in?</option>
                <option value="What is the name of your favorite teacher?">What is the name of your favorite teacher?</option>
              </select>
            </div>
            <div>
              <label htmlFor="securityAnswer1" className="block text-sm font-medium text-gray-700">Answer 1</label>
              <input
                id="securityAnswer1"
                type="text"
                value={securityAnswer1}
                onChange={(e) => setSecurityAnswer1(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="securityQuestion2" className="block text-sm font-medium text-gray-700">Security Question 2</label>
              <select
                id="securityQuestion2"
                value={securityQuestion2}
                onChange={(e) => setSecurityQuestion2(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Question</option>
                <option value="What was your first car?">What was your first car?</option>
                <option value="What is your favorite movie?">What is your favorite movie?</option>
                <option value="What elementary school did you attend?">What elementary school did you attend?</option>
                <option value="What is the name of your childhood best friend?">What is the name of your childhood best friend?</option>
              </select>
            </div>
            <div>
              <label htmlFor="securityAnswer2" className="block text-sm font-medium text-gray-700">Answer 2</label>
              <input
                id="securityAnswer2"
                type="text"
                value={securityAnswer2}
                onChange={(e) => setSecurityAnswer2(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Account Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Account Settings</h3>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password *</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role *</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="inspector">Inspector</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </div>
          <div className="text-center">
            <a href="/" className="text-sm text-blue-600 hover:text-blue-500">
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
