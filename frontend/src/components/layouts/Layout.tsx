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

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1
            className="text-xl font-bold cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push(isAuthenticated ? '/dashboard' : '/')}
          >
            Financial Sentiment Analysis
          </h1>
          <nav className="flex items-center space-x-2 md:space-x-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={() => router.push('/dashboard')}>Dashboard</Button>
                <Button variant="ghost" onClick={() => router.push('/upload')}>Upload</Button>
                <Button variant="ghost" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push('/login')}>Login</Button>
                <Button onClick={() => router.push('/register')}>Register</Button>
              </>
            )}
            <ModeToggle />
          </nav>
        </div>
      </header>
      <main className="container mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}