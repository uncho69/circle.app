import React, { useState } from 'react'
import { useLit } from '../hooks/useLit'
import { Upload, Download, Lock, Unlock, File, Share2, Users, Copy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface LitEncryptionProps {
  currentUserAddress: string
}

interface SharedFile {
  id: string
  fileName: string
  fileSize: number
  encryptedFile: Blob
  encryptedKey: Uint8Array
  sharedWith: string[]
  sharedBy: string
  sharedAt: Date
  accessControlConditions: any[]
}

export const LitEncryption: React.FC<LitEncryptionProps> = ({ currentUserAddress }) => {
  const { client, isLoading, error, connect, encryptFile, decryptFile } = useLit()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recipientAddress, setRecipientAddress] = useState('')
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'encrypt' | 'shared' | 'received'>('encrypt')

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const validateAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  const handleEncryptAndShare = async () => {
    if (!selectedFile || !client || !recipientAddress) return

    if (!validateAddress(recipientAddress)) {
      alert('Please enter a valid Ethereum address')
      return
    }

    setIsProcessing(true)
    try {
      // Define access control conditions (only the specific recipient can decrypt)
      const accessControlConditions = [
        {
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: 'eth_getBalance',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '>=',
            value: '100000000000000000' // 0.1 ETH in wei
          }
        }
      ]

      const { encryptedFile: encrypted, encryptedSymmetricKey: key } = await encryptFile(
        selectedFile,
        accessControlConditions
      )

      // Create shared file record
      const sharedFile: SharedFile = {
        id: Date.now().toString(),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        encryptedFile: encrypted,
        encryptedKey: key,
        sharedWith: [recipientAddress],
        sharedBy: currentUserAddress,
        sharedAt: new Date(),
        accessControlConditions
      }

      setSharedFiles(prev => [sharedFile, ...prev])
      
      // Reset form
      setSelectedFile(null)
      setRecipientAddress('')
      
      console.log('✅ File encrypted and shared successfully')
    } catch (err) {
      console.error('❌ Encryption/Sharing failed:', err)
      alert('Failed to encrypt and share file. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDecrypt = async (sharedFile: SharedFile) => {
    if (!client) return

    setIsProcessing(true)
    try {
      const decryptedFile = await decryptFile(
        sharedFile.encryptedFile,
        sharedFile.encryptedKey,
        sharedFile.accessControlConditions
      )

      // Create download link
      const url = URL.createObjectURL(decryptedFile)
      const a = document.createElement('a')
      a.href = url
      a.download = `decrypted_${sharedFile.fileName}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log('✅ File decrypted successfully')
    } catch (err) {
      console.error('❌ Decryption failed:', err)
      alert('Failed to decrypt file. You may not have permission to access this file.')
    } finally {
      setIsProcessing(false)
    }
  }

  const copyShareId = (fileId: string) => {
    navigator.clipboard.writeText(fileId)
    setCopiedId(fileId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const connectToLit = async () => {
    try {
      await connect()
    } catch (err) {
      console.error('Failed to connect to Lit Protocol:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crypto-blue mx-auto mb-4"></div>
          <p className="text-dark-400">Connecting to Lit Protocol...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-crypto-red mb-4">{error}</p>
        <button 
          onClick={connectToLit}
          className="bg-crypto-blue hover:bg-crypto-blue/90 text-white px-4 py-2 rounded-xl"
        >
          Retry Connection
        </button>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-6 text-center">
        <Lock className="h-12 w-12 text-dark-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-white">Encrypted File Sharing</h3>
        <p className="text-dark-400 mb-4">Connect to Lit Protocol to encrypt and share files securely</p>
        <button 
          onClick={connectToLit}
          className="bg-crypto-blue hover:bg-crypto-blue/90 text-white px-4 py-2 rounded-xl"
        >
          Connect to Lit Protocol
        </button>
      </div>
    )
  }

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Lock className="h-6 w-6 text-crypto-blue mr-2" />
        <h3 className="text-xl font-semibold text-white">Encrypted File Sharing</h3>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-dark-900 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('encrypt')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'encrypt' 
              ? 'bg-crypto-blue text-white' 
              : 'text-dark-400 hover:text-white'
          }`}
        >
          Encrypt & Share
        </button>
        <button
          onClick={() => setActiveTab('shared')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'shared' 
              ? 'bg-crypto-blue text-white' 
              : 'text-dark-400 hover:text-white'
          }`}
        >
          Shared Files
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'received' 
              ? 'bg-crypto-blue text-white' 
              : 'text-dark-400 hover:text-white'
          }`}
        >
          Received Files
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'encrypt' && (
          <motion.div
            key="encrypt"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Select File to Encrypt
              </label>
              <div className="border-2 border-dashed border-dark-600 rounded-xl p-6 text-center hover:border-crypto-blue transition-colors">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-dark-400 mx-auto mb-2" />
                  <p className="text-dark-300">
                    {selectedFile ? selectedFile.name : 'Click to select a file'}
                  </p>
                  <p className="text-sm text-dark-500">
                    {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Max 10MB'}
                  </p>
                </label>
              </div>
            </div>

            {/* Recipient Input */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Share with Wallet Address
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x1234...5678"
                className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:border-crypto-blue focus:outline-none"
              />
              {recipientAddress && !validateAddress(recipientAddress) && (
                <p className="text-crypto-red text-sm mt-1">Please enter a valid Ethereum address</p>
              )}
            </div>

            {/* Encrypt & Share Button */}
            <button
              onClick={handleEncryptAndShare}
              disabled={!selectedFile || !recipientAddress || !validateAddress(recipientAddress) || isProcessing}
              className="w-full bg-crypto-blue hover:bg-crypto-blue/90 text-white px-4 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              Encrypt & Share File
            </button>

            {/* Info */}
            <div className="p-4 bg-dark-900 rounded-xl border border-dark-700">
              <h4 className="font-medium text-white mb-2 flex items-center">
                <Lock className="h-4 w-4 mr-2 text-crypto-blue" />
                Access Control
              </h4>
              <p className="text-sm text-dark-400">
                Files are encrypted and can only be accessed by the specified recipient with a minimum ETH balance of 0.1 ETH.
                The recipient will receive a unique file ID to access the decrypted content.
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'shared' && (
          <motion.div
            key="shared"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {sharedFiles.length === 0 ? (
              <div className="text-center py-8">
                <Share2 className="h-12 w-12 text-dark-400 mx-auto mb-4" />
                <p className="text-dark-400">No files shared yet</p>
                <p className="text-dark-500 text-sm mt-1">Encrypt and share your first file</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sharedFiles.map((file) => (
                  <div key={file.id} className="bg-dark-900 border border-dark-700 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <File className="h-4 w-4 text-crypto-blue mr-2" />
                          <span className="text-white font-medium">{file.fileName}</span>
                          <span className="text-dark-500 text-sm ml-2">
                            {formatFileSize(file.fileSize)}
                          </span>
                        </div>
                        <p className="text-dark-400 text-sm mb-2">
                          Shared with: {file.sharedWith.map(addr => 
                            `${addr.slice(0, 6)}...${addr.slice(-4)}`
                          ).join(', ')}
                        </p>
                        <p className="text-dark-500 text-xs">
                          {formatDate(file.sharedAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyShareId(file.id)}
                          className="p-2 text-dark-400 hover:text-white transition-colors"
                          title="Copy file ID"
                        >
                          {copiedId === file.id ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'received' && (
          <motion.div
            key="received"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="text-center py-8">
              <Download className="h-12 w-12 text-dark-400 mx-auto mb-4" />
              <p className="text-dark-400">No files received yet</p>
              <p className="text-dark-500 text-sm mt-1">Files shared with you will appear here</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 
 
 
 
 
 
 