export interface BluetoothDevice {
  id: string
  name: string
  connected: boolean
}

export interface SensorReading {
  deviceId: string
  timestamp: string
  pressure?: number
  temperature?: number
  treadDepth?: number
}

// Minimal Web Bluetooth typings — lib.dom doesn't ship them and
// @types/web-bluetooth isn't installed.
interface WebBluetoothCharacteristic extends EventTarget {
  startNotifications(): Promise<WebBluetoothCharacteristic>
  readValue(): Promise<DataView>
}

interface WebBluetoothService {
  getCharacteristic(name: string): Promise<WebBluetoothCharacteristic>
}

interface WebBluetoothGattServer {
  getPrimaryService(name: string): Promise<WebBluetoothService>
}

interface WebBluetoothDevice {
  id: string
  name?: string
  gatt: {
    connect(): Promise<WebBluetoothGattServer>
  }
}

interface WebBluetoothNavigator extends Navigator {
  bluetooth: {
    requestDevice(options: {
      acceptAllDevices?: boolean
      filters?: { name?: string }[]
      optionalServices?: string[]
    }): Promise<WebBluetoothDevice>
  }
}

class BluetoothService {
  private device: BluetoothDevice | null = null
  private characteristic: WebBluetoothCharacteristic | null = null
  private listeners: ((reading: SensorReading) => void)[] = []

  async isSupported(): Promise<boolean> {
    return Promise.resolve('bluetooth' in navigator)
  }

  async scanDevices(): Promise<BluetoothDevice[]> {
    if (!this.isSupported()) {
      throw new Error('Bluetooth not supported')
    }

    try {
      const device = await (navigator as WebBluetoothNavigator).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'heart_rate']
      })

      return [{
        id: device.id,
        name: device.name || 'Unknown Device',
        connected: false
      }]
    } catch {
      throw new Error('Failed to scan devices')
    }
  }

  async connect(deviceId: string): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Bluetooth not supported')
    }

    try {
      const device = await (navigator as WebBluetoothNavigator).bluetooth.requestDevice({
        filters: [{ name: deviceId }],
        optionalServices: ['battery_service', 'heart_rate']
      })

      const server = await device.gatt.connect()
      this.device = {
        id: device.id,
        name: device.name || 'Unknown Device',
        connected: true
      }

      // Try to connect to a service (example: battery service)
      try {
        const service = await server.getPrimaryService('battery_service')
        this.characteristic = await service.getCharacteristic('battery_level')
        
        // Start notifications
        await this.characteristic.startNotifications()
        this.characteristic.addEventListener('characteristicvaluechanged', this.handleCharacteristicValueChanged)
      } catch {
        console.log('Could not connect to standard service, device may use custom protocol')
      }
    } catch {
      throw new Error('Failed to connect to device')
    }
  }

  async disconnect(): Promise<void> {
    if (this.characteristic) {
      this.characteristic.removeEventListener('characteristicvaluechanged', this.handleCharacteristicValueChanged)
      this.characteristic = null
    }

    if (this.device) {
      // The GATT server disconnects automatically when the device disconnects
      this.device = null
    }
  }

  private handleCharacteristicValueChanged = (event: Event) => {
    const value = (event.target as EventTarget & { value: DataView }).value
    const reading: SensorReading = {
      deviceId: this.device?.id || '',
      timestamp: new Date().toISOString(),
      pressure: this.parseValue(value, 0),
      temperature: this.parseValue(value, 1),
      treadDepth: this.parseValue(value, 2)
    }

    this.listeners.forEach(listener => listener(reading))
  }

  private parseValue(dataView: DataView, index: number): number {
    if (index < dataView.byteLength) {
      return dataView.getUint8(index)
    }
    return 0
  }

  onReading(callback: (reading: SensorReading) => void): () => void {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  getConnectedDevice(): BluetoothDevice | null {
    return this.device
  }

  async readSensorData(): Promise<SensorReading> {
    if (!this.characteristic) {
      throw new Error('No characteristic connected')
    }

    const value = await this.characteristic.readValue()
    return {
      deviceId: this.device?.id || '',
      timestamp: new Date().toISOString(),
      pressure: this.parseValue(value, 0),
      temperature: this.parseValue(value, 1),
      treadDepth: this.parseValue(value, 2)
    }
  }
}

export const bluetoothService = new BluetoothService()
