import asyncio
from datetime import datetime, time, timezone
from typing import Optional, Dict, Any, List
import pytz
from SmartApi import SmartConnect
from SmartApi.smartWebSocketV2 import SmartWebSocketV2
import logging
import json

from ..config import settings


logger = logging.getLogger(__name__)

# IST timezone
IST = pytz.timezone("Asia/Kolkata")

# Market timings (Monday to Friday)
MARKET_OPEN_TIME = time(9, 15)  # 9:15 AM
MARKET_CLOSE_TIME = time(15, 30)  # 3:30 PM


class MarketService:
    def __init__(self):
        self.smart_api: Optional[SmartConnect] = None
        self.auth_token: Optional[str] = None
        self.feed_token: Optional[str] = None
        self.websocket: Optional[SmartWebSocketV2] = None
        self._authenticated = False

    async def authenticate(self) -> bool:
        """Authenticate with Angel One SmartAPI using MPIN"""
        try:
            if not all(
                [
                    settings.angel_one_api_key,
                    settings.angel_one_mpin,
                    settings.angel_one_client_code,
                ]
            ):
                logger.error("Angel One API credentials not configured properly")
                return False

            self.smart_api = SmartConnect(api_key=settings.angel_one_api_key)

            # Generate TOTP if secret is provided
            totp_code = None
            if settings.angel_one_totp_secret:
                import pyotp

                totp = pyotp.TOTP(settings.angel_one_totp_secret)
                totp_code = totp.now()
                logger.info("Generated TOTP for authentication")

            # Use MPIN authentication (Angel One's new requirement)
            try:
                # Use the new MPIN-based authentication method
                data = self.smart_api.generateSession(
                    clientCode=settings.angel_one_client_code,
                    password=settings.angel_one_mpin,  # This should be your 4-digit MPIN
                    totp=totp_code,
                )
            except Exception as auth_error:
                logger.error(f"MPIN authentication failed: {auth_error}")

                # Try alternative authentication method if available
                try:
                    # Some versions might have a different method name
                    data = self.smart_api.generateSessionByMPIN(
                        clientCode=settings.angel_one_client_code,
                        mpin=settings.angel_one_mpin,
                        totp=totp_code,
                    )
                except Exception as alt_error:
                    logger.error(f"Alternative authentication also failed: {alt_error}")
                    raise Exception(
                        f"Authentication failed. Please ensure you're using the correct 4-digit MPIN: {auth_error}"
                    )

            if data.get("status"):
                self.auth_token = data["data"]["jwtToken"]
                self.feed_token = self.smart_api.getfeedToken()
                self._authenticated = True
                logger.info(
                    "Successfully authenticated with Angel One SmartAPI using MPIN"
                )
                return True
            else:
                logger.error(
                    f"Authentication failed: {data.get('message', 'Unknown error')}"
                )
                return False

        except Exception as e:
            logger.error(f"Error during authentication: {e}")
            return False

    def is_market_open(self) -> Dict[str, Any]:
        """Check if Indian stock market is currently open"""
        now_ist = datetime.now(IST)
        current_time = now_ist.time()
        is_weekday = now_ist.weekday() < 5  # Monday=0, Sunday=6

        is_open = is_weekday and MARKET_OPEN_TIME <= current_time <= MARKET_CLOSE_TIME

        return {
            "is_open": is_open,
            "current_time_ist": now_ist.strftime("%Y-%m-%d %H:%M:%S %Z"),
            "market_open_time": MARKET_OPEN_TIME.strftime("%H:%M"),
            "market_close_time": MARKET_CLOSE_TIME.strftime("%H:%M"),
            "is_weekday": is_weekday,
            "next_session": self._get_next_session_time(now_ist),
        }

    def _get_next_session_time(self, current_time: datetime) -> str:
        """Get the next market session start time"""
        from datetime import timedelta

        current_date = current_time.date()
        weekday = current_time.weekday()

        if weekday < 5 and current_time.time() < MARKET_OPEN_TIME:
            # If market is closed today but will open later today
            next_open = datetime.combine(current_date, MARKET_OPEN_TIME, IST)
            return next_open.strftime("%Y-%m-%d %H:%M:%S %Z")

        if weekday == 4:
            next_trading_date = current_date + timedelta(days=3)  # Skip to next Monday
        elif weekday == 5:  # Saturday
            next_trading_date = current_date + timedelta(days=2)  # Skip to Monday
        else:  # Sunday or any other day
            next_trading_date = current_date + timedelta(days=1)

        # # If market is closed today, check if it will open today
        # if current_time.time() < MARKET_OPEN_TIME and current_time.weekday() < 5:
        #     next_open = datetime.combine(current_date, MARKET_OPEN_TIME, IST)
        #     return next_open.strftime("%Y-%m-%d %H:%M:%S %Z")

        # # Find next weekday (Monday = 0, Sunday = 6)
        # days_until_monday = (7 - current_time.weekday()) % 7
        # if days_until_monday == 0:  # If today is Monday but market is closed
        #     days_until_monday = 7

        # Add the required days to get to next trading day
        # next_trading_date = current_date + timedelta(days=days_until_monday)
        next_open = datetime.combine(next_trading_date, MARKET_OPEN_TIME, IST)

        return next_open.strftime("%Y-%m-%d %H:%M:%S %Z")

    async def search_instruments(
        self, query: str, exchange: str = "NSE"
    ) -> List[Dict[str, Any]]:
        """Search for instruments/stocks by name or symbol"""
        try:
            if not self._authenticated:
                await self.authenticate()

            if not self.smart_api:
                return []

            # THE FIX IS HERE: Using the correct parameter name 'searchscrip'
            instruments = self.smart_api.searchScrip(
                exchange=exchange, searchscrip=query
            )

            if instruments and instruments.get("status"):
                return instruments["data"][:10]  # Return top 10 matches
            else:
                logger.error(
                    f"Instrument search failed: {instruments.get('message', 'Unknown error') if instruments else 'No response'}"
                )
                return []

        except Exception as e:
            logger.error(f"Error searching instruments: {e}")
            return []

    async def _fallback_search(self, query: str, exchange: str) -> List[Dict[str, Any]]:
        """Fallback search method when primary search fails"""
        try:
            # Try to get instrument list and filter manually
            # This is a fallback approach
            logger.info(f"Using fallback search for {query}")

            # For now, return empty list and log the issue
            # You might want to implement a local instrument database
            # or use a different API endpoint
            return []

        except Exception as e:
            logger.error(f"Fallback search failed: {e}")
            return []

    async def get_historical_price(
        self, symbol_token: str, exchange: str, date: datetime
    ) -> Optional[float]:
        """Get historical price for a specific date"""
        try:
            if not self._authenticated:
                await self.authenticate()

            if not self.smart_api:
                return None

            # Format date for API
            from_date = date.strftime("%Y-%m-%d 09:15")
            to_date = date.strftime("%Y-%m-%d 15:30")

            historical_data = self.smart_api.getCandleData(
                {
                    "exchange": exchange,
                    "symboltoken": symbol_token,
                    "interval": "ONE_DAY",
                    "fromdate": from_date,
                    "todate": to_date,
                }
            )

            if historical_data["status"] and historical_data["data"]:
                # Return the close price of the day
                return float(historical_data["data"][0][4])  # Close price is at index 4
            else:
                logger.warning(f"No historical data found for {symbol_token} on {date}")
                return None

        except Exception as e:
            logger.error(f"Error getting historical price: {e}")
            return None

    async def get_market_data(
        self, mode: str, exchange_tokens: Dict[str, List[str]]
    ) -> Optional[Dict[str, Any]]:
        """Get market data for a list of instruments."""
        try:
            if not self._authenticated:
                await self.authenticate()

            if not self.smart_api:
                return None

            # The method is getMarketData, not marketData
            response = self.smart_api.getMarketData(mode, exchange_tokens)

            if response and response.get("status"):
                return response["data"]
            else:
                logger.error(
                    f"Market data fetch failed: {response.get('message', 'Unknown error') if response else 'No response'}"
                )
                return None
        except Exception as e:
            logger.error(f"Error getting market data: {e}")
            return None

    async def get_ltp(self, symbol_token: str, exchange: str) -> Optional[float]:
        """Get Last Traded Price for a symbol"""
        try:
            if not self._authenticated:
                await self.authenticate()

            if not self.smart_api:
                return None

            exchange_tokens = {exchange: [symbol_token]}
            market_data = await self.get_market_data("FULL", exchange_tokens)

            if market_data and market_data.get("fetched"):
                for item in market_data["fetched"]:
                    if item.get("symbolToken") == symbol_token:
                        return float(item["ltp"])
            return None

        except Exception as e:
            logger.error(f"Error getting LTP: {e}")
            return None


# Global instance
market_service = MarketService()
