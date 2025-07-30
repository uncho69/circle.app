import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Coins, 
  DollarSign, 
  Zap,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useUniversalWallet } from '../hooks/useUniversalWallet'

interface SendCryptoModalProps {
  isOpen: boolean
  onClose: () => void
  recipient: {
    address: string
    pseudonym: string
  }
  context?: 'chat' | 'profile' | 'list'
}

interface TokenInfo {
  symbol: string
  name: string
  decimals: number
  contractAddress?: string
  icon: React.ReactNode
}

const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    icon: <Coins className="text-orange-500" size={20} />
  },
  {
    symbol: 'DAI',
    name: 'Dai',
    decimals: 18,
    contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    icon: <DollarSign className="text-yellow-500" size={20} />
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    contractAddress: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8',
    icon: <DollarSign className="text-blue-500" size={20} />
  }
]

export const SendCryptoModal: React.FC<SendCryptoModalProps> = ({
  isOpen,
  onClose,
  recipient,
  context = 'profile'
}) => {
  const [selectedToken, setSelectedToken] = useState<TokenInfo>(SUPPORTED_TOKENS[0])
  const [amount, setAmount] = useState('')
  const [estimatedFee, setEstimatedFee] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isEstimating, setIsEstimating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)

  const { isConnected, account, balance, connectWallet } = useUniversalWallet()

  // Estimate gas fee when amount or token changes
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setEstimatedFee(0)
      return
    }

    const estimateFee = async () => {
      setIsEstimating(true)
      try {
        // Mock fee estimation - in production would call eth_estimateGas
        const baseFee = selectedToken.symbol === 'ETH' ? 0.001 : 0.002
        const amountFee = parseFloat(amount) * 0.01
        setEstimatedFee(baseFee + amountFee)
      } catch (error) {
        console.error('Fee estimation failed:', error)
        setEstimatedFee(0.001) // Fallback
      } finally {
        setIsEstimating(false)
      }
    }

    estimateFee()
  }, [amount, selectedToken])

  const handleSend = async () => {
    if (!isConnected) {
      try {
        await connectWallet()
      } catch (error) {
        setError('Please connect your wallet first')
        return
      }
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Mock transaction - in production would send real transaction
      const mockHash = '0x' + Math.random().toString(16).substring(2, 66)
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setTransactionHash(mockHash)
      setSuccess(true)
      
      console.log('✅ Crypto sent:', {
        amount,
        token: selectedToken.symbol,
        recipient: recipient.address,
        hash: mockHash
      })

      // Close modal after 3 seconds
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setTransactionHash(null)
        setAmount('')
      }, 3000)

    } catch (error) {
      console.error('Send crypto failed:', error)
      setError('Transaction failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-dark-800 border border-dark-700 rounded-2xl p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Send Crypto</h2>
            <button
              onClick={onClose}
              className="p-2 text-dark-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Recipient Info */}
          <div className="bg-dark-900/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">Sending to</p>
                <p className="text-white font-medium">{recipient.pseudonym}</p>
                <p className="text-dark-400 text-xs font-mono">{formatAddress(recipient.address)}</p>
              </div>
              <button
                onClick={() => copyToClipboard(recipient.address)}
                className="p-2 text-dark-400 hover:text-white transition-colors"
                title="Copy address"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          {/* Token Selection */}
          <div className="mb-6">
            <label className="text-dark-400 text-sm mb-2 block">Select Token</label>
            <div className="grid grid-cols-3 gap-2">
              {SUPPORTED_TOKENS.map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => setSelectedToken(token)}
                  className={`p-3 rounded-xl border transition-colors ${
                    selectedToken.symbol === token.symbol
                      ? 'border-crypto-blue bg-crypto-blue/10 text-white'
                      : 'border-dark-600 text-dark-400 hover:border-dark-500'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {token.icon}
                    <span className="font-medium">{token.symbol}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="text-dark-400 text-sm mb-2 block">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-crypto-blue"
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-dark-400 text-sm">{selectedToken.symbol}</span>
              </div>
            </div>
          </div>

          {/* Fee Estimation */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-dark-900/50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="text-yellow-500" size={16} />
                  <span className="text-dark-400 text-sm">Estimated Fee</span>
                </div>
                <div className="text-right">
                  {isEstimating ? (
                    <Loader2 className="text-dark-400 animate-spin" size={16} />
                  ) : (
                    <span className="text-white font-medium">
                      {estimatedFee.toFixed(6)} ETH
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="text-red-400" size={16} />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && transactionHash && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-400" size={16} />
                <div>
                  <p className="text-green-400 text-sm font-medium">Transaction sent!</p>
                  <p className="text-green-400 text-xs font-mono">
                    {transactionHash.substring(0, 10)}...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-dark-600 text-dark-400 rounded-xl hover:border-dark-500 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
              className="flex-1 px-4 py-3 bg-crypto-blue text-white rounded-xl hover:bg-crypto-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Coins size={16} />
                  <span>Send {selectedToken.symbol}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
} 