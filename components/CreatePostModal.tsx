import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Globe, 
  Users, 
  Lock, 
  ImagePlus, 
  Smile,
  MapPin,
  Calendar,
  Zap,
  Shield,
  Eye,
  Send,
  Hexagon,
  Cpu,
  Network
} from 'lucide-react'
import { usePosts } from '../hooks/usePosts'
import { walletAuth } from '../utils/walletAuth'

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onPostCreated?: (post: any) => void
}

type PostVisibility = 'public' | 'followers' | 'private'

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ 
  isOpen, 
  onClose, 
  onPostCreated 
}) => {
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<PostVisibility>('public')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { createPost, loading } = usePosts()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImageFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || loading) return

    // Get current user profile
    const currentProfile = walletAuth.getCurrentProfile()
    if (!currentProfile) {
      alert('Please connect your wallet to post')
      return
    }

    const postData = {
      content: content.trim(),
      author: currentProfile.pseudonym,
      visibility,
      image: selectedImage || undefined
    }

    const newPost = await createPost(postData)
    
    if (newPost) {
      setContent('')
      setSelectedImage(null)
      setImageFile(null)
      onPostCreated?.(newPost)
      onClose()
      console.log('✅ Post broadcasted to the network!')
    }
  }

  const visibilityOptions = [
    { 
      value: 'public', 
      icon: Globe, 
      label: 'Public Broadcast', 
      desc: 'Broadcast to the entire decentralized network',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      value: 'followers', 
      icon: Users, 
      label: 'Network Followers', 
      desc: 'Share with your trusted network connections',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      value: 'private', 
      icon: Lock, 
      label: 'Private Node', 
      desc: 'Store locally on your personal node',
      color: 'from-green-500 to-emerald-500'
    }
  ]

  const currentProfile = walletAuth.getCurrentProfile()
  const avatarGradient = currentProfile 
    ? `bg-gradient-to-br from-${['blue', 'purple', 'green', 'orange', 'pink'][currentProfile.pseudonym.length % 5]}-400 to-${['purple', 'blue', 'orange', 'pink', 'green'][currentProfile.pseudonym.length % 5]}-600`
    : 'bg-gradient-to-br from-blue-400 to-purple-600'

  const selectedVisibility = visibilityOptions.find(opt => opt.value === visibility)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-dark-900 rounded-3xl border border-dark-600/50 w-full max-w-2xl mx-4 shadow-2xl relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decentra-style header with gradient border */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-t-3xl" />
            <div className="relative flex items-center justify-between p-6 border-b border-dark-600/50">
              <div className="flex items-center space-x-4">
                <button
                  onClick={onClose}
                  className="p-2 text-dark-400 hover:text-white hover:bg-dark-800/50 rounded-xl transition-all duration-200"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <Zap size={16} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Broadcast to Network</h2>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || loading}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send size={16} />
                <span>{loading ? 'Broadcasting...' : 'Broadcast'}</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="flex space-x-4">
              {/* Avatar with Decentra styling */}
              <div className="relative">
                <div className={`w-14 h-14 rounded-2xl ${avatarGradient} flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg`}>
                  {currentProfile?.pseudonym?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>

              {/* Input Area */}
              <div className="flex-1 space-y-4">
                {/* Visibility Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                    className="flex items-center space-x-3 px-4 py-3 bg-dark-800/50 border border-dark-600/50 rounded-xl hover:border-cyan-500/50 transition-all duration-200"
                  >
                                         <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${selectedVisibility?.color} flex items-center justify-center`}>
                       {selectedVisibility?.icon && <selectedVisibility.icon size={14} className="text-white" />}
                     </div>
                    <span className="text-white font-medium">{selectedVisibility?.label}</span>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                  </button>

                  {/* Visibility Menu */}
                  <AnimatePresence>
                    {showVisibilityMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 mt-2 w-80 bg-dark-800 border border-dark-600 rounded-xl shadow-xl z-10"
                      >
                        {visibilityOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setVisibility(option.value as PostVisibility)
                              setShowVisibilityMenu(false)
                            }}
                            className="w-full flex items-start space-x-3 p-4 hover:bg-dark-700/50 transition-colors rounded-lg"
                          >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center flex-shrink-0`}>
                              <option.icon size={16} className="text-white" />
                            </div>
                            <div className="text-left">
                              <div className="text-white font-medium">{option.label}</div>
                              <div className="text-dark-400 text-sm mt-1">{option.desc}</div>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Text Input with Decentra styling */}
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your thoughts with the decentralized network..."
                    className="w-full bg-dark-800/30 border border-dark-600/50 rounded-xl p-4 text-white text-lg placeholder-dark-400 resize-none focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-200 min-h-[140px]"
                    maxLength={280}
                    autoFocus
                  />
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                      <Network size={12} className="text-cyan-400" />
                    </div>
                  </div>
                </div>

                {/* Image Preview with Decentra styling */}
                {selectedImage && (
                  <div className="relative group">
                    <div className="relative rounded-xl overflow-hidden border border-dark-600/50">
                      <img
                        src={selectedImage}
                        alt="Post content"
                        className="max-w-full h-auto"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-3 right-3 p-2 bg-dark-900/90 text-white rounded-lg hover:bg-red-500/90 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Network Status */}
                <div className="bg-gradient-to-r from-dark-800/50 to-dark-700/50 border border-dark-600/30 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Shield size={14} className="text-white" />
                    </div>
                    <span className="text-white font-medium">Network Status</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-green-400">Connected to Tor</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                      <span className="text-cyan-400">ZK-Proof Ready</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full" />
                      <span className="text-purple-400">Decentralized Storage</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions with Decentra styling */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-dark-600/50">
              <div className="flex items-center space-x-3">
                {/* Image Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-dark-800/50 border border-dark-600/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 rounded-xl transition-all duration-200"
                  title="Add media"
                >
                  <ImagePlus size={18} />
                </button>

                {/* Decentra-specific action buttons */}
                <button
                  type="button"
                  className="p-3 bg-dark-800/50 border border-dark-600/50 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 rounded-xl transition-all duration-200"
                  title="Add ZK-Proof"
                  disabled
                >
                  <Hexagon size={18} />
                </button>

                <button
                  type="button"
                  className="p-3 bg-dark-800/50 border border-dark-600/50 text-green-400 hover:bg-green-500/10 hover:border-green-500/50 rounded-xl transition-all duration-200"
                  title="Add location"
                  disabled
                >
                  <MapPin size={18} />
                </button>

                <button
                  type="button"
                  className="p-3 bg-dark-800/50 border border-dark-600/50 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50 rounded-xl transition-all duration-200"
                  title="Schedule broadcast"
                  disabled
                >
                  <Calendar size={18} />
                </button>
              </div>

              {/* Character Count with Decentra styling */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="relative w-8 h-8">
                    <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-dark-600"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${(content.length / 280) * 62.83} 62.83`}
                        className={`${
                          content.length > 250 
                            ? content.length > 270 
                              ? 'text-red-400' 
                              : 'text-yellow-400'
                            : 'text-cyan-400'
                        }`}
                      />
                    </svg>
                  </div>
                  <span className={`text-sm font-medium ${
                    content.length > 270 ? 'text-red-400' : 'text-dark-400'
                  }`}>
                    {280 - content.length}
                  </span>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
} 