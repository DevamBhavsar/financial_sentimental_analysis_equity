import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from ..database import get_db
from ..models.holding import Holding
from .market_service import market_service

logger = logging.getLogger(__name__)


class PortfolioRefreshService:
    """Service to refresh portfolio holdings with latest market data"""
    
    def __init__(self):
        self.last_refresh_time: Optional[datetime] = None
        
    async def refresh_all_holdings(self, user_id: int, db: AsyncSession) -> Dict[str, Any]:
        """Refresh all holdings for a user with latest market data"""
        updated_count = 0
        failed_updates = []
        
        try:
            # Authenticate with Angel One if not already done
            if not market_service._authenticated:
                auth_success = await market_service.authenticate()
                if not auth_success:
                    logger.warning("Could not authenticate with Angel One API")
                    return {
                        "success": False,
                        "message": "Could not connect to market data provider",
                        "updated_count": 0,
                        "last_updated": None
                    }
            
            # Get all holdings for the user
            result = await db.execute(
                select(Holding).where(Holding.user_id == user_id)
            )
            holdings = result.scalars().all()
            
            if not holdings:
                return {
                    "success": True,
                    "message": "No holdings found to refresh",
                    "updated_count": 0,
                    "last_updated": datetime.now().isoformat()
                }
            

            
            # Process holdings in batches to avoid overwhelming the API
            batch_size = 10
            for i in range(0, len(holdings), batch_size):
                batch = holdings[i:i + batch_size]
                
                # Search for each holding to get current token
                for holding in batch:
                    try:
                        # Search for the instrument using company name
                        search_results = await market_service.search_instruments(
                            query=holding.company_name,
                            exchange="NSE"
                        )
                        
                        if search_results:
                            # Find the best match (exact or closest)
                            best_match = self._find_best_match(holding.company_name, search_results)
                            
                            if best_match:
                                symbol_token = best_match.get('symboltoken')
                                exchange = best_match.get('exchange', 'NSE')
                                
                                if symbol_token:
                                    # Get current LTP
                                    current_ltp = await market_service.get_ltp(
                                        symbol_token=str(symbol_token),
                                        exchange=str(exchange)
                                    )
                                    
                                    if current_ltp and current_ltp > 0:
                                        # Update holding with new LTP
                                        new_market_value = holding.total_quantity * current_ltp
                                        new_gain_loss = new_market_value - holding.invested_value
                                        
                                        # Update the database
                                        result = await db.execute(
                                            update(Holding)
                                            .where(Holding.id == holding.id)
                                            .values(
                                                ltp=current_ltp,
                                                market_value=new_market_value,
                                                overall_gain_loss=new_gain_loss
                                            )
                                        )
                                        
                                        # Verify the update was successful
                                        if result.rowcount > 0:
                                            updated_count += 1
                                            logger.info(f"Updated {holding.company_name}: LTP ₹{current_ltp}")
                                        else:
                                            failed_updates.append(f"{holding.company_name}: Database update failed")
                                    else:
                                        failed_updates.append(f"{holding.company_name}: Could not fetch LTP")
                                else:
                                    failed_updates.append(f"{holding.company_name}: No symbol token found")
                            else:
                                failed_updates.append(f"{holding.company_name}: No matching instrument found")
                        else:
                            failed_updates.append(f"{holding.company_name}: Search returned no results")
                            
                    except Exception as e:
                        logger.error(f"Error updating {holding.company_name}: {e}")
                        failed_updates.append(f"{holding.company_name}: {str(e)}")
                
                # Small delay between batches to be respectful to the API
                if i + batch_size < len(holdings):
                    await asyncio.sleep(1)
            
            # Flush changes to ensure they're written to the database
            await db.flush()
            
            # Commit all changes
            await db.commit()
            self.last_refresh_time = datetime.now()
            
            logger.info(f"Portfolio refresh completed: {updated_count} updated, {len(failed_updates)} failed")
            
            return {
                "success": True,
                "message": f"Successfully updated {updated_count} holdings",
                "updated_count": updated_count,
                "failed_count": len(failed_updates),
                "failed_updates": failed_updates[:5],  # Show first 5 failures
                "last_updated": self.last_refresh_time.isoformat(),
                "total_holdings": len(holdings)
            }
            
        except Exception as e:
            logger.error(f"Error refreshing portfolio: {e}")
            try:
                await db.rollback()
            except Exception as rollback_error:
                logger.error(f"Error during rollback: {rollback_error}")
            
            return {
                "success": False,
                "message": f"Error refreshing portfolio: {str(e)}",
                "updated_count": updated_count,  # Show partial updates that occurred
                "failed_count": len(failed_updates),
                "last_updated": None
            }
    
    def _find_best_match(self, company_name: str, search_results: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Find the best matching instrument from search results"""
        company_lower = company_name.lower()
        
        # First, try exact match on trading symbol or name
        for result in search_results:
            symbol = result.get('tradingsymbol', '').lower()
            name = result.get('name', '').lower()
            
            if (symbol == company_lower or 
                name == company_lower or
                company_lower in symbol or
                company_lower in name):
                return result
        
        # If no exact match, return the first equity instrument
        for result in search_results:
            if result.get('instrumenttype', '').upper() == 'EQ':
                return result
        
        # Last resort: return first result
        return search_results[0] if search_results else None
    
    async def get_last_refresh_info(self) -> Dict[str, Any]:
        """Get information about the last refresh"""
        return {
            "last_updated": self.last_refresh_time.isoformat() if self.last_refresh_time else None,
            "is_authenticated": market_service._authenticated
        }


# Global instance
portfolio_refresh_service = PortfolioRefreshService()
