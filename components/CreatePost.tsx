import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Image as ImageIcon, 
  X, 
  Globe, 
  Lock, 
  Users, 
  Smile, 
  MapPin, 
  Calendar,
  Shield,
  Zap
} from 'lucide-react'
import { walletAuth } from '../utils/walletAuth'
import { Post } from '../pages/api/posts/create'
import { useProfile } from '../hooks/useProfile'

export interface CreatePostProps {
  onPostCreated?: (post: Post) => void
  replyTo?: string // ID of post being replied to
  parentPost?: Post // The post being replied to
  onCancel?: () => void // Callback when canceling reply
  className?: string
}

export const CreatePost: React.FC<CreatePostProps> = ({ 
  onPostCreated, 
  replyTo, 
  parentPost, 
  onCancel,
  className = ''
}) => {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public')
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const { generateAvatar } = useProfile()
  const isReply = !!replyTo && !!parentPost
  const characterLimit = 500
  const remainingChars = characterLimit - content.length

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
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

  const createPost = async (postData: any) => {
    try {
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to create post')
      }

      return result.post
    } catch (error) {
      console.error('Error creating post:', error)
      setError(error instanceof Error ? error.message : 'Failed to create post')
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() && !selectedImage) return

    setIsSubmitting(true)
    setError('')

    try {
      const currentProfile = walletAuth.getCurrentProfile()
      if (!currentProfile) {
        throw new Error('No authenticated user found')
      }

      // First, sync user to database if needed
      try {
        await fetch('/api/users/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: currentProfile.walletAddress,
            pseudonym: currentProfile.pseudonym,
            displayName: currentProfile.displayName,
            bio: currentProfile.bio
          })
        })
      } catch (syncError) {
        console.warn('User sync failed, continuing with post creation:', syncError)
      }

      const postData = {
        content: content.trim(),
        author: currentProfile.pseudonym,
        visibility: visibility,
        image: selectedImage,
        replyTo: replyTo // Include replyTo if this is a reply
      }

      const newPost = await createPost(postData)
      
      if (newPost) {
        setContent('')
        setSelectedImage(null)
        setImageFile(null)
        setIsExpanded(false)
        setVisibility('public')
        
        if (onPostCreated) {
          onPostCreated(newPost)
        }

        if (isReply && onCancel) {
          onCancel()
        }
      }
    } catch (error) {
      console.error('Error creating post:', error)
      setError(error instanceof Error ? error.message : 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const visibilityOptions = [
    { value: 'public', icon: Globe, label: 'Public', desc: 'Anyone can see this post' },
    { value: 'followers', icon: Users, label: 'Followers', desc: 'Only your followers can see' },
    { value: 'private', icon: Lock, label: 'Private', desc: 'Only you can see this post' }
  ]

  const selectedVisibility = visibilityOptions.find(opt => opt.value === visibility)

  return (
    <motion.div 
      className={`bg-dark-800 border border-dark-700 rounded-2xl p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Reply Header */}
        {isReply && parentPost && (
          <div className="flex items-center space-x-2 text-dark-400 text-sm">
            <span>Replying to</span>
            <span className="text-blue-400 font-medium">{parentPost.author}</span>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="ml-auto text-dark-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Main Text Area */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder={isReply ? "Write your reply..." : "What's happening on the decentralized web?"}
            className="w-full bg-transparent text-white placeholder-dark-400 resize-none border-0 focus:outline-none text-lg leading-relaxed"
            rows={isExpanded ? 4 : 2}
            maxLength={characterLimit}
          />
          
          {/* Character Counter */}
          <AnimatePresence>
            {(isExpanded || content.length > 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute bottom-2 right-2"
              >
                <div className={`text-sm font-medium ${
                  remainingChars < 20 
                    ? 'text-red-400' 
                    : remainingChars < 50 
                    ? 'text-yellow-400' 
                    : 'text-dark-400'
                }`}>
                  {remainingChars}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Image Preview */}
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative"
          >
            <div className="relative inline-block">
              <img 
                src={selectedImage} 
                alt="Preview" 
                className="max-w-full max-h-64 rounded-lg"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-dark-900 bg-opacity-75 hover:bg-opacity-100 rounded-full p-1 transition-all"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm bg-red-900 bg-opacity-20 p-3 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-dark-700">
          {/* Left Actions */}
          <div className="flex items-center space-x-2">
            {/* Image Upload */}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="p-2 text-dark-400 hover:text-blue-400 transition-colors rounded-full hover:bg-blue-900 hover:bg-opacity-20">
                <ImageIcon size={20} />
              </div>
            </label>

            {/* Visibility Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                className="flex items-center space-x-1 p-2 text-dark-400 hover:text-white transition-colors rounded-full hover:bg-dark-700"
              >
                {selectedVisibility?.icon && <selectedVisibility.icon size={16} />}
                <span className="text-sm">{selectedVisibility?.label}</span>
              </button>

              <AnimatePresence>
                {showVisibilityMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-10 min-w-48"
                  >
                    {visibilityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setVisibility(option.value as any)
                          setShowVisibilityMenu(false)
                        }}
                        className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-dark-700 transition-colors ${
                          visibility === option.value ? 'text-blue-400' : 'text-dark-300'
                        }`}
                      >
                        <option.icon size={16} />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-dark-400">{option.desc}</div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !selectedImage)}
            className={`flex items-center space-x-2 px-6 py-2 rounded-full font-medium transition-all ${
              isSubmitting || (!content.trim() && !selectedImage)
                ? 'bg-dark-700 text-dark-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
            }`}
            whileHover={!isSubmitting && (content.trim() || selectedImage) ? { scale: 1.05 } : {}}
            whileTap={!isSubmitting && (content.trim() || selectedImage) ? { scale: 0.95 } : {}}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>{isReply ? 'Reply' : 'Broadcast'}</span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  )
} 