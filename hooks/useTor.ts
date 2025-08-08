import { useState, useEffect, useCallback } from 'react'

interface TorStatus {
  connected: boolean
  circuit: {
    currentCircuit: string[]
    nodeCount: number
    socksPort: number
  } | null
  latency: number
  error: string | null
}

interface TorTestResult {
  success: boolean
  torIP?: string
  realIP?: string
  status: TorStatus
  message?: string
  error?: string
}

// Global Tor state (shared across components)
let globalTorState: TorStatus = {
    connected: false,
    circuit: null,
    latency: 0,
    error: null
}

let globalTorListeners: ((status: TorStatus) => void)[] = []

const updateGlobalTorState = (newState: Partial<TorStatus>) => {
  globalTorState = { ...globalTorState, ...newState }
  globalTorListeners.forEach(listener => listener(globalTorState))
}

export const useTor = () => {
  const [status, setStatus] = useState<TorStatus>(globalTorState)
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<TorTestResult | null>(null)

  // Subscribe to global state changes
  useEffect(() => {
    const listener = (newStatus: TorStatus) => {
      setStatus(newStatus)
    }
    globalTorListeners.push(listener)
    return () => {
      globalTorListeners = globalTorListeners.filter(l => l !== listener)
    }
  }, [])

  // Connect to Tor
  const connect = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tor/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (result.success) {
        const newStatus = {
          connected: true,
          circuit: result.circuit,
          latency: result.latency || 0,
          error: null
        }
        updateGlobalTorState(newStatus)
        console.log('✅ Tor connected successfully')
      } else {
        const newStatus = {
          connected: false,
          circuit: null,
          latency: 0,
          error: result.error || 'Failed to connect to Tor'
        }
        updateGlobalTorState(newStatus)
        console.log('❌ Tor connection failed:', result.error)
      }
    } catch (error) {
      console.error('Tor connection error:', error)
      const newStatus = {
        connected: false,
        circuit: null,
        latency: 0,
        error: 'Connection failed'
      }
      updateGlobalTorState(newStatus)
    } finally {
      setLoading(false)
    }
  }, [])

  // Test Tor connection
  const testTorConnection = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tor/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
        ,
        body: JSON.stringify({ action: 'test_connection' })
      })

      const result = await response.json()
      setTestResult({
        success: !!result.success,
        torIP: result.torIP,
        realIP: result.realIP,
        status: result.status,
        message: result.message,
        error: result.error
      })
      
      if (result.success) {
        updateGlobalTorState({
          connected: true,
          error: null
        })
        console.log('✅ Tor test successful')
      } else {
        updateGlobalTorState({ connected: false, error: result.error || 'Test failed' })
        console.log('❌ Tor test failed:', result.error)
      }
    } catch (error) {
      console.error('Tor test error:', error)
      setTestResult({
        success: false,
        status: {
          connected: false,
          circuit: null,
          latency: 0,
          error: 'Test failed'
        },
        error: 'Test failed'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Create new circuit
  const createNewCircuit = useCallback(async () => {
    if (!status.connected) return

    setLoading(true)
    try {
      const response = await fetch('/api/tor/circuit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (result.success) {
        updateGlobalTorState({
          circuit: result.circuit,
          latency: result.latency || status.latency
        })
        console.log('🔄 New Tor circuit created')
      }
    } catch (error) {
      console.error('Circuit creation error:', error)
    } finally {
      setLoading(false)
    }
  }, [status.connected, status.latency])

  // Make Tor request
  const torRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!status.connected) {
      throw new Error('Tor not connected')
    }

    try {
      const response = await fetch('/api/tor/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'proxy_request',
          url,
          options
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Tor request failed')
      }

      return result
    } catch (error) {
      console.error('Tor request error:', error)
      throw error
    }
  }, [status.connected])

  // Disconnect from Tor
  const disconnect = useCallback(() => {
    const newStatus = {
      connected: false,
      circuit: null,
      latency: 0,
      error: null
    }
    updateGlobalTorState(newStatus)
    console.log('🔌 Tor disconnected')
  }, [])

  // Get circuit info
  const getCircuitInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/tor/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'circuit_info'
        })
      })

      const result = await response.json()
      return result.success ? result.circuit : null
    } catch (error) {
      console.error('Failed to get circuit info:', error)
      return null
    }
  }, [])

  return {
    status,
    loading,
    testResult,
    connect,
    disconnect,
    testTorConnection,
    createNewCircuit,
    torRequest,
    getCircuitInfo,
    
    // Computed values
    isConnected: status.connected,
    hasError: !!status.error,
    circuitNodes: status.circuit?.currentCircuit || [],
    nodeCount: status.circuit?.nodeCount || 0
  }
} 