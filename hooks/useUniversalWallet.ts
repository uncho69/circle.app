import { useState, useEffect } from 'react'



// Universal wallet interface
interface UniversalWallet {
  name: string
  isAvailable: () => boolean
  connect: () => Promise<string>
  getBalance: (address: string) => Promise<number>
  getAccount: () => Promise<string | null>
  onAccountsChanged: (callback: (accounts: string[]) => void) => void
  onChainChanged: (callback: () => void) => void
  removeListeners: () => void
}

// MetaMask implementation
const metaMaskWallet: UniversalWallet = {
  name: 'MetaMask',
  isAvailable: () => typeof window !== 'undefined' && !!window.ethereum?.isMetaMask,
  connect: async () => {
    if (!window.ethereum) throw new Error('No Ethereum wallet available')
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    return accounts[0]
  },
  getBalance: async (address: string) => {
    if (!window.ethereum) throw new Error('No Ethereum wallet available')
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    })
    return parseInt(balance, 16) / Math.pow(10, 18)
  },
  getAccount: async () => {
    if (!window.ethereum) return null
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    return accounts[0] || null
  },
  onAccountsChanged: (callback) => {
    if (window.ethereum && (window.ethereum as any).on) {
      (window.ethereum as any).on('accountsChanged', callback)
    }
  },
  onChainChanged: (callback) => {
    if (window.ethereum && (window.ethereum as any).on) {
      (window.ethereum as any).on('chainChanged', callback)
    }
  },
  removeListeners: () => {
    try {
      if (window.ethereum && typeof (window.ethereum as any).removeListener === 'function') {
        (window.ethereum as any).removeListener('accountsChanged', () => {})
        (window.ethereum as any).removeListener('chainChanged', () => {})
      }
    } catch (error) {
      console.warn('Failed to remove listeners:', error)
    }
  }
}

// Rabby implementation
const rabbyWallet: UniversalWallet = {
  name: 'Rabby',
  isAvailable: () => typeof window !== 'undefined' && !!window.ethereum && (window.ethereum as any).isRabby,
  connect: async () => {
    if (!window.ethereum) throw new Error('Rabby not available')
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    return accounts[0]
  },
  getBalance: async (address: string) => {
    if (!window.ethereum) throw new Error('Rabby not available')
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    })
    return parseInt(balance, 16) / Math.pow(10, 18)
  },
  getAccount: async () => {
    if (!window.ethereum) return null
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    return accounts[0] || null
  },
  onAccountsChanged: (callback) => {
    if (window.ethereum && (window.ethereum as any).on) {
      (window.ethereum as any).on('accountsChanged', callback)
    }
  },
  onChainChanged: (callback) => {
    if (window.ethereum && (window.ethereum as any).on) {
      (window.ethereum as any).on('chainChanged', callback)
    }
  },
  removeListeners: () => {
    try {
      if (window.ethereum && typeof (window.ethereum as any).removeListener === 'function') {
        (window.ethereum as any).removeListener('accountsChanged', () => {})
        (window.ethereum as any).removeListener('chainChanged', () => {})
      }
    } catch (error) {
      console.warn('Failed to remove listeners:', error)
    }
  }
}

// Generic Ethereum wallet (for other wallets)
const genericWallet: UniversalWallet = {
  name: 'Ethereum Wallet',
  isAvailable: () => typeof window !== 'undefined' && !!window.ethereum,
  connect: async () => {
    if (!window.ethereum) throw new Error('No Ethereum wallet available')
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    return accounts[0]
  },
  getBalance: async (address: string) => {
    if (!window.ethereum) throw new Error('No Ethereum wallet available')
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    })
    return parseInt(balance, 16) / Math.pow(10, 18)
  },
  getAccount: async () => {
    if (!window.ethereum) return null
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    return accounts[0] || null
  },
  onAccountsChanged: (callback) => {
    if (window.ethereum && (window.ethereum as any).on) {
      (window.ethereum as any).on('accountsChanged', callback)
    }
  },
  onChainChanged: (callback) => {
    if (window.ethereum && (window.ethereum as any).on) {
      (window.ethereum as any).on('chainChanged', callback)
    }
  },
  removeListeners: () => {
    try {
      if (window.ethereum && typeof (window.ethereum as any).removeListener === 'function') {
        (window.ethereum as any).removeListener('accountsChanged', () => {})
        (window.ethereum as any).removeListener('chainChanged', () => {})
      }
    } catch (error) {
      console.warn('Failed to remove listeners:', error)
    }
  }
}

// Detect available wallet
const detectWallet = (): UniversalWallet => {
  if (metaMaskWallet.isAvailable()) {
    return metaMaskWallet
  }
  if (rabbyWallet.isAvailable()) {
    return rabbyWallet
  }
  if (genericWallet.isAvailable()) {
    return genericWallet
  }
  throw new Error('No Ethereum wallet detected')
}

export const useUniversalWallet = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<number>(0)
  const [walletName, setWalletName] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectWallet = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const wallet = detectWallet()
      setWalletName(wallet.name)
      
      const account = await wallet.connect()
      setAccount(account)
      setIsConnected(true)
      
      const balance = await wallet.getBalance(account)
      setBalance(balance)
      
      console.log(`✅ Connected to ${wallet.name}: ${account}`)
      return account
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet'
      setError(errorMessage)
      console.error('Wallet connection failed:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getBalance = async (address: string) => {
    try {
      const wallet = detectWallet()
      const balance = await wallet.getBalance(address)
      setBalance(balance)
      return balance
    } catch (error) {
      console.error('Failed to get balance:', error)
      return 0
    }
  }

  const disconnect = () => {
    setIsConnected(false)
    setAccount(null)
    setBalance(0)
    setWalletName('')
  }

  // Check for existing connection and listen for changes
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const wallet = detectWallet()
        setWalletName(wallet.name)
        
        const account = await wallet.getAccount()
        if (account) {
          setAccount(account)
          setIsConnected(true)
          const balance = await wallet.getBalance(account)
          setBalance(balance)
          console.log(`✅ Already connected to ${wallet.name}: ${account}`)
        }
      } catch (error) {
        console.log('No wallet detected or not connected')
      }
    }

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        setAccount(accounts[0])
        setIsConnected(true)
        getBalance(accounts[0])
      }
    }

    const handleChainChanged = () => {
      window.location.reload()
    }

    // Check existing connection
    checkConnection()

    // Set up listeners
    try {
      const wallet = detectWallet()
      wallet.onAccountsChanged(handleAccountsChanged)
      wallet.onChainChanged(handleChainChanged)

      return () => {
        wallet.removeListeners()
      }
    } catch (error) {
      // No wallet available
    }
  }, [])

  // Mock functions for circle creation (in production would use real smart contracts)
  const estimateCircleCreation = async () => {
    if (!account) throw new Error('Wallet not connected')
    
    // Updated pricing: $300 for circle creation (≈ 0.15 ETH at current prices)
    const circleCreationCost = 0.15 // ETH
    const gasPrice = 20 // gwei
    const gasLimit = 210000
    
    return {
      amount: circleCreationCost,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      totalCost: circleCreationCost + (gasLimit * gasPrice / Math.pow(10, 9)),
      usdEquivalent: 300 // $300 USD
    }
  }

  const createCircle = async (circleData: {
    name: string
    description: string
    minEthRequired: number
    isPrivate: boolean
  }) => {
    if (!account) throw new Error('Wallet not connected')
    
    // Mock transaction - in production would send real transaction
    const mockHash = '0x' + Math.random().toString(16).substring(2, 66)
    
    console.log('✅ Mock circle creation transaction:', mockHash)
    return mockHash
  }

  return {
    isConnected,
    account,
    balance,
    walletName,
    loading,
    error,
    connectWallet,
    getBalance,
    disconnect,
    estimateCircleCreation,
    createCircle
  }
} 