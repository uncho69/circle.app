import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, RefreshCw, AlertTriangle, CheckCircle, Globe, Eye, EyeOff } from 'lucide-react'
import { useTor } from '../hooks/useTor'

export interface TorStatusProps {
  className?: string
}

export const TorStatus: React.FC<TorStatusProps> = ({ className = '' }) => {
  const { status, testResult, loading, testTorConnection, createNewCircuit } = useTor()
  const [showDetails, setShowDetails] = useState(true)

  // Esegui automaticamente il test quando connesso ma senza risultato
  useEffect(() => {
    if (status.connected && !testResult && !loading) {
      testTorConnection()
    }
  }, [status.connected])

  return (
    <div className={`bg-dark-800 border border-dark-700 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Shield className="text-crypto-blue" size={20} />
          <span className="text-white font-medium text-sm">Tor Network</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              const next = !showDetails
              setShowDetails(next)
              if (next && !testResult && !loading) testTorConnection()
            }}
            className="p-1 text-dark-400 hover:text-white transition-colors"
          >
            {showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          
          <button
            onClick={testTorConnection}
            disabled={loading}
            className="p-1 text-dark-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {status.connected ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2 text-green-400">
            <CheckCircle size={16} />
            <span className="text-sm font-medium">Connected</span>
          </div>

          {/* Compact IP info always visible when testResult available */}
          {testResult && (
            <div className="text-[11px] text-dark-400 flex items-center space-x-3 mt-1">
              <span>Real IP: <span className="text-gray-300 font-mono">{testResult.realIP || 'Unknown'}</span></span>
              <span>Tor IP: <span className="text-gray-300 font-mono">{testResult.torIP || '—'}</span></span>
            </div>
          )}
          
          {showDetails && testResult && (
            <div className="text-xs text-dark-400 space-y-1 p-2 bg-dark-900/50 rounded-lg">
              <div><strong>Real IP:</strong> {testResult.realIP}</div>
              <div><strong>Tor IP:</strong> {testResult.torIP}</div>
              {status.circuit && (
                <>
                  <div><strong>Circuit:</strong> {status.circuit.nodeCount} nodes</div>
                  <div><strong>Latency:</strong> {status.latency}ms</div>
                  <div><strong>Port:</strong> {status.circuit.socksPort}</div>
                </>
              )}
            </div>
          )}
          
          <button
            onClick={createNewCircuit}
            disabled={loading}
            className="w-full mt-2 px-3 py-1.5 bg-crypto-blue/10 text-crypto-blue text-xs rounded-lg hover:bg-crypto-blue/20 transition-colors disabled:opacity-50"
          >
            New Circuit
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2 text-red-400">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">Connection failed</span>
          </div>
          
          {showDetails && testResult && (
            <div className="text-xs text-dark-400 space-y-1 p-2 bg-dark-900/50 rounded-lg">
              <div><strong>Real IP:</strong> {testResult.realIP}</div>
              <div><strong>Error:</strong> {status.error}</div>
            </div>
          )}
          
          <button
            onClick={testTorConnection}
            disabled={loading}
            className="w-full mt-2 px-3 py-1.5 bg-red-500/10 text-red-400 text-xs rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
        </motion.div>
      )}
    </div>
  )
} 