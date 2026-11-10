'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type ImportType = 'companies' | 'tyres' | 'depots' | 'vehicle-configs'

export default function DataImportPage() {
  const [selectedType, setSelectedType] = useState<ImportType>('companies')
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResults(null)
    }
  }

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

  const importData = async () => {
    if (!file) return

    setImporting(true)
    setResults(null)

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
          }
          success++
        } catch (error) {
          failed++
          errors.push(`Row ${success + failed}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      setResults({ success, failed, errors })
    } catch (error) {
      setResults({ success: 0, failed: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] })
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
        template = 'name,description,tire_positions,tire_requirements\nStandard Config,Standard vehicle configuration,"[{""position"":1,""size"":""205/55R16""}]","[{""min_tread"":3}]'
        filename = 'vehicle-configs_template.csv'
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Data Import</h1>
        <p className="mt-2 text-gray-600">Bulk import companies, tyres, depots, and vehicle configurations</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Data Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as ImportType)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="companies">Companies</option>
            <option value="tyres">Tyres</option>
            <option value="depots">Depots</option>
            <option value="vehicle-configs">Vehicle Configurations</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload File (CSV or JSON)</label>
          <input
            type="file"
            accept=".csv,.json"
            onChange={handleFileChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md"
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

        {results && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Import Results</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded">
                <div className="text-green-800 font-medium">Successful</div>
                <div className="text-2xl font-bold text-green-900">{results.success}</div>
              </div>
              <div className="bg-red-50 p-4 rounded">
                <div className="text-red-800 font-medium">Failed</div>
                <div className="text-2xl font-bold text-red-900">{results.failed}</div>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="bg-red-50 p-4 rounded">
                <h4 className="font-medium text-red-800 mb-2">Errors</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {results.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
