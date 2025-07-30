import React from 'react'
import { Wallet, ChevronDown } from 'lucide-react'
import { useUniversalWallet } from '../hooks/useUniversalWallet'

export const WalletIndicator: React.FC = () => {
  const { isConnected, account, walletName } = useUniversalWallet()

  if (!isConnected || !account) {
    return null
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <div className="flex items-center space-x-2 bg-dark-800 border border-dark-700 rounded-lg px-3 py-2">
      <Wallet className="text-crypto-blue" size={16} />
      <div className="flex items-center space-x-1">
        <span className="text-white text-sm font-medium">{walletName}</span>
        <span className="text-dark-400 text-sm">•</span>
        <span className="text-white text-sm font-mono">{formatAddress(account)}</span>
      </div>
      <ChevronDown className="text-dark-400" size={14} />
    </div>
  )
} 