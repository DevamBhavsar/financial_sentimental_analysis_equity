import re
from typing import List, Optional, Set


class TickerExtractor:
    def __init__(self):
        self.common_tickers = self.load_common_tickers()
        self.ticker_pattern = re.compile(r"\b[A-Z]{1,5}\b")

    def load_common_tickers(self) -> Set[str]:
        """Load common ticker symbols"""
        # This is a simplified version - in production, you'd load from a database
        # or API like Alpha Vantage
        return {
            "AAPL",
            "MSFT",
            "GOOGL",
            "AMZN",
            "TSLA",
            "META",
            "NVDA",
            "NFLX",
            "RELIANCE",
            "TCS",
            "INFY",
            "HDFCBANK",
            "ICICIBANK",
            "SBIN",
            "ITC",
            "HINDUNILVR",
            "BHARTIARTL",
            "ASIANPAINT",
            "MARUTI",
            "KOTAKBANK",
        }

    def extract_tickers(self, text: str) -> List[str]:
        """Extract ticker symbols from text"""
        # Find potential tickers
        potential_tickers = self.ticker_pattern.findall(text.upper())

        # Filter against known tickers
        valid_tickers = []
        for ticker in potential_tickers:
            if ticker in self.common_tickers:
                valid_tickers.append(ticker)

        # Remove duplicates while preserving order
        return list(dict.fromkeys(valid_tickers))

    def extract_from_article(self, title: str, content: Optional[str] = None) -> List[str]:
        """Extract tickers from article title and content"""
        text_to_search = title
        if content:
            text_to_search += " " + content

        return self.extract_tickers(text_to_search)
