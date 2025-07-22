import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  Wifi,
  WifiOff,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface MarketStatusData {
  is_open: boolean;
  current_time_ist: string;
  market_open_time: string;
  market_close_time: string;
  is_weekday: boolean;
  next_session: string;
}

interface WebSocketStatusData {
  is_connected: boolean;
  subscribed_instruments: number;
  active_connections: number;
}

const MarketStatus: React.FC = () => {
  const [marketStatus, setMarketStatus] = useState<MarketStatusData | null>(
    null
  );
  const [wsStatus, setWsStatus] = useState<WebSocketStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchMarketStatus = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch("/api/market/status");
      const data = await response.json();

      if (data.success) {
        setMarketStatus(data.data);
      } else {
        throw new Error("Failed to fetch market status");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchWebSocketStatus = async () => {
    try {
      const response = await fetch("/api/market/websocket/status");
      const data = await response.json();

      if (data.success) {
        setWsStatus(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch WebSocket status:", err);
    }
  };

  const handleConnectWebSocket = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/market/websocket/connect", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        // After connecting, refresh the status to show "Connected"
        await fetchWebSocketStatus();
      } else {
        alert(`Connection failed: ${data.detail}`);
      }
    } catch (err) {
      console.error("Failed to connect WebSocket:", err);
      alert("An error occurred while trying to connect.");
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchMarketStatus(), fetchWebSocketStatus()]);
      setLoading(false);
    };

    fetchData();

    // Refresh market status every 30 seconds
    const interval = setInterval(() => {
      fetchMarketStatus();
      fetchWebSocketStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (timeString: string) => {
    try {
      const cleanTimeString = timeString
        .replace(" IST", "")
        .replace(" LMT", "");
      const date = new Date(cleanTimeString);

      if (isNaN(date.getTime())) {
        return timeString;
      }

      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Kolkata",
      });
    } catch {
      return timeString;
    }
  };

  const formatDate = (timeString: string) => {
    try {
      const cleanTimeString = timeString
        .replace(" IST", "")
        .replace(" LMT", "");
      const date = new Date(cleanTimeString);

      if (isNaN(date.getTime())) {
        return timeString;
      }

      return date.toLocaleDateString("en-IN");
    } catch {
      return timeString;
    }
  };

  if (loading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading market status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load market status: {error}
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={fetchMarketStatus}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Market Status Notification */}
      {marketStatus && (
        <Alert
          className={`border-2 ${
            marketStatus.is_open
              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
              : "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950"
          }`}
        >
          <div className="flex items-center space-x-3">
            {marketStatus.is_open ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Clock className="h-5 w-5 text-orange-600" />
            )}
            <div className="flex-1">
              <div className="font-medium">
                {marketStatus.is_open ? "Market is Open" : "Market is Closed"}
              </div>
              <div className="text-sm text-muted-foreground">
                Current time: {formatTime(marketStatus.current_time_ist)} IST
                {!marketStatus.is_open && (
                  <span className="ml-2">
                    • Next session: {formatDate(marketStatus.next_session)} at{" "}
                    {marketStatus.market_open_time}
                  </span>
                )}
              </div>
            </div>
            <Badge
              variant={marketStatus.is_open ? "default" : "secondary"}
              className={marketStatus.is_open ? "bg-green-600" : ""}
            >
              {marketStatus.is_open ? "LIVE" : "CLOSED"}
            </Badge>
          </div>
        </Alert>
      )}

      {/* Market & WebSocket Status Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Market Timing Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Market Hours
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchMarketStatus}
                disabled={isRefreshing}
                className="ml-auto h-6 w-6 p-0"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Open:</span>
              <span className="font-mono">
                {marketStatus?.market_open_time} IST
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Close:</span>
              <span className="font-mono">
                {marketStatus?.market_close_time} IST
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Trading Days:</span>
              <span>Monday - Friday</span>
            </div>
          </CardContent>
        </Card>

        {/* WebSocket Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {wsStatus?.is_connected ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              Real-time Data
              {!wsStatus?.is_connected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnectWebSocket}
                  disabled={isConnecting}
                  className="ml-auto text-xs"
                >
                  {isConnecting ? "Connecting..." : "Connect"}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge
                variant={wsStatus?.is_connected ? "default" : "destructive"}
                className="text-xs"
              >
                {wsStatus?.is_connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subscriptions:</span>
              <span className="font-mono">
                {wsStatus?.subscribed_instruments || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active Clients:</span>
              <span className="font-mono">
                {wsStatus?.active_connections || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Trading Alert */}
      {marketStatus?.is_open && wsStatus?.is_connected && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Live Trading Session:</strong> Real-time market data is
            active. Portfolio values will update automatically.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default MarketStatus;
