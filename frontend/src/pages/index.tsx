import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden">
      {/* Modern financial-ish background animation */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 animate-grid-pan"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-8">
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 animate-fade-in-up">
          Financial Sentiment Analysis
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mb-10 opacity-0 animate-fade-in animation-delay-500">
          Aggregate your financial news, analyze market sentiment, and get AI-driven recommendations to make informed investment decisions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mb-12">
          <div className="bg-white bg-opacity-10 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 opacity-0 animate-fade-in animation-delay-1000">
            <h3 className="text-2xl font-semibold mb-3">Aggregate News</h3>
            <p className="text-gray-300">Collect and organize financial news from various sources in one place.</p>
          </div>
          <div className="bg-white bg-opacity-10 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 opacity-0 animate-fade-in animation-delay-1500">
            <h3 className="text-2xl font-semibold mb-3">Analyze Sentiment</h3>
            <p className="text-gray-300">Understand the market's mood with AI-powered sentiment analysis.</p>
          </div>
          <div className="bg-white bg-opacity-10 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 opacity-0 animate-fade-in animation-delay-2000">
            <h3 className="text-2xl font-semibold mb-3">AI Recommendations</h3>
            <p className="text-gray-300">Receive intelligent buy/sell/hold recommendations based on data.</p>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 opacity-0 animate-fade-in animation-delay-2500">
            <button
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full text-xl font-bold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50"
              onClick={() => router.push('/login')}
            >
              Login
            </button>
            <button
              className="px-10 py-4 border-2 border-purple-600 text-purple-400 rounded-full text-xl font-bold shadow-lg hover:bg-purple-600 hover:text-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50"
              onClick={() => router.push('/register')}
            >
              Register
            </button>
          </div>
        )}
      </div>
    </div>
  )
}