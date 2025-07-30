import React, { useState, useEffect } from 'react'
import { useXMTP } from '../hooks/useXMTP'
import { Send, MessageCircle, Users, Shield, User, Clock, Search, Plus, X, Wallet, Coins } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SendCryptoModal } from './SendCryptoModal'

interface Conversation {
  peerAddress: string
  id: string
}

interface XMTPChatProps {
  currentUserAddress: string
}

export const XMTPChat: React.FC<XMTPChatProps> = ({ currentUserAddress }) => {
  const { client, conversations, messages, isLoading, error, connect, sendMessage, loadMessages, createConversation } = useXMTP()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewConversationModal, setShowNewConversationModal] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showSendCryptoModal, setShowSendCryptoModal] = useState(false)

  useEffect(() => {
    if (window.ethereum && !client) {
      connectToXMTP()
    }
  }, [currentUserAddress])

  const connectToXMTP = async () => {
    if (!window.ethereum) return
    
    setIsConnecting(true)
    try {
      // For demo purposes, we'll use a mock signer
      const mockSigner = {
        address: currentUserAddress || '0x1234567890123456789012345678901234567890'
      }
      await connect(mockSigner)
    } catch (err) {
      console.error('Failed to connect to XMTP:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return
    
    try {
      await sendMessage(selectedConversation, newMessage.trim())
      setNewMessage('')
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    await loadMessages(conversation)
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return date.toLocaleDateString()
  }

  const handleCreateConversation = async () => {
    if (!newAddress.trim()) return
    
    setIsCreating(true)
    try {
      await createConversation(newAddress.trim())
      setNewAddress('')
      setShowNewConversationModal(false)
    } catch (err) {
      console.error('Failed to create conversation:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const validateAddress = (address: string) => {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  const filteredConversations = conversations.filter(conv => 
    conv.peerAddress.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isConnecting) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-96"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crypto-blue mx-auto mb-6"></div>
          <p className="text-dark-400 text-lg">Connecting to XMTP...</p>
          <p className="text-dark-500 text-sm mt-2">Establishing encrypted connection</p>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 text-center"
      >
        <div className="bg-dark-800 rounded-2xl p-8 border border-dark-700">
          <Shield className="h-16 w-16 text-crypto-red mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-white mb-4">Connection Failed</h3>
          <p className="text-dark-400 mb-6">{error}</p>
          <button 
            onClick={connectToXMTP}
            className="bg-crypto-blue hover:bg-crypto-blue/90 text-white px-6 py-3 rounded-xl transition-colors font-medium"
          >
            Retry Connection
          </button>
        </div>
      </motion.div>
    )
  }

  if (!client) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 text-center"
      >
        <div className="bg-dark-800 rounded-2xl p-8 border border-dark-700 max-w-md mx-auto">
          <MessageCircle className="h-16 w-16 text-crypto-blue mx-auto mb-6" />
          <h3 className="text-2xl font-extralight text-white mb-4">Direct Messages</h3>
          <p className="text-dark-400 mb-6">Connect your wallet to start encrypted messaging</p>
          <button 
            onClick={connectToXMTP}
            className="bg-crypto-blue hover:bg-crypto-blue/90 text-white px-8 py-4 rounded-xl transition-colors font-medium w-full"
          >
            Connect Wallet
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-[calc(100vh-200px)] bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden"
      >
        {/* Conversations List */}
        <div className="w-1/3 border-r border-dark-700 bg-dark-900">
          <div className="p-6 border-b border-dark-700">
            <h3 className="text-xl font-extralight text-white mb-4 flex items-center">
              <Users className="h-6 w-6 mr-3 text-crypto-blue" />
              Conversations
            </h3>
            
            {/* Search and New Chat */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={18} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-crypto-blue transition-colors"
                />
              </div>
              
              <button
                onClick={() => setShowNewConversationModal(true)}
                className="w-full bg-gradient-to-r from-crypto-blue to-crypto-purple hover:from-crypto-blue/90 hover:to-crypto-purple/90 text-white px-4 py-3 rounded-xl transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Conversation</span>
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto h-full">
                      {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-dark-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No conversations yet</p>
              <p className="text-sm mt-2">Create your first conversation to start messaging</p>
            </div>
          ) : (
              filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation.peerAddress}
                  whileHover={{ backgroundColor: '#2D2D2D' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectConversation(conversation)}
                  className={`p-4 cursor-pointer border-b border-dark-700 transition-colors ${
                    selectedConversation?.peerAddress === conversation.peerAddress
                      ? 'bg-dark-700 border-crypto-blue/30'
                      : 'hover:bg-dark-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-crypto-blue to-crypto-purple rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-white truncate">{formatAddress(conversation.peerAddress)}</p>
                        {conversation.lastMessageTime && (
                          <span className="text-xs text-dark-400 ml-2">
                            {formatTime(conversation.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-dark-400 truncate">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                        {conversation.unreadCount && conversation.unreadCount > 0 && (
                          <span className="bg-crypto-blue text-white text-xs rounded-full px-2 py-1 ml-2 min-w-[20px] text-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <Shield className="h-4 w-4 text-crypto-green flex-shrink-0" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-dark-800">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-dark-700 bg-dark-900">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-crypto-blue to-crypto-purple rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      Chat with {formatAddress(selectedConversation.peerAddress)}
                    </h3>
                    <p className="text-sm text-dark-400 flex items-center">
                      <Shield className="h-3 w-3 mr-1 text-crypto-green" />
                      End-to-end encrypted
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                              {messages.length === 0 ? (
                <div className="text-center text-dark-500 mt-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm mt-2">Send your first message to start the conversation</p>
                </div>
              ) : (
                  messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex ${
                        message.senderAddress === currentUserAddress ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs px-4 py-3 rounded-2xl ${
                          message.senderAddress === currentUserAddress
                            ? 'bg-gradient-to-r from-crypto-blue to-crypto-purple text-white'
                            : 'bg-dark-700 text-white border border-dark-600'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <div className={`flex items-center mt-2 text-xs ${
                          message.senderAddress === currentUserAddress ? 'text-white/70' : 'text-dark-400'
                        }`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {message.sent.toLocaleTimeString()}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-dark-700 bg-dark-900">
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="Type a message... (Enter to send)"
                      className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-crypto-blue transition-colors pr-12"
                    />
                    {newMessage.trim() && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handleSendMessage}
                          className="text-crypto-blue hover:text-crypto-blue/80 transition-colors"
                        >
                          <Send className="h-5 w-5" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                  
                  {/* Send Crypto Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSendCryptoModal(true)}
                    className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-colors flex items-center space-x-2"
                    title="Send Crypto"
                  >
                    <Coins size={16} />
                  </motion.button>
                </div>
                <div className="mt-2 text-xs text-dark-500 flex items-center">
                  <Shield className="h-3 w-3 mr-1 text-crypto-green" />
                  Messages are end-to-end encrypted
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-dark-500">
                <MessageCircle className="h-16 w-16 mx-auto mb-6 opacity-50" />
                <h3 className="text-xl font-extralight text-white mb-2">Select a conversation</h3>
                <p>Choose a conversation from the list or create a new one to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* New Conversation Modal */}
      <AnimatePresence>
        {showNewConversationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewConversationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-800 rounded-2xl border border-dark-700 p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-extralight text-white flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-crypto-blue" />
                  New Conversation
                </h3>
                <button
                  onClick={() => setShowNewConversationModal(false)}
                  className="text-dark-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-2">
                    Wallet Address
                  </label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={18} />
                    <input
                      type="text"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="0x1234567890123456789012345678901234567890"
                      className="w-full bg-dark-900 border border-dark-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-crypto-blue transition-colors"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateConversation()
                        }
                      }}
                    />
                  </div>
                  {newAddress && !validateAddress(newAddress) && (
                    <p className="text-crypto-red text-sm mt-1">Please enter a valid Ethereum address</p>
                  )}
                </div>

                <div className="bg-dark-900 rounded-xl p-4 border border-dark-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-4 w-4 text-crypto-green" />
                    <span className="text-sm font-medium text-white">Secure Connection</span>
                  </div>
                  <p className="text-xs text-dark-400">
                    This conversation will be end-to-end encrypted using XMTP protocol. 
                    Only you and the recipient can read the messages.
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowNewConversationModal(false)}
                    className="flex-1 px-4 py-3 border border-dark-600 text-white rounded-xl hover:bg-dark-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateConversation}
                    disabled={!newAddress.trim() || !validateAddress(newAddress) || isCreating}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-crypto-blue to-crypto-purple text-white rounded-xl hover:from-crypto-blue/90 hover:to-crypto-purple/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isCreating ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      'Start Conversation'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send Crypto Modal */}
      {selectedConversation && (
        <SendCryptoModal
          isOpen={showSendCryptoModal}
          onClose={() => setShowSendCryptoModal(false)}
          recipient={{
            address: selectedConversation.peerAddress,
            pseudonym: formatAddress(selectedConversation.peerAddress)
          }}
          context="chat"
        />
      )}
    </>
  )
} 
 
 
 
 
 
 


