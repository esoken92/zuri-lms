'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useConnection } from '@/contexts/ConnectionContext'
import { useBluetooth } from '@/contexts/BluetoothContext'
import { saveToSyncQueue } from '@/lib/offlineSync'
import BluetoothPanel from '@/components/BluetoothPanel'

export default function InspectionsPage() {
  const { user } = useAuth()
  const { isOnline, addToSyncQueue } = useConnection()
  const { currentReading } = useBluetooth()
  const [showForm, setShowForm] = useState(false)
  const [inspections, setInspections] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadInspections = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading inspections:', error)
    } else {
      setInspections(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadInspections()
  }, [])

  if (showForm) {
    return (
      <>
        <InspectionForm onCancel={() => setShowForm(false)} onSuccess={loadInspections} />
        <BluetoothPanel />
      </>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inspections</h1>
          <p className="mt-2 text-gray-600">Manage tire inspections</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          New Inspection
        </button>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : inspections.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No inspections yet. Create your first inspection.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inspector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inspections.map((inspection) => (
                <tr key={inspection.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(inspection.inspection_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {inspection.user_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {inspection.location || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {inspection.vehicles?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">View</button>
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

function InspectionForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const { user } = useAuth()
  const { isOnline, addToSyncQueue } = useConnection()
  const { currentReading } = useBluetooth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    inspection_date: new Date().toISOString().split('T')[0],
    location: '',
    company_id: '',
    depot_id: '',
    vehicles: [] as any[],
  })
  const [companies, setCompanies] = useState<any[]>([])
  const [depots, setDepots] = useState<any[]>([])
  const [showVehicleForm, setShowVehicleForm] = useState(false)

  useEffect(() => {
    loadReferenceData()
  }, [])

  const loadReferenceData = async () => {
    const { data: companiesData } = await supabase.from('companies').select('*')
    const { data: depotsData } = await supabase.from('depots').select('*')
    setCompanies(companiesData || [])
    setDepots(depotsData || [])
  }

  const addVehicle = () => {
    const newVehicle = {
      id: Date.now(),
      registration: '',
      vehicleConfig: '',
      tires: Array(6).fill(null).map((_, i) => ({
        position: i,
        brand: '',
        pattern: '',
        treadDepth: '',
        condition: 'good',
        pressure: '',
        notes: ''
      }))
    }
    setFormData({ ...formData, vehicles: [...formData.vehicles, newVehicle] })
  }

  const updateVehicle = (index: number, field: string, value: any) => {
    const updatedVehicles = [...formData.vehicles]
    updatedVehicles[index] = { ...updatedVehicles[index], [field]: value }
    setFormData({ ...formData, vehicles: updatedVehicles })
  }

  const updateTire = (vehicleIndex: number, tireIndex: number, field: string, value: any) => {
    const updatedVehicles = [...formData.vehicles]
    updatedVehicles[vehicleIndex].tires[tireIndex] = {
      ...updatedVehicles[vehicleIndex].tires[tireIndex],
      [field]: value
    }
    setFormData({ ...formData, vehicles: updatedVehicles })
  }

  const applyBluetoothReading = (vehicleIndex: number, tireIndex: number) => {
    if (currentReading) {
      updateTire(vehicleIndex, tireIndex, 'pressure', currentReading.pressure?.toString() || '')
      updateTire(vehicleIndex, tireIndex, 'treadDepth', currentReading.treadDepth?.toString() || '')
    }
  }

  const removeVehicle = (index: number) => {
    const updatedVehicles = formData.vehicles.filter((_, i) => i !== index)
    setFormData({ ...formData, vehicles: updatedVehicles })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const inspectionData = {
      user_id: user?.id,
      user_name: user?.email,
      inspection_date: formData.inspection_date,
      location: formData.location,
      company_id: formData.company_id || null,
      depot_id: formData.depot_id || null,
      header: {
        company_id: formData.company_id,
        depot_id: formData.depot_id,
      },
      vehicles: formData.vehicles,
    }

    if (isOnline) {
      const { error } = await supabase.from('inspections').insert(inspectionData)

      if (error) {
        console.error('Error creating inspection:', error)
        alert('Failed to create inspection')
      } else {
        onSuccess()
        onCancel()
      }
    } else {
      // Save to sync queue when offline
      saveToSyncQueue('inspection', inspectionData)
      addToSyncQueue({ type: 'inspection', data: inspectionData })
      alert('Inspection saved locally. Will sync when connection is restored.')
      onSuccess()
      onCancel()
    }

    setLoading(false)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Inspection</h1>
          <p className="mt-2 text-gray-600">Create a new tire inspection</p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Inspection Date</label>
              <input
                type="date"
                value={formData.inspection_date}
                onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter inspection location"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company</label>
              <select
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Depot</label>
              <select
                value={formData.depot_id}
                onChange={(e) => setFormData({ ...formData, depot_id: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Depot</option>
                {depots.map((depot) => (
                  <option key={depot.id} value={depot.id}>{depot.location}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Vehicles</h3>
              <button
                type="button"
                onClick={addVehicle}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Vehicle
              </button>
            </div>

            {formData.vehicles.length === 0 ? (
              <p className="text-sm text-gray-500">No vehicles added yet. Click "Add Vehicle" to start.</p>
            ) : (
              <div className="space-y-6">
                {formData.vehicles.map((vehicle, vIndex) => (
                  <div key={vehicle.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium text-gray-900">Vehicle {vIndex + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeVehicle(vIndex)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Registration</label>
                        <input
                          type="text"
                          value={vehicle.registration}
                          onChange={(e) => updateVehicle(vIndex, 'registration', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Vehicle registration"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Configuration</label>
                        <input
                          type="text"
                          value={vehicle.vehicleConfig}
                          onChange={(e) => updateVehicle(vIndex, 'vehicleConfig', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Vehicle configuration"
                        />
                      </div>
                    </div>

                    <h5 className="text-sm font-medium text-gray-700 mb-3">Tires</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {vehicle.tires.map((tire: any, tIndex: number) => (
                        <div key={tIndex} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-xs font-medium text-gray-500">Position {tIndex + 1}</div>
                            {currentReading && (
                              <button
                                type="button"
                                onClick={() => applyBluetoothReading(vIndex, tIndex)}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                              >
                                Use Sensor
                              </button>
                            )}
                          </div>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Brand"
                              value={tire.brand}
                              onChange={(e) => updateTire(vIndex, tIndex, 'brand', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                            <input
                              type="text"
                              placeholder="Pattern"
                              value={tire.pattern}
                              onChange={(e) => updateTire(vIndex, tIndex, 'pattern', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                            <input
                              type="number"
                              step="0.1"
                              placeholder="Tread Depth"
                              value={tire.treadDepth}
                              onChange={(e) => updateTire(vIndex, tIndex, 'treadDepth', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                            <select
                              value={tire.condition}
                              onChange={(e) => updateTire(vIndex, tIndex, 'condition', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              <option value="good">Good</option>
                              <option value="fair">Fair</option>
                              <option value="poor">Poor</option>
                              <option value="replace">Replace</option>
                            </select>
                            <input
                              type="number"
                              placeholder="Pressure (psi)"
                              value={tire.pressure}
                              onChange={(e) => updateTire(vIndex, tIndex, 'pressure', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                            <textarea
                              placeholder="Notes"
                              value={tire.notes}
                              onChange={(e) => updateTire(vIndex, tIndex, 'notes', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            {loading ? 'Saving...' : 'Save Inspection'}
          </button>
        </div>
      </form>
    </div>
  )
}
