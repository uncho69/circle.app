import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Save, 
  X, 
  Camera, 
  Palette,
  MapPin,
  Link as LinkIcon,
  Twitter,
  Github,
  MessageCircle,
  Monitor
} from 'lucide-react'
import { useProfile, ProfileUpdateData } from '../hooks/useProfile'
import { PublicProfile } from '../pages/api/profile/get'

export interface EditProfileProps {
  onSave?: (profile: PublicProfile) => void
  onCancel?: () => void
  className?: string
}

export const EditProfile: React.FC<EditProfileProps> = ({ 
  onSave, 
  onCancel,
  className = '' 
}) => {
  const { profile, updateProfile, updating, generateAvatar } = useProfile()
  
  const [formData, setFormData] = useState<ProfileUpdateData>({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    bannerColor: '#4ECDC4',
    socialLinks: {
      twitter: '',
      github: '',
      telegram: '',
      discord: ''
    }
  })

  const [selectedBannerColor, setSelectedBannerColor] = useState('#4ECDC4')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || profile.pseudonym,
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        bannerColor: profile.bannerColor || '#4ECDC4',
        socialLinks: {
          twitter: profile.socialLinks?.twitter || '',
          github: profile.socialLinks?.github || '',
          telegram: profile.socialLinks?.telegram || '',
          discord: profile.socialLinks?.discord || ''
        }
      })
      setSelectedBannerColor(profile.bannerColor || '#4ECDC4')
    }
  }, [profile])

  const bannerColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#AED6F1', '#D2B4DE', '#F9E79F'
  ]

  const handleInputChange = (field: keyof ProfileUpdateData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleSocialLinkChange = (platform: keyof NonNullable<ProfileUpdateData['socialLinks']>, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.displayName?.trim()) {
      newErrors.displayName = 'Display name is required'
    } else if (formData.displayName.length > 50) {
      newErrors.displayName = 'Display name must be 50 characters or less'
    }
    
    if (formData.bio && formData.bio.length > 280) {
      newErrors.bio = 'Bio must be 280 characters or less'
    }
    
    if (formData.website && formData.website.trim()) {
      try {
        new URL(formData.website)
      } catch {
        newErrors.website = 'Please enter a valid URL'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    const success = await updateProfile({
      ...formData,
      bannerColor: selectedBannerColor
    })

    if (success && onSave && profile) {
      onSave(profile)
    }
  }

  if (!profile) {
    return (
      <div className={`${className}`}>
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 text-center">
          <p className="text-dark-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  const avatarGradient = generateAvatar(profile.pseudonym)
  const remainingBioChars = 280 - (formData.bio?.length || 0)

  return (
    <div className={`${className}`}>
      <motion.div
        className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
          <div className="flex items-center space-x-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-dark-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={updating}
              className="flex items-center space-x-2 px-6 py-2 bg-crypto-blue text-white rounded-xl hover:bg-crypto-blue/90 transition-colors disabled:opacity-50"
            >
              {updating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Banner Preview */}
        <div 
          className="h-48 w-full relative"
          style={{ backgroundColor: selectedBannerColor }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
          <div className="absolute bottom-4 right-4">
            <div className="bg-black/70 backdrop-blur rounded-xl p-2">
              <Palette className="text-white" size={20} />
            </div>
          </div>
        </div>

        {/* Banner Color Picker */}
        <div className="p-6 border-b border-dark-700">
          <h3 className="text-white font-semibold mb-4">Banner Color</h3>
          <div className="grid grid-cols-5 gap-3">
            {bannerColors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedBannerColor(color)}
                className={`w-12 h-12 rounded-xl transition-all ${
                  selectedBannerColor === color
                    ? 'ring-2 ring-crypto-blue ring-offset-2 ring-offset-dark-800'
                    : 'hover:scale-110'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Profile Form */}
        <div className="p-6 space-y-6">
          {/* Avatar Preview */}
          <div className="flex items-center justify-center -mt-24 mb-12">
            <div 
              className={`w-32 h-32 rounded-full border-4 border-dark-800 bg-gradient-to-r ${avatarGradient} flex items-center justify-center relative`}
            >
              <span className="text-white font-bold text-4xl">
                {(formData.displayName || profile.pseudonym).charAt(0).toUpperCase()}
              </span>
              <div className="absolute -bottom-2 -right-2 bg-dark-700 p-2 rounded-full border-2 border-dark-800">
                <Camera className="text-dark-400" size={16} />
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-white font-medium mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={formData.displayName || ''}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-crypto-blue transition-colors"
              placeholder="Your display name"
              maxLength={50}
            />
            {errors.displayName && (
              <p className="text-red-400 text-sm mt-1">{errors.displayName}</p>
            )}
            <p className="text-dark-400 text-sm mt-1">
              {(formData.displayName?.length || 0)}/50
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-white font-medium mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-crypto-blue transition-colors resize-none"
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={280}
            />
            {errors.bio && (
              <p className="text-red-400 text-sm mt-1">{errors.bio}</p>
            )}
            <p className={`text-sm mt-1 ${
              remainingBioChars < 20 ? 'text-red-400' : 'text-dark-400'
            }`}>
              {remainingBioChars} characters remaining
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-white font-medium mb-2">
              <MapPin size={18} className="inline mr-2" />
              Location
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-crypto-blue transition-colors"
              placeholder="Where are you based?"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-white font-medium mb-2">
              <LinkIcon size={18} className="inline mr-2" />
              Website
            </label>
            <input
              type="url"
              value={formData.website || ''}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-crypto-blue transition-colors"
              placeholder="https://your-website.com"
            />
            {errors.website && (
              <p className="text-red-400 text-sm mt-1">{errors.website}</p>
            )}
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-white font-medium mb-4">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Twitter */}
              <div>
                <label className="block text-dark-400 text-sm mb-2">
                  <Twitter size={16} className="inline mr-2" />
                  Twitter
                </label>
                <input
                  type="text"
                  value={formData.socialLinks?.twitter || ''}
                  onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                  className="w-full bg-dark-700 border border-dark-600 text-white px-4 py-2 rounded-xl focus:outline-none focus:border-crypto-blue transition-colors"
                  placeholder="@username"
                />
              </div>

              {/* GitHub */}
              <div>
                <label className="block text-dark-400 text-sm mb-2">
                  <Github size={16} className="inline mr-2" />
                  GitHub
                </label>
                <input
                  type="text"
                  value={formData.socialLinks?.github || ''}
                  onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                  className="w-full bg-dark-700 border border-dark-600 text-white px-4 py-2 rounded-xl focus:outline-none focus:border-crypto-blue transition-colors"
                  placeholder="username"
                />
              </div>

              {/* Telegram */}
              <div>
                <label className="block text-dark-400 text-sm mb-2">
                  <MessageCircle size={16} className="inline mr-2" />
                  Telegram
                </label>
                <input
                  type="text"
                  value={formData.socialLinks?.telegram || ''}
                  onChange={(e) => handleSocialLinkChange('telegram', e.target.value)}
                  className="w-full bg-dark-700 border border-dark-600 text-white px-4 py-2 rounded-xl focus:outline-none focus:border-crypto-blue transition-colors"
                  placeholder="@username"
                />
              </div>

              {/* Discord */}
              <div>
                <label className="block text-dark-400 text-sm mb-2">
                  <Monitor size={16} className="inline mr-2" />
                  Discord
                </label>
                <input
                  type="text"
                  value={formData.socialLinks?.discord || ''}
                  onChange={(e) => handleSocialLinkChange('discord', e.target.value)}
                  className="w-full bg-dark-700 border border-dark-600 text-white px-4 py-2 rounded-xl focus:outline-none focus:border-crypto-blue transition-colors"
                  placeholder="username#1234"
                />
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="bg-crypto-blue/10 border border-crypto-blue/20 rounded-xl p-4">
            <h4 className="text-crypto-blue font-semibold mb-2">Privacy Note</h4>
            <p className="text-crypto-blue/80 text-sm">
              Your profile data is stored locally and linked to your wallet. 
              Only public information will be visible to other users.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 