import { Layout } from '@/components/layouts/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { GET_DASHBOARD_DATA } from '@/pages/graphql/queries'
import { useQuery } from '@apollo/client'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

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
    return <Layout><p>Loading...</p></Layout>;
  }
  if (error) {
    return <Layout><p>Error loading dashboard data. Please try again.</p></Layout>;
  }

  return (
    <Layout>
      {data && data.dashboard ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <Button onClick={() => router.push('/upload')}>Upload Holdings</Button>
          </div>
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
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Avg. Price</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.dashboard.holdings.map((holding: any) => (
                      <TableRow key={holding.id}>
                        <TableCell className="font-medium">{holding.ticker}</TableCell>
                        <TableCell>{holding.quantity}</TableCell>
                        <TableCell>${holding.avgPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">View News & Sentiment</Button>
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
  );
}