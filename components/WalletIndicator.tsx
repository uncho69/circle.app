import React, { useState, useRef, useEffect } from 'react'
import { Wallet, ChevronDown, LogOut } from 'lucide-react'
import { useUniversalWallet } from '../hooks/useUniversalWallet'
import { useRouter } from 'next/router'

export const WalletIndicator: React.FC = () => {
  const { isConnected, account, walletName, disconnect } = useUniversalWallet()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isConnected || !account) {
    return null
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  const handleDisconnect = () => {
    disconnect()
    setIsDropdownOpen(false)
    // Redirect to landing page for reconnection
    router.push('/')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 hover:bg-dark-700 transition-colors"
      >
        <Wallet className="text-crypto-blue" size={16} />
        <div className="flex items-center space-x-1">
          <span className="text-white text-sm font-medium">{walletName}</span>
          <span className="text-dark-400 text-sm">•</span>
          <span className="text-white text-sm font-mono">{formatAddress(account)}</span>
        </div>
        <ChevronDown 
          className={`text-dark-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
          size={14} 
        />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute top-full right-0 mt-2 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-50 min-w-[160px]">
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-dark-700 transition-colors rounded-lg"
          >
            <LogOut className="text-red-400" size={16} />
            <span className="text-white text-sm">Disconnect</span>
          </button>
        </div>
      )}
    </div>
  )
} 