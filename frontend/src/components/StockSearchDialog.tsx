import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADD_HOLDING, GET_DASHBOARD_DATA } from "@/graphql/queries";
import { useMutation } from "@apollo/client";
import {
  Building2,
  Calendar,
  DollarSign,
  Loader2,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface StockSearchResult {
  symbol: string;
  name: string;
  token: string;
  exchange: string;
  instrument_type: string;
  lot_size: number;
}

interface AddHoldingForm {
  company_name: string;
  isin: string;
  sector: string;
  total_quantity: number;
  avg_trading_price: number;
  ltp: number;
  purchase_date?: string;
}

interface StockSearchDialogProps {
  children: React.ReactNode;
}

const StockSearchDialog: React.FC<StockSearchDialogProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [newHolding, setNewHolding] = useState<AddHoldingForm>({
    company_name: "",
    isin: "",
    sector: "",
    total_quantity: 0,
    avg_trading_price: 0,
    ltp: 0,
    purchase_date: "",
  });

  const [addHolding] = useMutation(ADD_HOLDING, {
    refetchQueries: [{ query: GET_DASHBOARD_DATA }],
    awaitRefetchQueries: true,
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Search for stocks
  const searchStocks = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch("/api/market/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          exchange: "NSE",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
      } else {
        console.error("Search failed:", data);
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Get historical price for purchase date
  const getHistoricalPrice = async (
    token: string,
    exchange: string,
    date: string
  ) => {
    if (!date) return null;

    setIsLoadingPrice(true);
    try {
      const response = await fetch("/api/market/historical-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "cache-control": "no-cache",
        },
        body: JSON.stringify({
          symbol_token: token,
          exchange: exchange,
          date: date,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return data.data.price;
      } else {
        console.error("Historical price fetch failed:", data);
        return null;
      }
    } catch (error) {
      console.error("Historical price error:", error);
      return null;
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // Get current LTP
  const getCurrentLTP = async (token: string, exchange: string) => {
    try {
      const response = await fetch(
        `/api/market/ltp/${token}?exchange=${exchange}`,
        {
          headers: {
            "Cache-Control": "no-cache", // Add this line
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        return data.data.ltp;
      } else {
        console.error("LTP fetch failed:", data);
        return null;
      }
    } catch (error) {
      console.error("LTP error:", error);
      return null;
    }
  };

  // Handle search input change with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchStocks(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Handle stock selection
  const handleStockSelect = async (stock: StockSearchResult) => {
    setSelectedStock(stock);
    setNewHolding((prev) => ({
      ...prev,
      company_name: stock.name || stock.symbol,
      isin: stock.token, // Using token as ISIN placeholder
      sector: stock.instrument_type || "Unknown",
    }));

    // Get current LTP
    const ltp = await getCurrentLTP(stock.token, stock.exchange);
    if (ltp) {
      setNewHolding((prev) => ({
        ...prev,
        ltp: ltp,
      }));
    }

    setSearchResults([]);
    setSearchQuery("");
  };

  // Handle purchase date change and fetch historical price
  const handlePurchaseDateChange = async (date: string) => {
    setNewHolding((prev) => ({ ...prev, purchase_date: date }));

    if (selectedStock && date) {
      const historicalPrice = await getHistoricalPrice(
        selectedStock.token,
        selectedStock.exchange,
        date
      );

      if (historicalPrice) {
        setNewHolding((prev) => ({
          ...prev,
          avg_trading_price: historicalPrice,
        }));
      }
    }
  };

  // Handle add holding
  const handleAddHolding = async () => {
    try {
      const invested_value =
        newHolding.total_quantity * newHolding.avg_trading_price;
      const market_value = newHolding.total_quantity * newHolding.ltp;
      const overall_gain_loss = market_value - invested_value;

      await addHolding({
        variables: {
          input: {
            ...newHolding,
            invested_value,
            market_value,
            overall_gain_loss,
          },
        },
      });

      // Reset form
      setNewHolding({
        company_name: "",
        isin: "",
        sector: "",
        total_quantity: 0,
        avg_trading_price: 0,
        ltp: 0,
        purchase_date: "",
      });
      setSelectedStock(null);
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding holding:", error);
    }
  };

  const resetForm = () => {
    setNewHolding({
      company_name: "",
      isin: "",
      sector: "",
      total_quantity: 0,
      avg_trading_price: 0,
      ltp: 0,
      purchase_date: "",
    });
    setSelectedStock(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Stock
          </DialogTitle>
          <DialogDescription>
            Search for stocks and add them to your portfolio with real-time
            pricing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stock Search */}
          {!selectedStock && (
            <div className="space-y-3">
              <Label htmlFor="stock-search">Search Stock</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="stock-search"
                  placeholder="Type company name or symbol (e.g., Reliance, INFY)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                  {searchResults.map((stock, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleStockSelect(stock)}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="font-semibold">{stock.symbol}</div>
                            <div className="text-sm text-muted-foreground">
                              {stock.name}
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {stock.exchange}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {stock.instrument_type}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              Lot Size: {stock.lot_size}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Stock Details */}
          {selectedStock && (
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {selectedStock.symbol}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedStock.name}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="default" className="text-xs">
                        {selectedStock.exchange}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {selectedStock.instrument_type}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStock(null)}
                  >
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stock Details Form */}
          {selectedStock && (
            <div className="grid gap-4">
              {/* Purchase Date */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="purchase_date" className="text-right">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Purchase Date
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="purchase_date"
                    type="date"
                    value={newHolding.purchase_date}
                    onChange={(e) => handlePurchaseDateChange(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                  <div className="text-xs text-muted-foreground">
                    We'll fetch the closing price for this date
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="total_quantity" className="text-right">
                  Quantity
                </Label>
                <Input
                  id="total_quantity"
                  type="number"
                  min="1"
                  value={newHolding.total_quantity}
                  onChange={(e) =>
                    setNewHolding({
                      ...newHolding,
                      total_quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="col-span-3"
                  placeholder="Number of shares"
                />
              </div>

              {/* Average Price */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="avg_trading_price" className="text-right">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Avg Price
                </Label>
                <div className="col-span-3 space-y-1">
                  <div className="relative">
                    <Input
                      id="avg_trading_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newHolding.avg_trading_price}
                      onChange={(e) =>
                        setNewHolding({
                          ...newHolding,
                          avg_trading_price: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Purchase price per share"
                    />
                    {isLoadingPrice && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {newHolding.purchase_date
                      ? "Auto-filled from historical data"
                      : "Select purchase date for auto-fill"}
                  </div>
                </div>
              </div>

              {/* Current Price (LTP) */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ltp" className="text-right">
                  <TrendingUp className="h-4 w-4 inline mr-1" />
                  Current Price
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="ltp"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newHolding.ltp}
                    onChange={(e) =>
                      setNewHolding({
                        ...newHolding,
                        ltp: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Current market price"
                  />
                  <div className="text-xs text-muted-foreground">
                    Live market price (auto-fetched)
                  </div>
                </div>
              </div>

              {/* Investment Summary */}
              {newHolding.total_quantity > 0 &&
                newHolding.avg_trading_price > 0 &&
                newHolding.ltp > 0 && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="font-medium">Investment Summary</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Invested:
                            </span>
                            <span className="ml-2 font-mono">
                              ₹
                              {(
                                newHolding.total_quantity *
                                newHolding.avg_trading_price
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Current Value:
                            </span>
                            <span className="ml-2 font-mono">
                              ₹
                              {(
                                newHolding.total_quantity * newHolding.ltp
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">P&L:</span>
                            <span
                              className={`ml-2 font-mono ${
                                newHolding.total_quantity * newHolding.ltp -
                                  newHolding.total_quantity *
                                    newHolding.avg_trading_price >=
                                0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              ₹
                              {(
                                newHolding.total_quantity * newHolding.ltp -
                                newHolding.total_quantity *
                                  newHolding.avg_trading_price
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddHolding}
            disabled={
              !selectedStock ||
              newHolding.total_quantity <= 0 ||
              newHolding.avg_trading_price <= 0 ||
              newHolding.ltp <= 0
            }
          >
            Add to Portfolio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StockSearchDialog;
