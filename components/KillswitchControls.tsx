import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  AlertTriangle, 
  Shield, 
  Zap, 
  Trash2, 
  LogOut, 
  Power,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'
import { emergency } from '../utils/killswitch'

export interface KillswitchControlsProps {
  className?: string
}

export const KillswitchControls: React.FC<KillswitchControlsProps> = ({ 
  className = '' 
}) => {
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleArm = async () => {
    setLoading(true)
    try {
      await emergency.exit()
      console.log('🛡️ Killswitch armed - data protected')
    } catch (error) {
      console.error('Failed to arm killswitch:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDisarm = async () => {
    setLoading(true)
    try {
      await emergency.logout()
      console.log('🔓 Killswitch disarmed - normal operation restored')
    } catch (error) {
      console.error('Failed to disarm killswitch:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKillswitch = async (level: 'soft' | 'hard' | 'nuclear') => {
    setLoading(true)
    try {
      if (level === 'nuclear') {
        await emergency.nuke()
        console.log('☢️ Nuclear killswitch activated - complete data destruction')
      } else if (level === 'hard') {
        await emergency.logout()
        console.log('💥 Hard killswitch activated - account deletion')
      } else {
        await emergency.exit()
        console.log('🛡️ Soft killswitch activated - data protection')
      }
    } catch (error) {
      console.error('Failed to activate killswitch:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`bg-dark-800 border border-dark-700 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="text-red-400" size={20} />
          <span className="text-white font-medium text-sm">Emergency Controls</span>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="p-1 text-dark-400 hover:text-white transition-colors"
        >
          {showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <div className="space-y-3">
        {/* Soft Killswitch */}
        <button
          onClick={() => handleKillswitch('soft')}
          disabled={loading}
          className="w-full flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-all disabled:opacity-50"
        >
          <div className="flex items-center space-x-2">
            <Shield size={16} />
            <span className="text-sm font-medium">Protect Data</span>
          </div>
          <span className="text-xs">Soft</span>
        </button>

        {/* Hard Killswitch */}
        <button
          onClick={() => handleKillswitch('hard')}
          disabled={loading}
          className="w-full flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/20 transition-all disabled:opacity-50"
        >
          <div className="flex items-center space-x-2">
            <LogOut size={16} />
            <span className="text-sm font-medium">Delete Account</span>
          </div>
          <span className="text-xs">Hard</span>
        </button>

        {/* Nuclear Killswitch */}
        <button
          onClick={() => handleKillswitch('nuclear')}
          disabled={loading}
          className="w-full flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50"
        >
          <div className="flex items-center space-x-2">
            <Trash2 size={16} />
            <span className="text-sm font-medium">Nuclear Option</span>
          </div>
          <span className="text-xs">Nuclear</span>
        </button>
      </div>

      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-dark-700"
        >
          <div className="text-xs text-dark-400 space-y-2">
            <div className="flex items-center space-x-2">
              <Shield size={12} />
              <span><strong>Soft:</strong> Encrypt and protect all data</span>
            </div>
            <div className="flex items-center space-x-2">
              <LogOut size={12} />
              <span><strong>Hard:</strong> Delete account and all data</span>
            </div>
            <div className="flex items-center space-x-2">
              <Trash2 size={12} />
              <span><strong>Nuclear:</strong> Complete data destruction</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
