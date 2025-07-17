import { Layout } from '@/components/layouts/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ThemeProvider } from '@/components/theme-provider'
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useQuery } from '@apollo/client'
import { GET_DASHBOARD_DATA } from '@/pages/graphql/queries'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { setTheme } = useTheme()
  const { loading, error, data } = useQuery(GET_DASHBOARD_DATA)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error :(</p>

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Layout>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div>
            <Button variant="outline" onClick={() => router.push('/upload')}>Upload Holdings</Button>
            <Button variant="outline" onClick={handleLogout} className="ml-2">Logout</Button>
            <Button variant="outline" size="icon" onClick={() => setTheme("light")} className="ml-2">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setTheme("dark")">
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </div>
        {data && data.dashboard ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Holdings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.dashboard.totalHoldings}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overall Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.dashboard.overallSentiment}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Performing Asset</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.dashboard.topPerformingAsset}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Worst Performing Asset</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.dashboard.worstPerformingAsset}</div>
                </CardContent>
              </Card>
            </div>
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Holdings</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Sentiment</TableHead>
                        <TableHead>Recommendation</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.dashboard.holdings.map((holding) => (
                        <TableRow key={holding.id}>
                          <TableCell>{holding.symbol}</TableCell>
                          <TableCell>{holding.quantity}</TableCell>
                          <TableCell>{holding.price}</TableCell>
                          <TableCell>{holding.sentiment}</TableCell>
                          <TableCell>{holding.recommendation}</TableCell>
                          <TableCell>
                            <Button variant="outline">View News & Sentiment</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold">Welcome to your Dashboard!</h2>
            <p className="text-muted-foreground mt-2">Upload your equity and mutual fund holdings to get started.</p>
            <Button className="mt-4" onClick={() => router.push('/upload')}>Upload Holdings</Button>
          </div>
        )}
      </Layout>
    </ThemeProvider>
  )
}
