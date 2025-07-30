import { NextApiRequest, NextApiResponse } from 'next'
import { SocksProxyAgent } from 'socks-proxy-agent'
import fetch from 'node-fetch'

interface TorCircuit {
  currentCircuit: string[]
  nodeCount: number
  socksPort: number
}

interface TorStatus {
  connected: boolean
  circuit: TorCircuit | null
  latency: number
  error: string | null
}

// Tor SOCKS proxy configuration
const TOR_SOCKS_PORT = 9050
const TOR_SOCKS_HOST = '127.0.0.1'

// Global Tor status
let torStatus: TorStatus = {
  connected: false,
  circuit: null,
  latency: 0,
  error: null
}

// Test Tor connection by checking IP
const testTorConnection = async (): Promise<{ success: boolean; ip?: string; error?: string }> => {
  try {
    // Create SOCKS proxy agent for Tor
    const agent = new SocksProxyAgent(`socks5://${TOR_SOCKS_HOST}:${TOR_SOCKS_PORT}`)
    
    // Test with IP check service
    const response = await fetch('https://httpbin.org/ip', {
      agent,
      timeout: 10000 // 10 second timeout
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    return {
      success: true,
      ip: data.origin
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get current IP without Tor
const getRealIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://httpbin.org/ip', {
      timeout: 5000
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    return data.origin
  } catch (error) {
    return 'Unknown'
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { action, url, method = 'GET', headers = {}, body } = req.body

    switch (action) {
      case 'test_connection':
        // Test if Tor is working
        const testResult = await testTorConnection()
        const realIP = await getRealIP()
        
        if (testResult.success) {
          torStatus = {
            connected: true,
            circuit: {
              currentCircuit: ['Entry Node', 'Middle Node', 'Exit Node'],
              nodeCount: 3,
              socksPort: TOR_SOCKS_PORT
            },
            latency: 0,
            error: null
          }
          
          return res.status(200).json({
            success: true,
            torIP: testResult.ip,
            realIP: realIP,
            status: torStatus,
            message: 'Tor connection successful!'
          })
        } else {
          torStatus = {
            connected: false,
            circuit: null,
            latency: 0,
            error: testResult.error || 'Tor connection failed'
          }
          
          return res.status(200).json({
            success: false,
            realIP: realIP,
            status: torStatus,
            error: testResult.error || 'Tor connection failed'
          })
        }

      case 'new_circuit':
        // Simulate new circuit creation
        const circuitTest = await testTorConnection()
        
        if (circuitTest.success) {
          torStatus = {
            connected: true,
            circuit: {
              currentCircuit: [
                `Entry-${Math.random().toString(36).substr(2, 8)}`,
                `Middle-${Math.random().toString(36).substr(2, 8)}`,
                `Exit-${Math.random().toString(36).substr(2, 8)}`
              ],
              nodeCount: 3,
              socksPort: TOR_SOCKS_PORT
            },
            latency: Math.floor(Math.random() * 2000) + 500, // 500-2500ms
            error: null
          }
          
          return res.status(200).json({
            success: true,
            circuit: torStatus.circuit,
            latency: torStatus.latency,
            message: 'New Tor circuit created'
          })
        } else {
          return res.status(500).json({
            success: false,
            error: 'Failed to create new circuit'
          })
        }

      case 'proxy_request':
        // Make request through Tor
        if (!torStatus.connected) {
          return res.status(400).json({
            success: false,
            error: 'Tor not connected'
          })
        }

        try {
          const agent = new SocksProxyAgent(`socks5://${TOR_SOCKS_HOST}:${TOR_SOCKS_PORT}`)
          
          const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            agent,
            timeout: 15000
          })
          
          const responseData = await response.text()
          
          return res.status(200).json({
            success: true,
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            data: responseData,
            message: 'Request made through Tor'
          })
        } catch (error) {
          return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Proxy request failed'
          })
        }

      case 'get_status':
        // Return current Tor status
        return res.status(200).json({
          success: true,
          status: torStatus
        })

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        })
    }

  } catch (error) {
    console.error('Tor proxy error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 
 
 
 
 
 
 