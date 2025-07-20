// pages/dashboard.tsx
import { Layout } from "@/components/layouts/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GET_DASHBOARD_DATA } from "@/pages/graphql/queries";
import { useQuery } from "@apollo/client";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  UploadCloud,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function DashboardPage() {
  const { loading, error, data } = useQuery(GET_DASHBOARD_DATA);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
    }
  }, [router]);

  if (loading)
    return (
      <Layout>
        <div className="text-center p-10">Loading Dashboard...</div>
      </Layout>
    );
  if (error)
    return (
      <Layout>
        <div className="text-center p-10 text-red-500">
          Error: {error.message}
        </div>
      </Layout>
    );

  const dashboard = data?.dashboard;
  const holdingsExist = dashboard && dashboard.holdings.length > 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Portfolio overview and market sentiment.
            </p>
          </div>
          {holdingsExist && (
            <Button onClick={() => router.push("/upload")}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload New Holdings
            </Button>
          )}
        </div>

        {holdingsExist ? (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Market Value
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    $
                    {dashboard.totalMarketValue.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </CardContent>
              </Card>
              {/* Other cards remain the same but now use correct data */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Top Performer
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboard.topPerformingAsset}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Worst Performer
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboard.worstPerformingAsset}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Holdings Table */}
            <Card>
              <CardHeader>
                <CardTitle>Your Holdings</CardTitle>
                <CardDescription>
                  A detailed list of your current assets.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>ISIN</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Avg. Price</TableHead>
                      <TableHead className="text-right">Market Value</TableHead>
                      <TableHead className="text-right">
                        Overall Gain/Loss
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.holdings.map((h: any) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">
                          {h.company_name}
                        </TableCell>
                        <TableCell>{h.isin}</TableCell>
                        <TableCell className="text-right">
                          {h.total_quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          ${h.avg_trading_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${h.market_value.toFixed(2)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            h.overall_gain_loss >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          ${h.overall_gain_loss.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          // Empty state
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-6 text-xl font-semibold">
              Welcome to Your Dashboard
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You have no holdings. Upload a file to start.
            </p>
            <Button className="mt-6" onClick={() => router.push("/upload")}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload Holdings
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
