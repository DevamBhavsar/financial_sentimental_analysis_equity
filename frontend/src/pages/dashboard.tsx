import { Layout } from '@/components/layouts/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { GET_DASHBOARD_DATA } from '@/pages/graphql/queries'
import { useQuery } from '@apollo/client'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Newspaper, UploadCloud } from 'lucide-react'

export default function DashboardPage() {
  const { loading, error, data } = useQuery(GET_DASHBOARD_DATA);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  if (loading) {
    return <Layout><div className="text-center p-10">Loading Dashboard...</div></Layout>;
  }
  if (error) {
    return <Layout><div className="text-center p-10 text-red-500">Error loading dashboard data. Please try again.</div></Layout>;
  }

  const holdingsExist = data && data.dashboard && data.dashboard.holdings.length > 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">An overview of your investment portfolio and market sentiment.</p>
          </div>
          {holdingsExist && (
             <Button onClick={() => router.push('/upload')}>
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload New Holdings
            </Button>
          )}
        </div>

        {holdingsExist ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Holdings Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${data.dashboard.totalHoldings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overall Sentiment</CardTitle>
                  <Newspaper className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.dashboard.overallSentiment}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Performing Asset</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.dashboard.topPerformingAsset}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Worst Performing Asset</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.dashboard.worstPerformingAsset}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Holdings</CardTitle>
                <CardDescription>A detailed list of your current assets.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Ticker</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Avg. Price</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.dashboard.holdings.map((holding: any) => (
                      <TableRow key={holding.id}>
                        <TableCell className="font-medium">{holding.ticker}</TableCell>
                        <TableCell>{holding.name}</TableCell>
                        <TableCell className="text-right">{holding.quantity}</TableCell>
                        <TableCell className="text-right">${holding.avgPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="outline" size="sm">View Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-6 text-xl font-semibold">Welcome to Your Dashboard</h2>
            <p className="mt-2 text-sm text-muted-foreground">You don't have any holdings yet. Upload a file to get started.</p>
            <Button className="mt-6" onClick={() => router.push('/upload')}>
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload Holdings
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}