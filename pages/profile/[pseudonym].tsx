import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { ProfilePage } from '../../components/ProfilePage'
import { useUniversalWallet } from '../../hooks/useUniversalWallet'

export default function UserProfilePage() {
  const router = useRouter()
  const { pseudonym } = router.query
  const { account } = useUniversalWallet()
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  // Get current user's pseudonym
  useEffect(() => {
    if (account) {
      fetch(`/api/users/get?wallet_address=${account}`)
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            setCurrentUser(result.user.pseudonym)
          }
        })
        .catch(error => {
          console.error('Error fetching current user:', error)
        })
    }
  }, [account])

  if (!pseudonym || typeof pseudonym !== 'string') {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
          <p className="text-dark-400">The requested profile does not exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="max-w-4xl mx-auto p-6">
        <ProfilePage
          pseudonym={pseudonym}
          currentUser={currentUser}
          onBack={() => router.push('/app')}
          onEditProfile={currentUser === pseudonym ? () => router.push('/app?tab=profile&edit=true') : undefined}
        />
      </div>
    </div>
  )
} 