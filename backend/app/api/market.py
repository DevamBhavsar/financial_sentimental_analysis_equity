from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
import json
import logging

from ..services.market_service import market_service
from ..services.websocket_service import websocket_manager
from ..services.portfolio_refresh_service import portfolio_refresh_service
from ..database import get_db
from ..auth.auth import get_current_user
from ..models.user import User


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/market", tags=["market"])


class InstrumentSearch(BaseModel):
    query: str
    exchange: str = "NSE"


class HistoricalPriceRequest(BaseModel):
    symbol_token: str
    exchange: str
    date: datetime


class WebSocketSubscription(BaseModel):
    instruments: List[Dict[str, str]]  # [{"exchange": "NSE", "token": "26009"}]
    mode: int = 1  # 1=LTP, 2=Quote, 3=Depth, 4=All


class StockInfo(BaseModel):
    symbol: str
    name: str
    token: str
    exchange: str
    ltp: Optional[float] = None


# Active WebSocket connections for broadcasting
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        for connection in self.active_connections.copy():
            try:
                await connection.send_text(json.dumps(data))
            except Exception as e:
                logger.error(f"Error broadcasting to WebSocket: {e}")
                self.disconnect(connection)


connection_manager = ConnectionManager()


@router.get("/status")
async def get_market_status():
    """Get current market status"""
    try:
        status = market_service.is_market_open()
        return {"success": True, "data": status}
    except Exception as e:
        logger.error(f"Error getting market status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get market status")


@router.post("/search")
async def search_instruments(request: InstrumentSearch):
    """Search for instruments by name or symbol"""
    try:
        instruments = await market_service.search_instruments(
            query=request.query,
            exchange=request.exchange
        )
        
        # Format response for frontend dropdown
        formatted_instruments = []
        for instrument in instruments:
            formatted_instruments.append({
                "symbol": instrument.get("tradingsymbol", ""),
                "name": instrument.get("name", instrument.get("tradingsymbol", "")),
                "token": instrument.get("symboltoken", ""),
                "exchange": instrument.get("exchange", request.exchange),
                "instrument_type": instrument.get("instrumenttype", ""),
                "lot_size": instrument.get("lotsize", 1)
            })
        
        return {"success": True, "data": formatted_instruments}
        
    except Exception as e:
        logger.error(f"Error searching instruments: {e}")
        raise HTTPException(status_code=500, detail="Failed to search instruments")


@router.post("/historical-price")
async def get_historical_price(request: HistoricalPriceRequest):
    """Get historical price for a specific date"""
    try:
        price = await market_service.get_historical_price(
            symbol_token=request.symbol_token,
            exchange=request.exchange,
            date=request.date
        )
        
        if price is None:
            raise HTTPException(status_code=404, detail="Historical price not found for the given date")
        
        return {"success": True, "data": {"price": price, "date": request.date.isoformat()}}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting historical price: {e}")
        raise HTTPException(status_code=500, detail="Failed to get historical price")


@router.get("/ltp/{symbol_token}")
async def get_current_ltp(symbol_token: str, exchange: str = "NSE"):
    """Get current Last Traded Price"""
    try:
        ltp = await market_service.get_ltp(symbol_token=symbol_token, exchange=exchange)
        
        if ltp is None:
            raise HTTPException(status_code=404, detail="LTP not found")
        
        return {"success": True, "data": {"ltp": ltp, "symbol_token": symbol_token}}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting LTP: {e}")
        raise HTTPException(status_code=500, detail="Failed to get LTP")


@router.post("/websocket/subscribe")
async def subscribe_to_market_data(request: WebSocketSubscription):
    """Subscribe to real-time market data via WebSocket"""
    try:
        # Initialize WebSocket if not already done
        if not websocket_manager.is_connected:
            success = await websocket_manager.initialize()
            if not success:
                raise HTTPException(status_code=500, detail="Failed to initialize WebSocket connection")
        
        # Subscribe to instruments
        success = await websocket_manager.subscribe_to_instruments(
            instruments=request.instruments,
            mode=request.mode
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to subscribe to instruments")
        
        return {"success": True, "message": f"Subscribed to {len(request.instruments)} instruments"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error subscribing to market data: {e}")
        raise HTTPException(status_code=500, detail="Failed to subscribe to market data")


@router.post("/websocket/unsubscribe")
async def unsubscribe_from_market_data(request: WebSocketSubscription):
    """Unsubscribe from real-time market data"""
    try:
        success = await websocket_manager.unsubscribe_from_instruments(request.instruments)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to unsubscribe from instruments")
        
        return {"success": True, "message": f"Unsubscribed from {len(request.instruments)} instruments"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unsubscribing from market data: {e}")
        raise HTTPException(status_code=500, detail="Failed to unsubscribe from market data")


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time market data"""
    await connection_manager.connect(websocket)
    
    try:
        # Add callback to forward Angel One data to connected clients
        def market_data_callback(data: Dict[str, Any]):
            # Schedule broadcasting (since we're in a different thread)
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                asyncio.create_task(connection_manager.broadcast({
                    "type": "market_data",
                    "data": data
                }))
            except RuntimeError:
                # If no event loop in current thread, skip broadcasting
                pass
        
        websocket_manager.add_data_callback(market_data_callback)
        
        # Keep connection alive and handle client messages
        while True:
            try:
                # Wait for client messages (for heartbeat or additional commands)
                data = await websocket.receive_text()
                message = json.loads(data)
                
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                    
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON format"
                }))
                
    except WebSocketDisconnect:
        logger.info("Client disconnected from WebSocket")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        connection_manager.disconnect(websocket)
        # Remove callback when client disconnects
        try:
            websocket_manager.remove_data_callback(market_data_callback)
        except:
            pass


@router.get("/websocket/status")
async def get_websocket_status():
    """Get WebSocket connection status"""
    return {
        "success": True,
        "data": {
            "is_connected": websocket_manager.is_connected,
            "subscribed_instruments": len(websocket_manager.subscribed_tokens),
            "active_connections": len(connection_manager.active_connections)
        }
    }


@router.post("/authenticate")
async def authenticate_market_service():
    """Manually trigger authentication with Angel One API"""
    try:
        success = await market_service.authenticate()
        if success:
            return {"success": True, "message": "Successfully authenticated with Angel One API"}
        else:
            raise HTTPException(status_code=401, detail="Authentication failed")
    except Exception as e:
        logger.error(f"Error during authentication: {e}")
        raise HTTPException(status_code=500, detail="Authentication error")


@router.post("/refresh-portfolio")
async def refresh_portfolio_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Refresh all portfolio holdings with latest market data from Angel One"""
    try:
        result = await portfolio_refresh_service.refresh_all_holdings(
            user_id=current_user.id,
            db=db
        )
        
        if result["success"]:
            return {"success": True, "data": result}
        else:
            raise HTTPException(status_code=500, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error refreshing portfolio: {e}")
        raise HTTPException(status_code=500, detail="Failed to refresh portfolio data")


@router.get("/refresh-status")
async def get_refresh_status():
    """Get the status of the last portfolio refresh"""
    try:
        status = await portfolio_refresh_service.get_last_refresh_info()
        return {"success": True, "data": status}
    except Exception as e:
        logger.error(f"Error getting refresh status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get refresh status")
