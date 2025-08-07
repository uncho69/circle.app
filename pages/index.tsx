import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

// Typewriter Effect Component
const TypewriterText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, 100) // Speed of typing

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text])

  return (
    <div className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </div>
  )
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <motion.div 
      className="min-h-screen bg-black relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 py-20">
        
        {/* Minimalist Hero Section */}
        <div className="text-center max-w-4xl mx-auto">
          {/* Circle Logo */}
          <motion.div
            className="mb-8 flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <Image
              src="/circle.png"
              alt="Circle Logo"
              width={120}
              height={120}
              className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40"
              priority
            />
          </motion.div>

          {/* Main headline - CIRCLE */}
          <motion.h1 
            className="text-6xl md:text-8xl lg:text-9xl font-extralight text-cyan-400 mb-8 tracking-tighter leading-[0.85]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          >
            CIRCLE
          </motion.h1>

          {/* Typewriter Effect */}
          <motion.div
            className="mb-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            <TypewriterText 
              text="A fully private decentralized social network."
              className="text-xl md:text-2xl text-gray-400 font-light text-center"
            />
          </motion.div>

          {/* ENTER THE CIRCLE Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <Link href="/auth">
              <motion.button
                className="group relative inline-flex items-center justify-center px-12 py-6 text-2xl font-light text-white border border-gray-600 hover:border-cyan-400 transition-all duration-500 overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Button background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Button content */}
                <span className="relative z-10 tracking-widest uppercase">
                  ENTER THE CIRCLE
                </span>
                
                {/* Arrow icon */}
                <ArrowRight className="ml-4 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
} 