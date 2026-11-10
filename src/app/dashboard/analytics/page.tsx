'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface InspectionTireRow {
  condition?: string
  treadDepth?: string | number
}

interface InspectionVehicleRow {
  tires?: InspectionTireRow[]
}

interface InspectionAnalyticsRow {
  created_at: string
  vehicles?: InspectionVehicleRow[]
}

interface ScrapAnalyticsRow {
  created_at: string
  status?: string
  items?: unknown[]
}

interface TrendPoint {
  date: string
  inspections?: number
  scraps?: number
  vehicles?: number
  items?: number
}

interface TireHealthPoint {
  name: string
  value: number
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [inspectionData, setInspectionData] = useState<TrendPoint[]>([])
  const [scrapData, setScrapData] = useState<TrendPoint[]>([])
  const [tireHealthData, setTireHealthData] = useState<TireHealthPoint[]>([])

  const loadAnalyticsData = async () => {
    setLoading(true)

    // Get inspection data for trends
    const { data: inspections } = await supabase
      .from('inspections')
      .select('created_at, vehicles')
      .order('created_at', { ascending: true })
      .limit(30)

    // Get scrap data
    const { data: scraps } = await supabase
      .from('scraps')
      .select('created_at, status, items')
      .order('created_at', { ascending: true })
      .limit(30)

    const inspectionRows = (inspections || []) as InspectionAnalyticsRow[]
    const scrapRows = (scraps || []) as ScrapAnalyticsRow[]

    // Calculate tire health from inspections
    const tireHealth = inspectionRows.flatMap((insp) =>
      insp.vehicles?.flatMap((v) =>
        v.tires?.map((t) => ({
          condition: t.condition,
          treadDepth: parseFloat(String(t.treadDepth)) || 0
        }))
      ) || []
    )

    // Process inspection trend data
    const inspectionTrend = inspectionRows.map((insp) => ({
      date: new Date(insp.created_at).toLocaleDateString(),
      inspections: 1,
      vehicles: insp.vehicles?.length || 0
    }))

    // Process scrap trend data
    const scrapTrend = scrapRows.map((scrap) => ({
      date: new Date(scrap.created_at).toLocaleDateString(),
      scraps: 1,
      items: scrap.items?.length || 0
    }))

    // Process tire health distribution
    const conditionCounts = tireHealth.reduce<Record<string, number>>((acc, t) => {
      const key = String(t!.condition)
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const tireHealthDistribution = Object.entries(conditionCounts).map(([condition, count]) => ({
      name: condition,
      value: count as number
    }))

    setInspectionData(inspectionTrend)
    setScrapData(scrapTrend)
    setTireHealthData(tireHealthDistribution)
    setLoading(false)
  }

  useEffect(() => {
    // Mount-only data load; defer so the loader's synchronous
    // setLoading(true) runs after the effect, not inside it.
    queueMicrotask(() => {
      void loadAnalyticsData()
    })
  }, [])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-2 text-gray-600">Fleet health and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Inspection Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspection Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={inspectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="inspections" stroke="#8884d8" name="Inspections" />
              <Line type="monotone" dataKey="vehicles" stroke="#82ca9d" name="Vehicles" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Scrap Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scrap Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scrapData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="scraps" fill="#8884d8" name="Scraps" />
              <Bar dataKey="items" fill="#82ca9d" name="Items" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tire Health Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tire Condition Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tireHealthData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {tireHealthData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Fleet Health Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Health Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span className="text-green-800 font-medium">Good Condition</span>
              <span className="text-green-800 font-bold">
                {tireHealthData.find((t) => t.name === 'good')?.value || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
              <span className="text-yellow-800 font-medium">Fair Condition</span>
              <span className="text-yellow-800 font-bold">
                {tireHealthData.find((t) => t.name === 'fair')?.value || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
              <span className="text-orange-800 font-medium">Poor Condition</span>
              <span className="text-orange-800 font-bold">
                {tireHealthData.find((t) => t.name === 'poor')?.value || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded">
              <span className="text-red-800 font-medium">Needs Replacement</span>
              <span className="text-red-800 font-bold">
                {tireHealthData.find((t) => t.name === 'replace')?.value || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => exportAnalyticsData()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Export Analytics Data
        </button>
      </div>
    </div>
  )
}

function exportAnalyticsData() {
  const data = {
    inspectionData: [],
    scrapData: [],
    tireHealthData: [],
    exportedAt: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
