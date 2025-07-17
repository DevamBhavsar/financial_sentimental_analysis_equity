import { ReactNode } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { ModeToggle } from '@/components/ui/mode-toggle'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated, logout } = useAuth()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-foreground cursor-pointer" onClick={() => router.push(isAuthenticated ? '/dashboard' : '/')}>Financial Sentiment Analysis</h1>
          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={() => router.push('/dashboard')}>Dashboard</Button>
                <Button variant="ghost" onClick={() => router.push('/upload')}>Upload Holdings</Button>
                <Button variant="ghost" onClick={logout}>Logout</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push('/login')}>Login</Button>
                <Button variant="ghost" onClick={() => router.push('/register')}>Register</Button>
              </>
            )}
            <ModeToggle />
          </nav>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}