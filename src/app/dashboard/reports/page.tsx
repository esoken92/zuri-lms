'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// `type` (not `interface`) so the rows get an implicit index signature and
// stay assignable to Record<string, unknown> for exportToCSV.
type InspectionReportRow = {
  id: string
  inspection_date: string
  user_name: string | null
  location: string | null
  vehicles?: unknown[]
}

type ScrapReportRow = {
  id: string
  created_at: string
  user_name: string | null
  items?: unknown[]
  status: string | null
}

export default function ReportsPage() {
  const [inspections, setInspections] = useState<InspectionReportRow[]>([])
  const [scraps, setScraps] = useState<ScrapReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<'inspections' | 'scraps' | null>(null)

  const loadData = async () => {
    setLoading(true)
    const [inspectionsData, scrapsData] = await Promise.all([
      supabase.from('inspections').select('*').order('created_at', { ascending: false }),
      supabase.from('scraps').select('*').order('created_at', { ascending: false })
    ])

    if (inspectionsData.error) console.error('Error loading inspections:', inspectionsData.error)
    else setInspections(inspectionsData.data || [])

    if (scrapsData.error) console.error('Error loading scraps:', scrapsData.error)
    else setScraps(scrapsData.data || [])

    setLoading(false)
  }

  useEffect(() => {
    // Mount-only data load; defer so the loader's synchronous
    // setLoading(true) runs after the effect, not inside it.
    queueMicrotask(() => {
      void loadData()
    })
  }, [])

  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) {
      alert('No data to export')
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header]
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        }
        return `"${String(value || '').replace(/"/g, '""')}"`
      }).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  if (selectedReport) {
    if (selectedReport === 'inspections') {
      return (
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inspections Report</h1>
              <p className="mt-2 text-gray-600">View and export inspection data</p>
            </div>
            <button
              onClick={() => setSelectedReport(null)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
          </div>

          <div className="mb-4">
            <button
              onClick={() => exportToCSV(inspections, 'inspections-report.csv')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Export to CSV
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspector</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicles</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    if (selectedReport === 'scraps') {
      return (
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Scraps Report</h1>
              <p className="mt-2 text-gray-600">View and export scrap data</p>
            </div>
            <button
              onClick={() => setSelectedReport(null)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
          </div>

          <div className="mb-4">
            <button
              onClick={() => exportToCSV(scraps, 'scraps-report.csv')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Export to CSV
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scraps.map((scrap) => (
                  <tr key={scrap.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(scrap.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {scrap.user_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {scrap.items?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        scrap.status === 'approved' ? 'bg-green-100 text-green-800' :
                        scrap.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {scrap.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="mt-2 text-gray-600">View and generate reports</p>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={() => setSelectedReport('inspections')}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900">Inspections Report</h3>
            <p className="text-sm text-gray-600 mt-2">View and export inspection data ({inspections.length} records)</p>
          </div>

          <div
            onClick={() => setSelectedReport('scraps')}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-4">♻️</div>
            <h3 className="text-lg font-semibold text-gray-900">Scraps Report</h3>
            <p className="text-sm text-gray-600 mt-2">View and export scrap data ({scraps.length} records)</p>
          </div>
        </div>
      )}
    </div>
  )
}
