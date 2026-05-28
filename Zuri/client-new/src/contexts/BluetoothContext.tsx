'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { bluetoothService, BluetoothDevice, SensorReading } from '@/lib/bluetooth'

interface BluetoothContextType {
  isSupported: boolean
  connectedDevice: BluetoothDevice | null
  isScanning: boolean
  scanDevices: () => Promise<void>
  connect: (deviceId: string) => Promise<void>
  disconnect: () => Promise<void>
  currentReading: SensorReading | null
  readingHistory: SensorReading[]
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined)

export function BluetoothProvider({ children }: { children: React.ReactNode }) {
  const [isSupported, setIsSupported] = useState(false)
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [currentReading, setCurrentReading] = useState<SensorReading | null>(null)
  const [readingHistory, setReadingHistory] = useState<SensorReading[]>([])

  useEffect(() => {
    bluetoothService.isSupported().then(setIsSupported)
  }, [])

  useEffect(() => {
    const unsubscribe = bluetoothService.onReading((reading) => {
      setCurrentReading(reading)
      setReadingHistory(prev => [...prev.slice(-9), reading]) // Keep last 10 readings
    })

    return () => unsubscribe()
  }, [])

  const scanDevices = async () => {
    setIsScanning(true)
    try {
      await bluetoothService.scanDevices()
    } catch (error) {
      console.error('Scan failed:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const connect = async (deviceId: string) => {
    try {
      await bluetoothService.connect(deviceId)
      setConnectedDevice(bluetoothService.getConnectedDevice())
    } catch (error) {
      console.error('Connection failed:', error)
      throw error
    }
  }

  const disconnect = async () => {
    try {
      await bluetoothService.disconnect()
      setConnectedDevice(null)
      setCurrentReading(null)
    } catch (error) {
      console.error('Disconnect failed:', error)
    }
  }

  return (
    <BluetoothContext.Provider value={{
      isSupported,
      connectedDevice,
      isScanning,
      scanDevices,
      connect,
      disconnect,
      currentReading,
      readingHistory
    }}>
      {children}
    </BluetoothContext.Provider>
  )
}

export function useBluetooth() {
  const context = useContext(BluetoothContext)
  if (context === undefined) {
    throw new Error('useBluetooth must be used within a BluetoothProvider')
  }
  return context
}
