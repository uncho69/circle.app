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
  AlertTriangle
} from 'lucide-react'
import { walletAuth } from '../utils/walletAuth'

export interface EphemeralDMProps {
  className?: string
}

interface DMMessage {
  id: string
  from: string
  to: string
  content: string
  timestamp: string
  read: boolean
  autoDeleteAfter: number // seconds after reading
  expiresAt?: string
}

interface DMConversation {
  pseudonym: string
  lastMessage: DMMessage | null
  unreadCount: number
}

// Simple in-memory storage for demo
let messages: DMMessage[] = []
let messageIdCounter = 1

export const EphemeralDM: React.FC<EphemeralDMProps> = ({ className = '' }) => {
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [conversations, setConversations] = useState<DMConversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [conversationMessages, setConversationMessages] = useState<DMMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [newRecipient, setNewRecipient] = useState('')
  const [autoDeleteTime, setAutoDeleteTime] = useState(30) // seconds (0 = after reading)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Get current user
    const profile = walletAuth.getCurrentProfile()
    if (profile) {
      setCurrentUser(profile.pseudonym)
      loadConversations(profile.pseudonym)
    }
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationMessages])

  useEffect(() => {
    // Auto-delete messages after reading or timer expiry
    const interval = setInterval(() => {
      const now = Date.now()
      const initialCount = messages.length
      
      messages = messages.filter(msg => {
        if (msg.expiresAt && new Date(msg.expiresAt).getTime() <= now) {
          console.log(`🗑️ Auto-deleted ephemeral message from ${msg.from} (${msg.autoDeleteAfter === 0 ? 'after reading' : msg.autoDeleteAfter + 's timer'})`)
          return false
        }
        return true
      })
      
      // If messages were deleted, update UI
      if (messages.length < initialCount) {
        loadConversations(currentUser!)
        
        if (activeConversation && currentUser) {
          loadConversationMessages(currentUser, activeConversation)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [activeConversation, currentUser])

  const loadConversations = (userPseudonym: string) => {
    // Get all conversations for current user
    const userMessages = messages.filter(msg => 
      msg.from === userPseudonym || msg.to === userPseudonym
    )

    const conversationMap = new Map<string, DMConversation>()

    userMessages.forEach(msg => {
      const otherUser = msg.from === userPseudonym ? msg.to : msg.from
      
      if (!conversationMap.has(otherUser)) {
        conversationMap.set(otherUser, {
          pseudonym: otherUser,
          lastMessage: null,
          unreadCount: 0
        })
      }

      const conversation = conversationMap.get(otherUser)!
      
      if (!conversation.lastMessage || new Date(msg.timestamp) > new Date(conversation.lastMessage.timestamp)) {
        conversation.lastMessage = msg
      }

      if (msg.to === userPseudonym && !msg.read) {
        conversation.unreadCount++
      }
    })

    setConversations(Array.from(conversationMap.values()).sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0
      const bTime = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0
      return bTime - aTime
    }))
  }

  const loadConversationMessages = (userPseudonym: string, otherUser: string) => {
    const convMessages = messages.filter(msg => 
      (msg.from === userPseudonym && msg.to === otherUser) ||
      (msg.from === otherUser && msg.to === userPseudonym)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    // Mark incoming messages as read and set expiry
    convMessages.forEach(msg => {
      if (msg.to === userPseudonym && !msg.read) {
        msg.read = true
        
        if (msg.autoDeleteAfter === 0) {
          // Delete immediately after reading
          msg.expiresAt = new Date(Date.now() + 1000).toISOString() // 1 second delay for UX
          console.log(`👁️ Message from ${msg.from} marked as read, will delete after reading`)
        } else {
          // Delete after specified time
          msg.expiresAt = new Date(Date.now() + msg.autoDeleteAfter * 1000).toISOString()
          console.log(`👁️ Message from ${msg.from} marked as read, will delete in ${msg.autoDeleteAfter}s`)
        }
      }
    })

    setConversationMessages(convMessages)
    
    // Update conversations list
    loadConversations(userPseudonym)
  }

  const sendMessage = async () => {
    if (!currentUser || !newMessage.trim()) return

    let recipient = activeConversation || newRecipient
    if (!recipient) return

    // Check if recipient is a wallet address (starts with 0x and 42 chars)
    if (recipient.startsWith('0x') && recipient.length === 42) {
      // Try to find pseudonym by wallet address
      const profiles = walletAuth.getAllProfiles()
      const profile = profiles.find(p => p.walletAddress.toLowerCase() === recipient.toLowerCase())
      
      if (profile) {
        recipient = profile.pseudonym
        console.log(`🔍 Found user ${recipient} for wallet address ${newRecipient}`)
      } else {
        alert(`❌ No user found with wallet address ${recipient}.\nMake sure they have registered on Decentra.`)
        return
      }
    }

    // Validate that recipient exists (either by pseudonym or found via address)
    const allProfiles = walletAuth.getAllProfiles()
    const recipientExists = allProfiles.some(p => p.pseudonym === recipient)
    
    if (!recipientExists && recipient !== currentUser) {
      alert(`❌ User "${recipient}" not found.\nMake sure they have registered on Decentra.`)
      return
    }

    if (recipient === currentUser) {
      alert(`❌ You cannot send messages to yourself.`)
      return
    }

    const message: DMMessage = {
      id: `dm_${messageIdCounter++}`,
      from: currentUser,
      to: recipient,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false,
      autoDeleteAfter: autoDeleteTime,
      expiresAt: autoDeleteTime === 0 ? undefined : new Date(Date.now() + autoDeleteTime * 1000).toISOString()
    }

    messages.push(message)
    setNewMessage('')
    setNewRecipient('')

    console.log(`💬 Sent ephemeral DM to ${recipient} (auto-delete: ${autoDeleteTime}s)`)

    // Refresh conversations and messages
    loadConversations(currentUser)
    if (activeConversation) {
      loadConversationMessages(currentUser, activeConversation)
    } else {
      // Open the conversation we just started
      setActiveConversation(recipient)
      loadConversationMessages(currentUser, recipient)
    }
  }

  const openConversation = (pseudonym: string) => {
    setActiveConversation(pseudonym)
    if (currentUser) {
      loadConversationMessages(currentUser, pseudonym)
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
                  key={conv.pseudonym}
                  onClick={() => openConversation(conv.pseudonym)}
                  className={`w-full p-3 rounded-xl text-left hover:bg-dark-700 transition-colors ${
                    activeConversation === conv.pseudonym ? 'bg-dark-700' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-crypto-blue to-crypto-purple rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {conv.pseudonym.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm truncate">
                          {conv.pseudonym}
                        </div>
                        {conv.lastMessage && (
                          <div className="text-dark-400 text-xs truncate">
                            {conv.lastMessage.content}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {conv.unreadCount > 0 && (
                        <div className="bg-crypto-blue text-white text-xs rounded-full px-2 py-1">
                          {conv.unreadCount}
                        </div>
                      )}
                      {conv.lastMessage && (
                        <div className="text-dark-500 text-xs">
                          {formatTimeAgo(conv.lastMessage.timestamp)}
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
                  <div>
                    <div className="text-white font-semibold">{activeConversation}</div>
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
                  const isOwnMessage = message.from === currentUser
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
              <div className="flex space-x-2">
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
  )
} 