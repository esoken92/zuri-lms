'use client'

import { useBluetooth } from '@/contexts/BluetoothContext'

export default function BluetoothPanel() {
  const { isSupported, connectedDevice, isScanning, scanDevices, disconnect, currentReading } = useBluetooth()

  if (!isSupported) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Bluetooth Sensor</h3>
        <div className={`w-2 h-2 rounded-full ${connectedDevice ? 'bg-green-500' : 'bg-gray-400'}`} />
      </div>

      {connectedDevice ? (
        <div className="space-y-3">
          <div className="text-sm">
            <div className="text-gray-500">Connected to:</div>
            <div className="font-medium">{connectedDevice.name}</div>
          </div>

          {currentReading && (
            <div className="bg-gray-50 rounded p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pressure:</span>
                <span className="font-medium">{currentReading.pressure} PSI</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Temperature:</span>
                <span className="font-medium">{currentReading.temperature}°C</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tread Depth:</span>
                <span className="font-medium">{currentReading.treadDepth} mm</span>
              </div>
            </div>
          )}

          <button
            onClick={disconnect}
            className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Connect to a Bluetooth tire sensor to automatically read pressure, temperature, and tread depth.
          </p>
          <button
            onClick={scanDevices}
            disabled={isScanning}
            className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            {isScanning ? 'Scanning...' : 'Scan for Devices'}
          </button>
        </div>
      )}
    </div>
  )
}
