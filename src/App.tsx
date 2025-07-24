import { useState, useEffect, useCallback } from 'react'
import { blink } from './blink/client'
import { SidebarProvider } from './components/ui/sidebar'
import { AppSidebar } from './components/layout/AppSidebar'
import { Dashboard } from './components/pages/Dashboard'
import { SoftwareCatalog } from './components/pages/SoftwareCatalog'
import { Requests } from './components/pages/Requests'
import { Analytics } from './components/pages/Analytics'
import { Settings } from './components/pages/Settings'
import { Onboarding } from './components/pages/Onboarding'
import { Toaster } from './components/ui/toaster'
import { User } from './types'

type Page = 'dashboard' | 'catalog' | 'requests' | 'analytics' | 'settings' | 'onboarding'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [isOnboarded, setIsOnboarded] = useState(false)

  const checkOnboardingStatus = useCallback(async (userId: string) => {
    try {
      // Check if user has completed onboarding by looking for company
      const companies = await blink.db.companies.list({
        where: { id: userId },
        limit: 1
      })
      
      if (companies.length === 0) {
        setCurrentPage('onboarding')
        setIsOnboarded(false)
      } else {
        setIsOnboarded(true)
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      setCurrentPage('onboarding')
      setIsOnboarded(false)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
      
      // Check if user needs onboarding
      if (state.user && !state.isLoading) {
        checkOnboardingStatus(state.user.id)
      }
    })
    return unsubscribe
  }, [checkOnboardingStatus])

  const handleOnboardingComplete = () => {
    setIsOnboarded(true)
    setCurrentPage('dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">LogicielHub</h1>
            <p className="text-muted-foreground">
              Gérez et optimisez votre parc logiciel en toute simplicité
            </p>
          </div>
          <button
            onClick={() => blink.auth.login()}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    )
  }

  if (!isOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} user={user} />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} />
      case 'catalog':
        return <SoftwareCatalog user={user} />
      case 'requests':
        return <Requests user={user} />
      case 'analytics':
        return <Analytics user={user} />
      case 'settings':
        return <Settings user={user} />
      default:
        return <Dashboard user={user} />
    }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar 
          user={user} 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
        />
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}

export default App