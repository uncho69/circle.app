import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize database and Tor on client side if needed
    if (typeof window !== 'undefined') {
      console.log('🚀 Circle app starting...')
      
      // Initialize Tor connection in background
      fetch('/api/tor/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_connection'
        })
      }).then(response => response.json())
        .then(result => {
          if (result.success) {
            console.log('🔒 Tor connection established')
          } else {
            console.log('⚠️ Tor connection failed:', result.error)
          }
        })
        .catch(error => {
          console.log('⚠️ Tor initialization error:', error)
        })
    }
  }, [])

  return <Component {...pageProps} />
} 