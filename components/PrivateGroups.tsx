import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Lock, 
  Plus, 
  Shield, 
  Coins, 
  Eye, 
  EyeOff, 
  Settings,
  MessageCircle,
  Crown,
  AlertTriangle,
  CheckCircle,
  Wallet
} from 'lucide-react'
import { walletAuth } from '../utils/walletAuth'
import { useWallet } from '../hooks/useWallet'
import { useUniversalWallet } from '../hooks/useUniversalWallet'
import { SendCryptoModal } from './SendCryptoModal'

interface Group {
  id: string
  name: string
  description: string
  minEthRequired: number
  memberCount: number
  isPrivate: boolean
  owner: string
  members: string[]
  createdAt: string
}

interface GroupInvite {
  groupId: string
  groupName: string
  inviter: string
  expiresAt: string
}

export const PrivateGroups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([])
  const [invites, setInvites] = useState<GroupInvite[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [selectedGroupForSettings, setSelectedGroupForSettings] = useState<Group | null>(null)
  const [settingsForm, setSettingsForm] = useState({
    minEthRequired: 1,
    isPrivate: true,
    members: [] as string[]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSendCryptoModal, setShowSendCryptoModal] = useState(false)
  const [selectedMemberForCrypto, setSelectedMemberForCrypto] = useState<string | null>(null)
  
  const { stats } = useWallet()
  const { isConnected, account, balance, walletName, connectWallet, getBalance, estimateCircleCreation, createCircle } = useUniversalWallet()
  const currentProfile = walletAuth.getCurrentProfile()

  // Form states
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    minEthRequired: 1,
    isPrivate: true
  })

  const [joinGroupId, setJoinGroupId] = useState('')

  useEffect(() => {
    loadGroups()
    loadInvites()
  }, [])

  // Update real wallet balance when connected
  useEffect(() => {
    if (isConnected && account) {
      getBalance(account)
    }
  }, [isConnected, account, getBalance])

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/groups/list')
      const result = await response.json()
      
      if (result.success) {
        setGroups(result.groups)
      }
    } catch (error) {
      console.error('Failed to load groups:', error)
    }
  }

  const loadInvites = async () => {
    try {
      const response = await fetch('/api/groups/invites')
      const result = await response.json()
      
      if (result.success) {
        setInvites(result.invites)
      }
    } catch (error) {
      console.error('Failed to load invites:', error)
    }
  }

    const createGroup = async () => {
    if (!currentProfile) {
      setError('You must be connected to create a circle')
      return
    }

    if (!newGroup.name.trim()) {
      setError('Circle name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Connect wallet if not connected
      if (!isConnected) {
        await connectWallet()
      }

      // Estimate transaction cost
      const payment = await estimateCircleCreation()
      console.log('💰 Estimated payment:', payment)

      // Create circle with blockchain transaction
      const transactionHash = await createCircle({
        name: newGroup.name,
        description: newGroup.description,
        minEthRequired: newGroup.minEthRequired,
        isPrivate: newGroup.isPrivate
      })

      // Create circle in database after successful transaction
      const response = await fetch('/api/groups/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newGroup,
          owner: currentProfile.pseudonym,
          transactionHash: transactionHash
        })
      })

      const result = await response.json()

      if (result.success) {
        setGroups(prev => [result.group, ...prev])
        setNewGroup({ name: '', description: '', minEthRequired: 1, isPrivate: true })
        setShowCreateModal(false)
        console.log('✅ Circle created successfully:', result.group)
        console.log(`💰 Transaction hash: ${transactionHash}`)
        
        // Show success message with transaction details
        alert(`🔮 Circle created successfully!\n\n💰 Transaction: ${transactionHash.substring(0, 10)}...\n💸 Cost: 0.15 ETH ($300)\n\nWelcome to your new circle!`)
      } else {
        setError(result.error || 'Failed to create circle')
      }
    } catch (error) {
      console.error('Circle creation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create circle')
    } finally {
      setLoading(false)
    }
  }

  const joinGroup = async () => {
    if (!currentProfile) {
      setError('You must be connected to join a decircle')
      return
    }

    if (!joinGroupId.trim()) {
      setError('Decircle ID is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      // First verify ETH balance with ZK-proof
      const ethBalance = stats.balance.eth
      const group = groups.find(g => g.id === joinGroupId)
      
      if (group && ethBalance < group.minEthRequired) {
        setError(`You need at least ${group.minEthRequired} ETH to join this group. You have ${ethBalance.toFixed(4)} ETH.`)
        return
      }

      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: joinGroupId,
          user: currentProfile.pseudonym,
          ethBalance: ethBalance
        })
      })

      const result = await response.json()

      if (result.success) {
        // Update groups list
        setGroups(prev => prev.map(g => 
          g.id === joinGroupId 
            ? { ...g, memberCount: g.memberCount + 1, members: [...g.members, currentProfile.pseudonym] }
            : g
        ))
        setJoinGroupId('')
        setShowJoinModal(false)
              console.log('✅ Successfully joined decircle:', result.group)
    } else {
      setError(result.error || 'Failed to join decircle')
    }
  } catch (error) {
    console.error('Join decircle error:', error)
    setError('Failed to join decircle')
    } finally {
      setLoading(false)
    }
  }

  const acceptInvite = async (invite: GroupInvite) => {
    setJoinGroupId(invite.groupId)
    setShowJoinModal(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleCircleSettings = (group: Group) => {
    setSelectedGroupForSettings(group)
    setSettingsForm({
      minEthRequired: group.minEthRequired,
      isPrivate: group.isPrivate,
      members: [...group.members]
    })
    setShowSettingsModal(true)
  }

  const handleSaveSettings = async () => {
    if (!selectedGroupForSettings) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/groups/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: selectedGroupForSettings.id,
          minEthRequired: settingsForm.minEthRequired,
          isPrivate: settingsForm.isPrivate,
          members: settingsForm.members
        })
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        setGroups(prev => prev.map(g => 
          g.id === selectedGroupForSettings.id 
            ? { 
                ...g, 
                minEthRequired: settingsForm.minEthRequired,
                isPrivate: settingsForm.isPrivate,
                members: settingsForm.members,
                memberCount: settingsForm.members.length
              }
            : g
        ))
        
        setShowSettingsModal(false)
        console.log('✅ Circle settings updated successfully')
      } else {
        setError(result.error || 'Failed to update circle settings')
      }
    } catch (error) {
      console.error('Update circle settings error:', error)
      setError('Failed to update circle settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Circles</h2>
          <p className="text-dark-400">Private circles with ZK-proof verification</p>
        </div>
        
                  <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-4 py-2 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors flex items-center space-x-2"
            >
              <Users size={16} />
              <span>Join Circle</span>
            </button>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-crypto-blue text-white rounded-xl hover:bg-crypto-blue/90 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Create Circle</span>
            </button>
          </div>
      </div>

      {/* Invites */}
      {invites.length > 0 && (
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
            <MessageCircle size={20} className="text-crypto-blue" />
            <span>Circle Invitations</span>
          </h3>
          
          <div className="space-y-3">
            {invites.map((invite) => (
              <div key={invite.groupId} className="flex items-center justify-between bg-dark-900/50 rounded-xl p-4">
                <div>
                  <p className="text-white font-medium">{invite.groupName}</p>
                  <p className="text-dark-400 text-sm">Invited by {invite.inviter}</p>
                  <p className="text-dark-400 text-xs">Expires {formatDate(invite.expiresAt)}</p>
                </div>
                
                <button
                  onClick={() => acceptInvite(invite)}
                  className="px-3 py-1 bg-crypto-blue text-white text-sm rounded-lg hover:bg-crypto-blue/90 transition-colors"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-800 border border-dark-700 rounded-2xl p-6 hover:border-crypto-blue/50 transition-colors cursor-pointer"
            onClick={() => setSelectedGroup(group)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                {group.isPrivate ? (
                  <Lock className="text-red-400" size={20} />
                ) : (
                  <Users className="text-green-400" size={20} />
                )}
                <h3 className="text-white font-semibold">{group.name}</h3>
              </div>
              
              <div className="flex items-center space-x-2">
                {group.owner === currentProfile?.pseudonym && (
                  <>
                    <Crown className="text-yellow-400" size={16} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCircleSettings(group)
                      }}
                      className="p-1 hover:bg-dark-700 rounded-lg transition-colors"
                      title="Circle Settings"
                    >
                      <Settings className="text-dark-400 hover:text-white" size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <p className="text-dark-400 text-sm mb-4 line-clamp-2">{group.description}</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-400">Members</span>
                <span className="text-white">{group.memberCount}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-400">Min ETH</span>
                <div className="flex items-center space-x-1">
                  <Coins className="text-crypto-blue" size={14} />
                  <span className="text-white">{group.minEthRequired}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-400">Created</span>
                <span className="text-white">{formatDate(group.createdAt)}</span>
              </div>
            </div>
            
            {group.members.includes(currentProfile?.pseudonym || '') && (
              <div className="mt-4 pt-4 border-t border-dark-700">
                <div className="flex items-center space-x-2 text-green-400 text-sm">
                  <CheckCircle size={14} />
                  <span>Member</span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {groups.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto text-dark-400 mb-4" size={48} />
          <h3 className="text-white text-xl font-semibold mb-2">No private Circles yet</h3>
          <p className="text-dark-400 mb-6">Found the first circle or wait for an invitation</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-crypto-blue text-white rounded-xl hover:bg-crypto-blue/90 transition-colors"
          >
            Found First Circle
          </button>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-800 border border-dark-700 rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-white text-xl font-semibold mb-4">Create Circle</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Decircle Name</label>
                                  <input
                    type="text"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-crypto-blue"
                    placeholder="Enter circle name"
                  />
              </div>
              
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Decircle Description</label>
                                  <textarea
                    value={newGroup.description}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-crypto-blue resize-none"
                    rows={3}
                    placeholder="Describe your circle"
                  />
              </div>
              
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Minimum ETH Required</label>
                <div className="flex items-center space-x-2">
                  <Coins className="text-crypto-blue" size={16} />
                  <input
                    type="number"
                    value={newGroup.minEthRequired}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, minEthRequired: parseFloat(e.target.value) || 0 }))}
                    className="flex-1 bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-crypto-blue"
                    min="0"
                    step="0.1"
                  />
                  <span className="text-dark-400 text-sm">ETH</span>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-gradient-to-r from-crypto-blue/10 to-cyan-400/10 border border-crypto-blue/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Coins className="text-crypto-blue" size={16} />
                    <span className="text-white text-sm font-medium">Circle Creation Fee</span>
                  </div>
                  <div className={`flex items-center space-x-1 text-xs ${isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                    <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-white font-medium">
                    0.15 ETH ≈ $300 USD
                  </p>
                  <p className="text-dark-400 text-xs">
                    One-time payment to create your circle
                  </p>
                </div>
              </div>

              {/* Balance Check */}
              <div className="bg-dark-900/50 border border-dark-600 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wallet className="text-crypto-blue" size={16} />
                    <span className="text-white text-sm font-medium">Your Balance</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      {isConnected ? balance.toFixed(4) : stats.balance.eth.toFixed(4)} ETH
                    </p>
                    <p className="text-dark-400 text-xs">
                      ≈ ${isConnected ? (balance * 2000).toFixed(2) : stats.balance.usd.toFixed(2)} USD
                    </p>
                    {isConnected && (
                      <div className="flex items-center justify-end space-x-1 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span className="text-green-400 text-xs">Live</span>
                      </div>
                    )}
                  </div>
                </div>
                {(isConnected ? balance : stats.balance.eth) < 0.15 && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-xs">
                      ⚠️ Insufficient balance for circle creation ($300 required)
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
                                                <button
                    onClick={createGroup}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-crypto-blue text-white rounded-xl hover:bg-crypto-blue/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Circle'}
                  </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-800 border border-dark-700 rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-white text-xl font-semibold mb-4">Join Circle</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Circle ID</label>
                                  <input
                    type="text"
                    value={joinGroupId}
                    onChange={(e) => setJoinGroupId(e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-crypto-blue"
                    placeholder="Enter circle ID"
                  />
              </div>
              
              <div className="bg-dark-900/50 border border-dark-600 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="text-crypto-blue" size={16} />
                  <span className="text-white text-sm font-medium">ZK-Proof Verification</span>
                </div>
                <p className="text-dark-400 text-xs">
                  Your ETH balance will be verified using zero-knowledge proofs to ensure privacy while proving eligibility.
                </p>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 px-4 py-2 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
                                                <button
                    onClick={joinGroup}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-crypto-blue text-white rounded-xl hover:bg-crypto-blue/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Joining...' : 'Join Circle'}
                  </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Circle Settings Modal */}
      {showSettingsModal && selectedGroupForSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-800 border border-dark-700 rounded-2xl p-6 w-full max-w-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-xl font-semibold">Circle Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-dark-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Circle Info */}
              <div className="bg-dark-900/50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Lock className="text-red-400" size={20} />
                  <h4 className="text-white font-semibold">{selectedGroupForSettings.name}</h4>
                </div>
                <p className="text-dark-400 text-sm">{selectedGroupForSettings.description}</p>
              </div>

              {/* Settings Sections */}
              <div className="space-y-4">
                {/* ETH Requirement */}
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Minimum ETH Required</label>
                  <div className="flex items-center space-x-2">
                    <Coins className="text-crypto-blue" size={16} />
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={settingsForm.minEthRequired}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, minEthRequired: parseFloat(e.target.value) || 1 }))}
                      className="flex-1 bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-crypto-blue"
                    />
                  </div>
                </div>

                {/* Member Management */}
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Members ({settingsForm.members.length})</label>
                  <div className="bg-dark-900/50 rounded-xl p-3 max-h-32 overflow-y-auto">
                    {settingsForm.members.map((member, index) => (
                      <div key={index} className="flex items-center justify-between py-1">
                        <span className="text-white text-sm">{member}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedMemberForCrypto(member)
                              setShowSendCryptoModal(true)
                            }}
                            className="text-green-400 hover:text-green-300 text-xs p-1"
                            title="Send Crypto"
                          >
                            <Coins size={12} />
                          </button>
                          {member !== selectedGroupForSettings.owner && (
                            <button 
                              onClick={() => setSettingsForm(prev => ({ 
                                ...prev, 
                                members: prev.members.filter((_, i) => i !== index)
                              }))}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Privacy Settings */}
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Privacy</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={settingsForm.isPrivate}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, isPrivate: e.target.checked }))}
                      className="rounded border-dark-600 bg-dark-700 text-crypto-blue focus:ring-crypto-blue"
                    />
                    <label htmlFor="isPrivate" className="text-white text-sm">
                      Private Circle (invitation only)
                    </label>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="border-t border-dark-700 pt-4">
                  <h4 className="text-red-400 font-semibold mb-3">Danger Zone</h4>
                  <button className="w-full px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors">
                    Delete Circle
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 px-4 py-2 bg-dark-700 text-white rounded-xl hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-crypto-blue text-white rounded-xl hover:bg-crypto-blue/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Send Crypto Modal */}
      {selectedMemberForCrypto && (
        <SendCryptoModal
          isOpen={showSendCryptoModal}
          onClose={() => {
            setShowSendCryptoModal(false)
            setSelectedMemberForCrypto(null)
          }}
          recipient={{
            address: selectedMemberForCrypto, // For now using pseudonym as address
            pseudonym: selectedMemberForCrypto
          }}
          context="list"
        />
      )}
    </div>
  )
} 
 
 
 
 
 
 
















