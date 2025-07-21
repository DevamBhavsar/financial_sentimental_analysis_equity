import asyncio
import json
import logging
from typing import Dict, List, Callable, Optional, Any
from SmartApi.smartWebSocketV2 import SmartWebSocketV2
from .market_service import market_service


logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        self.websocket: Optional[SmartWebSocketV2] = None
        self.subscribed_tokens: Dict[str, Dict[str, Any]] = {}
        self.data_callbacks: List[Callable] = []
        self.is_connected = False
        
    async def initialize(self) -> bool:
        """Initialize WebSocket connection with Angel One"""
        try:
            # Ensure market service is authenticated
            if not market_service._authenticated:
                await market_service.authenticate()
            
            if not all([market_service.auth_token, market_service.feed_token]):
                logger.error("Missing authentication tokens for WebSocket")
                return False
            
            # Initialize WebSocket
            self.websocket = SmartWebSocketV2(
                auth_token=market_service.auth_token,
                api_key=market_service.smart_api.api_key,
                client_code=market_service.smart_api.clientCode,
                feed_token=market_service.feed_token
            )
            
            # Set callbacks
            self.websocket.on_open = self._on_open
            self.websocket.on_data = self._on_data
            self.websocket.on_error = self._on_error
            self.websocket.on_close = self._on_close
            
            # Connect
            self.websocket.connect()
            
            # Wait a bit for connection to establish
            await asyncio.sleep(2)
            
            return self.is_connected
            
        except Exception as e:
            logger.error(f"Error initializing WebSocket: {e}")
            return False
    
    def _on_open(self, wsapp):
        """Called when WebSocket connection opens"""
        logger.info("WebSocket connection established")
        self.is_connected = True
        
        # Re-subscribe to any previously subscribed tokens
        if self.subscribed_tokens:
            self._resubscribe_all()
    
    def _on_data(self, wsapp, message):
        """Called when data is received from WebSocket"""
        try:
            # Parse the market data
            data = self._parse_market_data(message)
            
            if data:
                # Notify all registered callbacks
                for callback in self.data_callbacks:
                    try:
                        callback(data)
                    except Exception as e:
                        logger.error(f"Error in data callback: {e}")
                        
        except Exception as e:
            logger.error(f"Error processing WebSocket data: {e}")
    
    def _on_error(self, wsapp, error):
        """Called when WebSocket error occurs"""
        logger.error(f"WebSocket error: {error}")
        self.is_connected = False
    
    def _on_close(self, wsapp):
        """Called when WebSocket connection closes"""
        logger.info("WebSocket connection closed")
        self.is_connected = False
    
    def _parse_market_data(self, message) -> Optional[Dict[str, Any]]:
        """Parse raw WebSocket message to structured data"""
        try:
            # The SmartAPI WebSocket sends binary data that needs to be decoded
            # This is a simplified parser - actual implementation may vary
            if isinstance(message, bytes):
                # Convert bytes to string if needed
                message_str = message.decode('utf-8') if isinstance(message, bytes) else message
                
                # Try to parse as JSON
                if message_str.startswith('{'):
                    data = json.loads(message_str)
                    return {
                        "symbol_token": data.get("tk"),
                        "ltp": data.get("lp"),
                        "open": data.get("o"),
                        "high": data.get("h"),
                        "low": data.get("l"),
                        "close": data.get("c"),
                        "volume": data.get("v"),
                        "timestamp": data.get("ts")
                    }
                else:
                    # Handle binary format if needed
                    logger.debug(f"Received binary data: {len(message)} bytes")
                    return None
            
            return None
            
        except Exception as e:
            logger.error(f"Error parsing market data: {e}")
            return None
    
    async def subscribe_to_instruments(self, instruments: List[Dict[str, str]], mode: int = 1):
        """
        Subscribe to market data for instruments
        
        Args:
            instruments: List of {"exchange": "NSE", "token": "26009"} 
            mode: 1=LTP, 2=Quote, 3=Depth, 4=All
        """
        try:
            if not self.is_connected:
                logger.warning("WebSocket not connected, attempting to initialize")
                await self.initialize()
            
            if not self.websocket:
                logger.error("WebSocket not available")
                return False
            
            # Group instruments by exchange
            exchange_groups = {}
            for instrument in instruments:
                exchange = instrument["exchange"]
                token = instrument["token"]
                
                if exchange not in exchange_groups:
                    exchange_groups[exchange] = []
                exchange_groups[exchange].append(token)
                
                # Store subscription info
                self.subscribed_tokens[token] = {
                    "exchange": exchange,
                    "mode": mode
                }
            
            # Subscribe to each exchange group
            for exchange, tokens in exchange_groups.items():
                exchange_type = self._get_exchange_type(exchange)
                token_list = [{
                    "exchangeType": exchange_type,
                    "tokens": tokens
                }]
                
                correlation_id = f"sub_{exchange}_{len(tokens)}"
                self.websocket.subscribe(correlation_id, mode, token_list)
                
                logger.info(f"Subscribed to {len(tokens)} instruments on {exchange}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error subscribing to instruments: {e}")
            return False
    
    def _get_exchange_type(self, exchange: str) -> int:
        """Get exchange type code for Angel One API"""
        exchange_map = {
            "NSE": 1,
            "BSE": 6,
            "NFO": 2,
            "CDS": 5,
            "MCX": 4
        }
        return exchange_map.get(exchange, 1)  # Default to NSE
    
    def _resubscribe_all(self):
        """Re-subscribe to all previously subscribed tokens"""
        if not self.subscribed_tokens:
            return
            
        # Group by exchange and mode
        resubscribe_groups = {}
        
        for token, info in self.subscribed_tokens.items():
            exchange = info["exchange"]
            mode = info["mode"]
            key = f"{exchange}_{mode}"
            
            if key not in resubscribe_groups:
                resubscribe_groups[key] = {
                    "exchange": exchange,
                    "mode": mode,
                    "tokens": []
                }
            resubscribe_groups[key]["tokens"].append(token)
        
        # Resubscribe each group
        for group_info in resubscribe_groups.values():
            exchange_type = self._get_exchange_type(group_info["exchange"])
            token_list = [{
                "exchangeType": exchange_type,
                "tokens": group_info["tokens"]
            }]
            
            correlation_id = f"resub_{group_info['exchange']}"
            self.websocket.subscribe(correlation_id, group_info["mode"], token_list)
    
    def add_data_callback(self, callback: Callable):
        """Add a callback function to receive market data"""
        self.data_callbacks.append(callback)
    
    def remove_data_callback(self, callback: Callable):
        """Remove a data callback"""
        if callback in self.data_callbacks:
            self.data_callbacks.remove(callback)
    
    async def unsubscribe_from_instruments(self, instruments: List[Dict[str, str]]):
        """Unsubscribe from market data for instruments"""
        try:
            if not self.websocket:
                return False
            
            # Group instruments by exchange
            exchange_groups = {}
            for instrument in instruments:
                exchange = instrument["exchange"]
                token = instrument["token"]
                
                if exchange not in exchange_groups:
                    exchange_groups[exchange] = []
                exchange_groups[exchange].append(token)
                
                # Remove from subscribed tokens
                if token in self.subscribed_tokens:
                    del self.subscribed_tokens[token]
            
            # Unsubscribe from each exchange group
            for exchange, tokens in exchange_groups.items():
                exchange_type = self._get_exchange_type(exchange)
                token_list = [{
                    "exchangeType": exchange_type,
                    "tokens": tokens
                }]
                
                correlation_id = f"unsub_{exchange}_{len(tokens)}"
                self.websocket.unsubscribe(correlation_id, 1, token_list)
                
                logger.info(f"Unsubscribed from {len(tokens)} instruments on {exchange}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error unsubscribing from instruments: {e}")
            return False
    
    def disconnect(self):
        """Disconnect WebSocket"""
        try:
            if self.websocket:
                self.websocket.close_connection()
                self.is_connected = False
                logger.info("WebSocket disconnected")
        except Exception as e:
            logger.error(f"Error disconnecting WebSocket: {e}")


# Global WebSocket manager instance
websocket_manager = WebSocketManager()
