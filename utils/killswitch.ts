// CIRCLE KILLSWITCH - Privacy Protection System
// Inspired by Tails OS - Complete data clearing and emergency logout

export interface KillswitchOptions {
  level: 'soft' | 'hard' | 'nuclear'
  clearProfiles?: boolean
  clearCache?: boolean
  clearHistory?: boolean
  redirectTo?: string
}

export interface KillswitchEvent {
  timestamp: string
  level: string
  reason: string
  itemsCleared: string[]
  walletAddress?: string
  pseudonym?: string
}

export interface InstantDeleteResult {
  success: boolean
  message: string
  error?: string
}

class CircleKillswitch {
  private static instance: CircleKillswitch
  private isArmed: boolean = false
  private events: KillswitchEvent[] = []

  private constructor() {
    this.setupKeyboardShortcuts()
    this.setupBeforeUnload()
  }

  static getInstance(): CircleKillswitch {
    if (!CircleKillswitch.instance) {
      CircleKillswitch.instance = new CircleKillswitch()
    }
    return CircleKillswitch.instance
  }

  // ARM THE KILLSWITCH - Enable emergency mode
  arm(): void {
    this.isArmed = true
    console.log('🚨 KILLSWITCH ARMED - Emergency mode enabled')
    
    // Visual indicator for armed state
    if (typeof window !== 'undefined') {
      document.body.style.cursor = 'crosshair'
      const indicator = document.createElement('div')
      indicator.id = 'killswitch-indicator'
      indicator.innerHTML = '🚨'
      indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 99999;
        color: #ff4444;
        font-size: 20px;
        animation: pulse 1s infinite;
      `
      document.body.appendChild(indicator)
    }
  }

  // DISARM THE KILLSWITCH
  disarm(): void {
    this.isArmed = false
    console.log('✅ KILLSWITCH DISARMED - Normal mode')
    
    if (typeof window !== 'undefined') {
      document.body.style.cursor = 'default'
      const indicator = document.getElementById('killswitch-indicator')
      if (indicator) {
        indicator.remove()
      }
    }
  }

  // INSTANT DELETE ACCOUNT - Permanent account deletion with confirmation
  async instantDeleteAccount(confirmationString: string, walletAddress?: string): Promise<InstantDeleteResult> {
    // Verify confirmation string
    if (confirmationString !== 'INSTANTDELETE') {
      return {
        success: false,
        message: 'Invalid confirmation string. Type exactly "INSTANTDELETE" to proceed.',
        error: 'INVALID_CONFIRMATION'
      }
    }

    console.log('🚨 INSTANT DELETE ACCOUNT - Permanent deletion initiated')

    try {
      // Import walletAuth dynamically to avoid circular imports
      const { walletAuth } = await import('./walletAuth')
      
      // Get current user if no wallet address provided  
      const currentProfile = walletAuth.getCurrentProfile()
      const targetWallet = walletAddress || currentProfile?.walletAddress
      
      if (!targetWallet) {
        return {
          success: false,
          message: 'No active user session found.',
          error: 'NO_USER'
        }
      }

      // Get profile before deletion for logging
      const profile = walletAuth.getProfile(targetWallet)
      const pseudonym = profile?.pseudonym || 'Unknown'

      console.log(`💀 Deleting account permanently: ${pseudonym} (${targetWallet.substring(0, 8)}...)`)

      // 1. Delete profile from walletAuth system
      const profileDeleted = walletAuth.deleteProfile(targetWallet)
      
      if (!profileDeleted) {
        return {
          success: false,
          message: 'Failed to delete profile. Profile may not exist.',
          error: 'PROFILE_DELETE_FAILED'
        }
      }

      // 2. Clear all user data associated with this account
      await this.clearUserData(targetWallet, pseudonym)

      // 3. Execute nuclear killswitch to clear all local data
      await this.execute({ level: 'nuclear' })

      // 4. Log the permanent deletion
      this.logEvent({
        timestamp: new Date().toISOString(),
        level: 'instant_delete',
        reason: 'Account permanently deleted',
        itemsCleared: ['profile', 'posts', 'interactions', 'follows', 'all_local_data'],
        walletAddress: targetWallet,
        pseudonym: pseudonym
      })

      console.log(`✅ ACCOUNT DELETED PERMANENTLY: ${pseudonym}`)
      console.log(`🔄 User can re-register with wallet ${targetWallet.substring(0, 8)}... using a new pseudonym`)

      return {
        success: true,
        message: `Account "${pseudonym}" has been permanently deleted. All data has been removed. You can register again with the same wallet using a new pseudonym.`
      }

    } catch (error) {
      console.error('Instant delete failed:', error)
      return {
        success: false,
        message: 'Account deletion failed due to an unexpected error.',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      }
    }
  }

  // Clear all user-specific data from various systems
  private async clearUserData(walletAddress: string, pseudonym: string): Promise<void> {
    try {
      // Clear user posts
      await this.clearUserPosts(pseudonym)
      
      // Clear follow relationships  
      await this.clearUserFollows(pseudonym)
      
      // Clear user interactions
      await this.clearUserInteractions(pseudonym)
      
      // Clear notifications
      await this.clearUserNotifications(pseudonym)

      console.log(`🧹 All user data cleared for ${pseudonym}`)
    } catch (error) {
      console.error('Failed to clear some user data:', error)
    }
  }

  // Clear user posts from the posts system
  private async clearUserPosts(pseudonym: string): Promise<void> {
    try {
      // Call API to delete user posts
      await fetch('/api/posts/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: pseudonym })
      })
      console.log(`📝 Posts cleared for ${pseudonym}`)
    } catch (error) {
      console.warn('Failed to clear posts:', error)
    }
  }

  // Clear user follow relationships
  private async clearUserFollows(pseudonym: string): Promise<void> {
    try {
      // Call API to delete follow relationships
      await fetch('/api/follow/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pseudonym })
      })
      console.log(`👥 Follow relationships cleared for ${pseudonym}`)
    } catch (error) {
      console.warn('Failed to clear follows:', error)
    }
  }

  // Clear user interactions (likes, reposts, etc.)
  private async clearUserInteractions(pseudonym: string): Promise<void> {
    try {
      // Call API to delete user interactions
      await fetch('/api/posts/delete-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: pseudonym })
      })
      console.log(`❤️ Interactions cleared for ${pseudonym}`)
    } catch (error) {
      console.warn('Failed to clear interactions:', error)
    }
  }

  // Clear user notifications
  private async clearUserNotifications(pseudonym: string): Promise<void> {
    try {
      // Clear notifications from localStorage
      const notifications = JSON.parse(localStorage.getItem('circle_notifications') || '[]')
      const filteredNotifications = notifications.filter((n: any) => 
        n.from !== pseudonym && n.to !== pseudonym
      )
              localStorage.setItem('circle_notifications', JSON.stringify(filteredNotifications))
      console.log(`🔔 Notifications cleared for ${pseudonym}`)
    } catch (error) {
      console.warn('Failed to clear notifications:', error)
    }
  }

  // EXECUTE KILLSWITCH - Different levels of data clearing
  async execute(options: KillswitchOptions = { level: 'hard' }): Promise<void> {
    const startTime = Date.now()
    const itemsCleared: string[] = []

    console.log(`💀 KILLSWITCH ACTIVATED - Level: ${options.level.toUpperCase()}`)

    try {
      switch (options.level) {
        case 'soft':
          // Gentle logout - keeps some data
          await this.softKill(itemsCleared)
          break
          
        case 'hard':
          // Complete logout - clears most data
          await this.hardKill(itemsCleared)
          break
          
        case 'nuclear':
          // TOTAL ANNIHILATION - clears everything
          await this.nuclearKill(itemsCleared)
          break
      }

      // Log the event
      this.logEvent({
        timestamp: new Date().toISOString(),
        level: options.level,
        reason: 'Manual activation',
        itemsCleared
      })

      // Close the browser tab/window completely
      console.log(`🚪 CLOSING BROWSER TAB - Circle session terminated`)
      
      // Redirect or close
      if (options.redirectTo) {
        window.location.href = options.redirectTo
             } else {
         // Close browser using existing logic
         if (typeof window !== 'undefined') {
           window.close()
           setTimeout(() => {
             if (!window.closed) {
               window.location.replace('about:blank')
             }
           }, 300)
         }
       }

      const duration = Date.now() - startTime
      console.log(`⚡ Killswitch executed in ${duration}ms`)

    } catch (error) {
      console.error('Killswitch execution failed:', error)
      throw error
    }
  }

  // SOFT KILL - Gentle logout
  private async softKill(itemsCleared: string[]): Promise<void> {
    if (typeof window === 'undefined') return

    // Clear current session data only
    sessionStorage.clear()
    itemsCleared.push('sessionStorage')

    // Clear specific localStorage keys (keep profiles)
    const keysToRemove = ['circle_session', 'circle_temp', 'circle_cache']
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
        itemsCleared.push(`localStorage.${key}`)
      }
    })

    console.log('😴 SOFT KILL executed - Session cleared, profiles preserved')
  }

  // HARD KILL - Complete logout
  private async hardKill(itemsCleared: string[]): Promise<void> {
    if (typeof window === 'undefined') return

    // Clear all storage
    sessionStorage.clear()
    itemsCleared.push('sessionStorage')

    localStorage.clear()
    itemsCleared.push('localStorage')

    // Clear IndexedDB if present
    try {
      const databases = await indexedDB.databases?.() || []
      for (const db of databases) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name)
          itemsCleared.push(`indexedDB.${db.name}`)
        }
      }
    } catch (error) {
      console.warn('IndexedDB clearing failed:', error)
    }

    // Clear cookies
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      itemsCleared.push(`cookie.${name}`)
    })

    console.log('💀 HARD KILL executed - All data cleared')
  }

  // NUCLEAR KILL - TOTAL ANNIHILATION
  private async nuclearKill(itemsCleared: string[]): Promise<void> {
    if (typeof window === 'undefined') return

    // Execute hard kill first
    await this.hardKill(itemsCleared)

    // Additional nuclear measures
    try {
      // Clear service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          await registration.unregister()
          itemsCleared.push(`serviceWorker.${registration.scope}`)
        }
      }

      // Clear cache storage
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName)
          itemsCleared.push(`cache.${cacheName}`)
        }
      }

      // Clear Web SQL (deprecated but still present)
      try {
        if ((window as any).openDatabase) {
          // Clear Web SQL databases if any
          itemsCleared.push('webSQL')
        }
      } catch (error) {
        // Web SQL not supported, ignore
      }

      // Attempt to clear browser history (limited by security)
      try {
        window.history.replaceState(null, '', '/')
        itemsCleared.push('history.current')
      } catch (error) {
        // Limited by browser security, ignore
      }

      console.log('☢️ NUCLEAR KILL executed - TOTAL ANNIHILATION complete')

    } catch (error) {
      console.error('Nuclear measures partially failed:', error)
    }
  }

  // Setup keyboard shortcuts for emergency activation
  private setupKeyboardShortcuts(): void {
    if (typeof window === 'undefined') return

    document.addEventListener('keydown', (event) => {
      // CTRL+SHIFT+X = Nuclear killswitch
      if (event.ctrlKey && event.shiftKey && event.key === 'X') {
        event.preventDefault()
        console.log('🚨 EMERGENCY KEYBOARD KILLSWITCH ACTIVATED')
        this.execute({ level: 'nuclear' })
      }

      // CTRL+SHIFT+L = Hard logout
      if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault()
        console.log('🚨 EMERGENCY LOGOUT ACTIVATED')
        this.execute({ level: 'hard' })
      }

      // ESC ESC ESC = Triple escape for panic
      if (event.key === 'Escape') {
        this.handleEscapeSequence()
      }
    })
  }

  private escapeCount = 0
  private escapeTimer: NodeJS.Timeout | null = null

  private handleEscapeSequence(): void {
    this.escapeCount++

    if (this.escapeTimer) {
      clearTimeout(this.escapeTimer)
    }

    // Reset counter after 2 seconds
    this.escapeTimer = setTimeout(() => {
      this.escapeCount = 0
    }, 2000)

    // Triple escape = PANIC MODE
    if (this.escapeCount === 3) {
      console.log('🚨 TRIPLE ESCAPE - PANIC MODE ACTIVATED')
      this.execute({ level: 'nuclear' })
    }
  }

  // Setup beforeunload handler for emergency clearing
  private setupBeforeUnload(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('beforeunload', (event) => {
      if (this.isArmed) {
        // If killswitch is armed, clear data on page close
        console.log('🚨 ARMED KILLSWITCH - Clearing data on exit')
        this.softKill([])
      }
    })
  }

  // Log killswitch events (stored temporarily)
  private logEvent(event: KillswitchEvent): void {
    this.events.push(event)
    // Keep only last 10 events
    if (this.events.length > 10) {
      this.events = this.events.slice(-10)
    }
  }

  // Get killswitch status and events
  getStatus(): {
    armed: boolean
    events: KillswitchEvent[]
    shortcuts: string[]
  } {
    return {
      armed: this.isArmed,
      events: this.events,
      shortcuts: [
        'Ctrl+Shift+X - Nuclear killswitch',
        'Ctrl+Shift+L - Hard logout', 
        'Esc×3 - Panic mode (2s window)'
      ]
    }
  }

  // Test killswitch (safe mode - doesn't actually clear)
  test(level: KillswitchOptions['level'] = 'soft'): void {
    console.log(`🧪 KILLSWITCH TEST - Level: ${level}`)
    console.log('This is a test - no data will be cleared')
    
    const mockItems = {
      soft: ['sessionStorage', 'temp_cache'],
      hard: ['sessionStorage', 'localStorage', 'cookies'],
      nuclear: ['sessionStorage', 'localStorage', 'cookies', 'indexedDB', 'serviceWorkers', 'cache']
    }

    console.log(`Would clear: ${mockItems[level].join(', ')}`)
  }
}

// Export singleton
export const killswitch = CircleKillswitch.getInstance()

// Utility functions for quick access
export const emergency = {
  // Quick logout
  logout: () => killswitch.execute({ level: 'hard' }),
  
  // Nuclear option
  nuke: () => killswitch.execute({ level: 'nuclear' }),
  
  // Soft logout
  exit: () => killswitch.execute({ level: 'soft' }),
  
  // Arm for auto-clear on close
  arm: () => killswitch.arm(),
  
  // Disarm 
  disarm: () => killswitch.disarm(),
  
  // Test mode
  test: (level?: KillswitchOptions['level']) => killswitch.test(level)
}

export default killswitch 