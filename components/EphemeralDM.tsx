import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  MessageCircle, 
  Clock, 
  Lock,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Coins
} from 'lucide-react'
import { useUniversalWallet } from '../hooks/useUniversalWallet'
import { SendCryptoModal } from './SendCryptoModal'

export interface EphemeralDMProps {
  className?: string
}

interface DMMessage {
  id: string
  content: string
  from: string
  to: string
  timestamp: string
  read?: boolean
  expiresAt?: string
}

interface DMConversation {
  conversation_id: string
  other_user_pseudonym: string
  other_user_display_name: string
  last_message: string | null
  last_message_time: string | null
  unread_count: number
}

export const EphemeralDM: React.FC<EphemeralDMProps> = ({ className = '' }) => {
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [conversations, setConversations] = useState<DMConversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [conversationMessages, setConversationMessages] = useState<DMMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [newRecipient, setNewRecipient] = useState('')
  const [autoDeleteTime, setAutoDeleteTime] = useState(30) // seconds (0 = after reading)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scheduledDeletionRef = useRef<Set<string>>(new Set())
  const [showSendCrypto, setShowSendCrypto] = useState(false)

  const { account } = useUniversalWallet()

  useEffect(() => {
    if (account) {
      // Get current user's pseudonym
      fetch(`/api/users/get?wallet_address=${account}`)
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            setCurrentUser(result.user.pseudonym)
            loadConversations(account)
          }
        })
        .catch(error => {
          console.error('Error fetching current user:', error)
        })
    }
  }, [account])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationMessages])

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!account) return

    const interval = setInterval(() => {
      loadConversations(account)
      if (activeConversation) {
        loadConversationMessages(account, activeConversation)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [account, activeConversation])

  const loadConversations = async (walletAddress: string) => {
    try {
      const response = await fetch(`/api/messages/conversations?wallet_address=${walletAddress}`)
      const result = await response.json()

      if (result.success) {
        setConversations(result.conversations || [])
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const loadConversationMessages = async (walletAddress: string, otherUserWallet: string) => {
    try {
      const response = await fetch(`/api/messages/get?wallet_address=${walletAddress}&other_user_pseudonym=${otherUserWallet}`)
      const result = await response.json()

      if (result.success) {
        const mapped: DMMessage[] = (result.messages || []).map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          from: msg.is_own ? walletAddress : otherUserWallet,
          to: msg.is_own ? otherUserWallet : walletAddress,
          timestamp: msg.created_at
        }))

        setConversationMessages(mapped)
        scheduleEphemeralDeletions(mapped, walletAddress)
      }
    } catch (error) {
      console.error('Error loading conversation messages:', error)
    }
  }

  const scheduleEphemeralDeletions = (messagesList: DMMessage[], walletAddress: string) => {
    messagesList.forEach((m) => {
      const isIncoming = m.from.toLowerCase() !== walletAddress.toLowerCase()
      if (!isIncoming) return
      if (scheduledDeletionRef.current.has(m.id)) return

      const ttlMs = autoDeleteTime === 0 ? 1500 : autoDeleteTime * 1000
      const expiry = new Date(Date.now() + ttlMs).toISOString()

      // Mark read and set expiry locally
      setConversationMessages(prev => prev.map(pm => pm.id === m.id ? { ...pm, read: true, expiresAt: expiry } : pm))
      scheduledDeletionRef.current.add(m.id)

      setTimeout(() => {
        deleteMessages([m.id])
      }, ttlMs)
    })
  }

  const deleteMessages = async (ids: string[]) => {
    try {
      const resp = await fetch('/api/messages/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })
      const result = await resp.json()
      if (result.success) {
        setConversationMessages(prev => prev.filter(m => !ids.includes(m.id)))
      }
    } catch (err) {
      console.error('Failed to delete messages', err)
    }
  }

  const sendMessage = async () => {
    if (!account || !newMessage.trim()) return

    let recipient = (activeConversation || newRecipient).toLowerCase()
    if (!recipient) return

    if (account && recipient.toLowerCase() === account.toLowerCase()) {
      alert(`❌ You cannot send messages to yourself.`)
      return
    }

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_wallet: account,
          recipient_pseudonym: recipient, // wallet address per API
          content: newMessage.trim()
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setNewMessage('')
        setNewRecipient('')
        
        console.log(`💬 Sent message to ${recipient}`)

        // Refresh conversations and messages
        loadConversations(account)
        if (activeConversation) {
          loadConversationMessages(account, activeConversation)
        } else {
          // Open the conversation we just started
          setActiveConversation(recipient)
          loadConversationMessages(account, recipient)
        }
      } else {
        alert(`❌ Failed to send message: ${result.error}`)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('❌ Failed to send message. Please try again.')
    }
  }

  const openConversation = (otherUserWallet: string) => {
    setActiveConversation(otherUserWallet)
    if (account) {
      loadConversationMessages(account, otherUserWallet)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = Date.now()
    const msgTime = new Date(timestamp).getTime()
    const diffMinutes = Math.floor((now - msgTime) / (1000 * 60))
    
    if (diffMinutes < 1) return 'now'
    if (diffMinutes < 60) return `${diffMinutes}m`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`
    return `${Math.floor(diffMinutes / 1440)}d`
  }

  const formatAddressMiddle = (address: string) => {
    if (!address) return ''
    const a = address.toString()
    if (a.length <= 14) return a
    const start = a.slice(0, 8)
    const end = a.slice(-4)
    return `${start}...${end}`
  }

  const getTimeUntilDelete = (message: DMMessage) => {
    if (!message.read || !message.expiresAt) return null
    
    const now = Date.now()
    const expiryTime = new Date(message.expiresAt).getTime()
    const remainingSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000))
    
    return remainingSeconds
  }

  if (!currentUser) {
    return (
      <div className={`${className}`}>
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-12 text-center">
          <MessageCircle size={48} className="mx-auto text-dark-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Connect Wallet</h3>
          <p className="text-dark-400">Connect your wallet to send ephemeral messages</p>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className={`flex h-[600px] bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden ${className}`}>
      {/* Conversations List */}
      <div className="w-1/3 border-r border-dark-700 flex flex-col">
        <div className="p-4 border-b border-dark-700">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <MessageCircle size={20} className="mr-2" />
            Ephemeral DMs
          </h3>
          <p className="text-dark-400 text-sm mt-1">Auto-delete after reading</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-dark-400 text-sm">No conversations yet</div>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map((conv) => (
                <button
                  key={conv.other_user_pseudonym}
                  onClick={() => openConversation(conv.other_user_pseudonym)}
                  className={`w-full p-3 rounded-xl text-left hover:bg-dark-700 transition-colors ${
                    activeConversation === conv.other_user_pseudonym ? 'bg-dark-700' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-crypto-blue to-crypto-purple rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {conv.other_user_pseudonym.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm truncate text-center w-full">
                          {formatAddressMiddle(conv.other_user_pseudonym)}
                        </div>
                        {conv.last_message && (
                          <div className="text-dark-400 text-xs truncate">
                            {conv.last_message}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {conv.unread_count > 0 && (
                        <div className="bg-crypto-blue text-white text-xs rounded-full px-2 py-1">
                          {conv.unread_count}
                        </div>
                      )}
                      {conv.last_message_time && (
                        <div className="text-dark-500 text-xs">
                          {formatTimeAgo(conv.last_message_time)}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-dark-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-crypto-blue to-crypto-purple rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {activeConversation.charAt(0).toUpperCase()}
                    </span>
                  </div>
                     <div className="w-full">
                    <div className="text-white font-semibold text-center w-full">{formatAddressMiddle(activeConversation)}</div>
                    <div className="text-dark-400 text-sm flex items-center">
                      <Lock size={12} className="mr-1" />
                      Ephemeral chat
                    </div>
                  </div>
                </div>
                <div className="text-dark-400 text-sm">
                  <AlertTriangle size={16} className="inline mr-1" />
                  Messages auto-delete after reading
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {conversationMessages.map((message) => {
                  const isOwnMessage = account ? message.from.toLowerCase() === account.toLowerCase() : false
                  const timeUntilDelete = getTimeUntilDelete(message)

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-xs px-4 py-2 rounded-xl transition-all duration-300 ${
                          isOwnMessage 
                            ? 'bg-crypto-blue text-white' 
                            : 'bg-dark-700 text-white'
                        } ${
                          timeUntilDelete !== null && timeUntilDelete <= 5 && timeUntilDelete > 0
                            ? 'animate-pulse border-2 border-red-400 bg-red-900/20'
                            : ''
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-1 text-xs opacity-75">
                          <span>{formatTimeAgo(message.timestamp)}</span>
                          {timeUntilDelete !== null && (
                            <span className={`flex items-center ${
                              timeUntilDelete <= 5 ? 'text-red-200 font-bold' : 'text-red-300'
                            }`}>
                              {timeUntilDelete <= 5 ? (
                                <AlertTriangle size={10} className="mr-1 animate-pulse" />
                              ) : (
                                <Clock size={10} className="mr-1" />
                              )}
                              {timeUntilDelete}s
                            </span>
                          )}
                          {message.read && <Eye size={10} />}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-dark-700">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-dark-400 text-sm">
                  Auto-delete after: {autoDeleteTime === 0 && '👁️'}
                </span>
                <select
                  value={autoDeleteTime}
                  onChange={(e) => setAutoDeleteTime(Number(e.target.value))}
                  className="bg-dark-700 text-white text-sm px-2 py-1 rounded"
                >
                  <option value={0}>👁️ After reading</option>
                  <option value={10}>⚡ 10s</option>
                  <option value={30}>🕐 30s</option>
                  <option value={60}>🕑 1m</option>
                  <option value={300}>🕔 5m</option>
                </select>
              </div>
              <div className="flex space-x-2 items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type an ephemeral message..."
                  className="flex-1 bg-dark-700 text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-crypto-blue"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-crypto-blue text-white rounded-xl hover:bg-crypto-blue/90 transition-colors disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
                <button
                  onClick={() => setShowSendCrypto(true)}
                  title="Send crypto"
                  className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-colors"
                >
                  <Coins size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <MessageCircle size={64} className="text-dark-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Start an Ephemeral Chat</h3>
            <p className="text-dark-400 mb-6 text-center max-w-md">
              Send messages that automatically delete after being read or after a timer. Perfect for private conversations.
              <br />
              <span className="text-sm text-dark-500 mt-2 block">
                Find users by their pseudonym or wallet address
              </span>
              <br />
              <span className="text-xs text-yellow-400 mt-2 block">
                ⚠️ Messages disappear forever - no recovery possible!
              </span>
            </p>
            
            <div className="w-full max-w-sm">
              <input
                type="text"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="Enter pseudonym or wallet address..."
                className="w-full bg-dark-700 text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-crypto-blue mb-4"
              />
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Your first message..."
                  className="flex-1 bg-dark-700 text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-crypto-blue"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !newRecipient.trim()}
                  className="px-4 py-2 bg-crypto-blue text-white rounded-xl hover:bg-crypto-blue/90 transition-colors disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    {activeConversation ? (
      <SendCryptoModal
        isOpen={showSendCrypto}
        onClose={() => setShowSendCrypto(false)}
        recipient={{ address: activeConversation as string, pseudonym: formatAddressMiddle(activeConversation as string) }}
        context="chat"
      />
    ) : null}
    </>
  )
}