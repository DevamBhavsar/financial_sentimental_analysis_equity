import { Layout } from '@/components/layouts/Layout'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/router'

export default function LandingPage() {
  const router = useRouter()

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Personalized Financial News & Sentiment Analysis</h1>
        <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mx-auto my-6">
          Aggregate your financial news, analyze market sentiment, and get AI-driven recommendations for your equity and mutual fund holdings.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => router.push('/login')}>Login</Button>
          <Button variant="secondary" onClick={() => router.push('/register')}>Register</Button>
        </div>
      </div>
    </Layout>
  )
}