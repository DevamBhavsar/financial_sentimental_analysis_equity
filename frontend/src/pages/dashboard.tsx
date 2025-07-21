// pages/dashboard.tsx
import { Layout } from "@/components/layouts/Layout";
import MarketStatus from "@/components/MarketStatus";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import StockSearchDialog from "@/components/StockSearchDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import {
  ADD_HOLDING,
  GET_DASHBOARD_DATA,
  REMOVE_HOLDING,
} from "@/graphql/queries";
import { AuthManager } from "@/lib/auth";
import { useMutation, useQuery } from "@apollo/client";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Building2,
  Percent,
  PieChart,
  Plus,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
  UploadCloud,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface AddHoldingForm {
  company_name: string;
  isin: string;
  sector: string;
  total_quantity: number;
  avg_trading_price: number;
  ltp: number;
}

export default function DashboardPage() {
  const { loading, error, data, refetch } = useQuery(GET_DASHBOARD_DATA);
  const [addHolding] = useMutation(ADD_HOLDING, {
    refetchQueries: [{ query: GET_DASHBOARD_DATA }],
    awaitRefetchQueries: true,
  });
  const [removeHolding] = useMutation(REMOVE_HOLDING, {
    refetchQueries: [{ query: GET_DASHBOARD_DATA }],
    awaitRefetchQueries: true,
  });

  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isAuthenticated } = useAuth();

  const router = useRouter();

  // Auto-refresh portfolio data when dashboard loads (if market is closed)
  useEffect(() => {
    const refreshPortfolioData = async () => {
      try {
        const marketResponse = await fetch("/api/market/status");
        const marketData = await marketResponse.json();

        // Only auto-refresh if market is closed to avoid overwhelming during trading hours
        if (marketData.success && !marketData.data.is_open) {
          await handleRefreshPortfolio(false); // Silent refresh
        }
      } catch (error) {
        console.error("Error checking market status for auto-refresh:", error);
      }
    };

    if (data?.dashboard?.holdings?.length > 0) {
      refreshPortfolioData();
    }
  }, [data?.dashboard?.holdings?.length]);

  const handleRefreshPortfolio = async (showLoading = true) => {
    try {
      if (showLoading) setIsRefreshing(true);

      if (!isAuthenticated) {
        console.error("User not authenticated");
        if (showLoading) {
          alert("Please log in to refresh portfolio data");
        }
        return;
      }

      const token = AuthManager.getToken();
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      console.log(
        "Sending refresh request with token:",
        token ? "Token present" : "No token"
      );
      console.log("User authenticated:", isAuthenticated);

      const response = await fetch("/api/market/refresh-portfolio", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Portfolio refresh failed with status:",
          response.status,
          errorText
        );
        if (showLoading) {
          alert(`Portfolio refresh failed: ${response.status} ${errorText}`);
        }
        return;
      }

      const result = await response.json();

      if (result.success) {
        setLastUpdated(new Date().toISOString());
        await refetch(); // Refresh GraphQL data

        if (showLoading) {
          // Show success message (you can add a toast notification here)
          console.log(
            `Portfolio refreshed: ${result.data.updated_count} holdings updated`
          );
        }
      } else {
        console.error("Portfolio refresh failed:", result.message);
      }
    } catch (error) {
      console.error("Error refreshing portfolio:", error);
    } finally {
      if (showLoading) setIsRefreshing(false);
    }
  };
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    holdingId: number | null;
    holdingName: string;
  }>({
    isOpen: false,
    holdingId: null,
    holdingName: "",
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1 text-primary" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1 text-primary" />
    );
  };

  const sortedHoldings = data?.dashboard?.holdings
    ? [...data.dashboard.holdings].sort((a: any, b: any) => {
        if (!sortField) return 0;

        let aValue, bValue;

        switch (sortField) {
          case "company_name":
            aValue = a.company_name.toLowerCase();
            bValue = b.company_name.toLowerCase();
            break;
          case "sector":
            aValue = a.sector.toLowerCase();
            bValue = b.sector.toLowerCase();
            break;
          case "total_quantity":
            aValue = a.total_quantity;
            bValue = b.total_quantity;
            break;
          case "avg_trading_price":
            aValue = a.avg_trading_price;
            bValue = b.avg_trading_price;
            break;
          case "ltp":
            aValue = a.ltp;
            bValue = b.ltp;
            break;
          case "invested_value":
            aValue = a.invested_value;
            bValue = b.invested_value;
            break;
          case "market_value":
            aValue = a.market_value;
            bValue = b.market_value;
            break;
          case "overall_gain_loss":
            aValue = a.overall_gain_loss;
            bValue = b.overall_gain_loss;
            break;
          case "gain_loss_percent":
            aValue =
              a.invested_value > 0
                ? (a.overall_gain_loss / a.invested_value) * 100
                : 0;
            bValue =
              b.invested_value > 0
                ? (b.overall_gain_loss / b.invested_value) * 100
                : 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      })
    : [];

  const handleRemoveHolding = (id: number, companyName: string) => {
    setDeleteConfirmation({
      isOpen: true,
      holdingId: id,
      holdingName: companyName,
    });
  };

  const confirmRemoveHolding = async () => {
    try {
      if (deleteConfirmation.holdingId) {
        await removeHolding({
          variables: { id: deleteConfirmation.holdingId },
        });
        setDeleteConfirmation({
          isOpen: false,
          holdingId: null,
          holdingName: "",
        });
      }
    } catch (error) {
      console.error("Error removing holding:", error);
    }
  };

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
  const portfolio = dashboard?.portfolio;
  const holdingsExist = dashboard && dashboard.holdings.length > 0;

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return value.toLocaleString();
  };

  const formatPercent = (value: number) =>
    `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6 p-6">
          {/* Market Status */}
          <MarketStatus />

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Portfolio Dashboard
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Professional trading platform with real-time analytics
              </p>
            </div>
            <div className="flex gap-3">
              {holdingsExist && (
                <>
                  <Button
                    onClick={() => handleRefreshPortfolio(true)}
                    disabled={isRefreshing}
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                    {isRefreshing ? "Updating..." : "Refresh Prices"}
                  </Button>
                  <StockSearchDialog>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Stock
                    </Button>
                  </StockSearchDialog>
                  <Button
                    onClick={() => router.push("/upload")}
                    variant="outline"
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload Holdings
                  </Button>
                </>
              )}
            </div>
          </div>

          {holdingsExist ? (
            <>
              {/* Last Updated Info */}
              {lastUpdated && (
                <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <span className="inline-flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Portfolio data last updated:{" "}
                    {new Date(lastUpdated).toLocaleString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Kolkata",
                    })}{" "}
                    IST
                  </span>
                </div>
              )}

              {/* Portfolio Summary - Large Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800">
                      Total Portfolio Value
                    </CardTitle>
                    <Wallet className="h-5 w-5 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-900">
                      {formatCurrency(portfolio?.totalMarketValue)}
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      Invested: {formatCurrency(portfolio?.totalInvestedValue)}
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={`bg-gradient-to-br ${
                    portfolio?.totalGainLoss && portfolio?.totalGainLoss >= 0
                      ? "from-green-50 to-green-100 border-green-200"
                      : "from-red-50 to-red-100 border-red-200"
                  }`}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle
                      className={`text-sm font-medium ${
                        portfolio?.totalGainLoss &&
                        portfolio?.totalGainLoss >= 0
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      Total P&L
                    </CardTitle>
                    {portfolio?.totalGainLoss &&
                    portfolio?.totalGainLoss >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-3xl font-bold ${
                        portfolio?.totalGainLoss &&
                        portfolio?.totalGainLoss >= 0
                          ? "text-green-900"
                          : "text-red-900"
                      }`}
                    >
                      {formatCurrency(portfolio?.totalGainLoss)}
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        portfolio?.totalGainLoss &&
                        portfolio?.totalGainLoss >= 0
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {portfolio?.totalGainLossPercent
                        ? formatPercent(portfolio.totalGainLossPercent)
                        : "N/A"}{" "}
                      overall
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={`bg-gradient-to-br ${
                    portfolio?.todaysGainLoss && portfolio?.todaysGainLoss >= 0
                      ? "from-emerald-50 to-emerald-100 border-emerald-200"
                      : "from-orange-50 to-orange-100 border-orange-200"
                  }`}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle
                      className={`text-sm font-medium ${
                        portfolio?.todaysGainLoss &&
                        portfolio?.todaysGainLoss >= 0
                          ? "text-emerald-800"
                          : "text-orange-800"
                      }`}
                    >
                      Today's P&L
                    </CardTitle>
                    <Activity
                      className={`h-5 w-5 ${
                        portfolio?.todaysGainLoss &&
                        portfolio?.todaysGainLoss >= 0
                          ? "text-emerald-600"
                          : "text-orange-600"
                      }`}
                    />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-3xl font-bold ${
                        portfolio?.todaysGainLoss &&
                        portfolio?.todaysGainLoss >= 0
                          ? "text-emerald-900"
                          : "text-orange-900"
                      }`}
                    >
                      {formatCurrency(portfolio?.todaysGainLoss)}
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        portfolio?.todaysGainLoss &&
                        portfolio?.todaysGainLoss >= 0
                          ? "text-emerald-700"
                          : "text-orange-700"
                      }`}
                    >
                      {portfolio?.todaysGainLossPercent
                        ? formatPercent(portfolio.todaysGainLossPercent)
                        : "N/A"}{" "}
                      today
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-purple-800">
                      Avg Return %
                    </CardTitle>
                    <Percent className="h-5 w-5 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-3xl font-bold ${
                        portfolio?.avgGainLossPercent &&
                        portfolio?.avgGainLossPercent >= 0
                          ? "text-purple-900"
                          : "text-red-900"
                      }`}
                    >
                      {portfolio?.avgGainLossPercent
                        ? formatPercent(portfolio.avgGainLossPercent)
                        : "N/A"}
                    </div>
                    <p className="text-xs text-purple-700 mt-1">
                      Average across holdings
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Stocks
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboard.totalStocks}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Sectors
                    </CardTitle>
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboard.sectorsCount}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Top Performer
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-green-600">
                      {dashboard.topPerformingAsset}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Worst Performer
                    </CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-red-600">
                      {dashboard.worstPerformingAsset}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Holdings Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Portfolio Holdings
                  </CardTitle>
                  <CardDescription>
                    Detailed view of your equity positions with real-time P&L
                    tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("company_name")}
                          >
                            <div className="flex items-center">
                              Company {getSortIcon("company_name")}
                            </div>
                          </TableHead>
                          <TableHead
                            className="text-right cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("total_quantity")}
                          >
                            <div className="flex items-center justify-end">
                              Qty {getSortIcon("total_quantity")}
                            </div>
                          </TableHead>
                          <TableHead
                            className="text-right cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("avg_trading_price")}
                          >
                            <div className="flex items-center justify-end">
                              Avg Price {getSortIcon("avg_trading_price")}
                            </div>
                          </TableHead>
                          <TableHead
                            className="text-right cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("ltp")}
                          >
                            <div className="flex items-center justify-end">
                              LTP {getSortIcon("ltp")}
                            </div>
                          </TableHead>
                          <TableHead
                            className="text-right cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("invested_value")}
                          >
                            <div className="flex items-center justify-end">
                              Invested {getSortIcon("invested_value")}
                            </div>
                          </TableHead>
                          <TableHead
                            className="text-right cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("market_value")}
                          >
                            <div className="flex items-center justify-end">
                              Market Value {getSortIcon("market_value")}
                            </div>
                          </TableHead>
                          <TableHead
                            className="text-right cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("overall_gain_loss")}
                          >
                            <div className="flex items-center justify-end">
                              P&L {getSortIcon("overall_gain_loss")}
                            </div>
                          </TableHead>
                          <TableHead
                            className="text-right cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("gain_loss_percent")}
                          >
                            <div className="flex items-center justify-end">
                              P&L % {getSortIcon("gain_loss_percent")}
                            </div>
                          </TableHead>
                          <TableHead className="text-right">
                            Day's High
                          </TableHead>
                          <TableHead className="text-right">
                            Day's Low
                          </TableHead>
                          <TableHead className="text-right">Volume</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedHoldings.map((holding: any) => {
                          const gainLossPercent =
                            holding.invested_value > 0
                              ? (holding.overall_gain_loss /
                                  holding.invested_value) *
                                100
                              : 0;

                          return (
                            <TableRow
                              key={holding.id}
                              className="hover:bg-muted/50"
                            >
                              <TableCell className="font-medium">
                                <div>
                                  <div className="font-semibold">
                                    {holding.company_name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {holding.isin}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatNumber(holding.total_quantity)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(holding.avg_trading_price)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(holding.ltp)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(holding.invested_value)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold">
                                {formatCurrency(holding.market_value)}
                              </TableCell>
                              <TableCell
                                className={`text-right font-mono font-semibold ${
                                  holding.overall_gain_loss >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {formatCurrency(holding.overall_gain_loss)}
                              </TableCell>
                              <TableCell
                                className={`text-right font-mono font-semibold ${
                                  gainLossPercent >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {formatPercent(gainLossPercent)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(holding.high)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(holding.low)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatNumber(holding.trade_volume)}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveHolding(
                                        holding.id,
                                        holding.company_name
                                      )
                                    }
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            // Empty state
            <div className="text-center py-20 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-gradient-to-br from-muted/20 to-muted/40 dark:from-muted/5 dark:to-muted/10">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 dark:bg-primary/20 rounded-full">
                  <UploadCloud className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Welcome to Your Trading Dashboard
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start building your portfolio by uploading your holdings file or
                adding stocks manually
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => router.push("/upload")}>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload Holdings File
                </Button>
                <StockSearchDialog>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Stock Manually
                  </Button>
                </StockSearchDialog>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmation.isOpen}
          onOpenChange={(open) =>
            setDeleteConfirmation((prev) => ({ ...prev, isOpen: open }))
          }
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="text-base">
                Are you sure you want to remove this holding from your
                portfolio?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="bg-muted/50 rounded-lg p-4 border border-red-200 dark:border-red-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <BarChart3 className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {deleteConfirmation.holdingName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setDeleteConfirmation({
                    isOpen: false,
                    holdingId: null,
                    holdingName: "",
                  })
                }
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmRemoveHolding}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Holding
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  );
}
