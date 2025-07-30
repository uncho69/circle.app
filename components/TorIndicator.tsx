import React from 'react'
import { Shield, AlertTriangle, Loader2 } from 'lucide-react'

interface TorIndicatorProps {
  isConnected?: boolean
  isLoading?: boolean
}

export const TorIndicator: React.FC<TorIndicatorProps> = ({ 
  isConnected = false, 
  isLoading = false 
}) => {
  return (
    <div className="flex items-center space-x-2">
      {isLoading ? (
        <div className="flex items-center space-x-1 text-yellow-400">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-xs font-medium">TOR</span>
        </div>
      ) : isConnected ? (
        <div className="flex items-center space-x-1 text-green-400">
          <Shield size={16} />
          <span className="text-xs font-medium">TOR</span>
        </div>
      ) : (
        <div className="flex items-center space-x-1 text-red-400">
          <AlertTriangle size={16} />
          <span className="text-xs font-medium">TOR</span>
        </div>
      )}
    </div>
  )
} 
 
 
 
 