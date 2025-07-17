import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setToken(localStorage.getItem('token'))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-foreground cursor-pointer" onClick={() => router.push(token ? '/dashboard' : '/')}>Financial Sentiment Analysis</h1>
          <nav>
            {token ? (
              <>
                <Button variant="ghost" onClick={() => router.push('/dashboard')}>Dashboard</Button>
                <Button variant="ghost" onClick={() => router.push('/upload')}>Upload Holdings</Button>
                <Button variant="ghost" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push('/login')}>Login</Button>
                <Button variant="ghost" onClick={() => router.push('/register')}>Register</Button>
              </>
            )}
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