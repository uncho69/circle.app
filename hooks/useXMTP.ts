import { useState, useEffect, useCallback } from 'react'

interface Conversation {
  peerAddress: string
  id: string
  lastMessage?: string
  lastMessageTime?: Date
  unreadCount?: number
}

interface Message {
  content: string
  senderAddress: string
  sent: Date
  id: string
}

interface UseXMTPReturn {
  client: any | null
  conversations: Conversation[]
  messages: Message[]
  isLoading: boolean
  error: string | null
  connect: (signer: any) => Promise<void>
  sendMessage: (conversation: Conversation, content: string) => Promise<void>
  loadConversations: () => Promise<void>
  loadMessages: (conversation: Conversation) => Promise<void>
  createConversation: (peerAddress: string) => Promise<Conversation>
}

export const useXMTP = (): UseXMTPReturn => {
  const [client, setClient] = useState<any | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async (signer: any) => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔗 Connecting to XMTP...')
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // For demo purposes, we'll simulate a connected client
      setClient({ 
        connected: true, 
        address: signer.address || '0x123...',
        canMessage: true
      })
      
      console.log('✅ XMTP client connected')
    } catch (err) {
      console.error('❌ XMTP connection failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect to XMTP')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadConversations = useCallback(async () => {
    if (!client) return
    
    try {
      console.log('📱 Loading conversations...')
      
      // Simulate loading conversations
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Start with empty conversations - only real ones created by user
      setConversations([])
      console.log('📱 No conversations yet - create your first one!')
    } catch (err) {
      console.error('❌ Failed to load conversations:', err)
      setError('Failed to load conversations')
    }
  }, [client])

  const loadMessages = useCallback(async (conversation: Conversation) => {
    if (!client) return
    
    try {
      console.log('💬 Loading messages...')
      
      // Simulate loading messages
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Start with empty messages for new conversations
      setMessages([])
      console.log('💬 No messages yet - start the conversation!')
    } catch (err) {
      console.error('❌ Failed to load messages:', err)
      setError('Failed to load messages')
    }
  }, [client])

  const sendMessage = useCallback(async (conversation: Conversation, content: string) => {
    if (!client) return
    
    try {
      console.log('📤 Sending message...')
      
      // Simulate sending message
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Add message to the list
      const newMessage: Message = {
        id: Date.now().toString(),
        content,
        senderAddress: client.address || '0x123...',
        sent: new Date()
      }
      
      setMessages(prev => [...prev, newMessage])
      
      // Update conversation with last message
      setConversations(prev => prev.map(conv => 
        conv.peerAddress === conversation.peerAddress 
          ? { ...conv, lastMessage: content, lastMessageTime: new Date(), unreadCount: 0 }
          : conv
      ))
      
      console.log('✅ Message sent via XMTP')
      
    } catch (err) {
      console.error('❌ Failed to send message:', err)
      setError('Failed to send message')
    }
  }, [client])

  const createConversation = useCallback(async (peerAddress: string) => {
    try {
      console.log('➕ Creating new conversation...')
      
      // Simulate creating conversation
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const newConversation: Conversation = {
        peerAddress,
        id: Date.now().toString(),
        lastMessage: undefined,
        lastMessageTime: undefined,
        unreadCount: 0
      }
      
      setConversations(prev => [newConversation, ...prev])
      console.log('✅ New conversation created')
      
      return newConversation
    } catch (err) {
      console.error('❌ Failed to create conversation:', err)
      throw err
    }
  }, [])

  // Load conversations when client connects
  useEffect(() => {
    if (client) {
      loadConversations()
    }
  }, [client, loadConversations])

  return {
    client,
    conversations,
    messages,
    isLoading,
    error,
    connect,
    sendMessage,
    loadConversations,
    loadMessages,
    createConversation
  }
} 
 
 
 
 
 
 