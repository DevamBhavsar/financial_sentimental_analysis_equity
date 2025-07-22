import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Type, Union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import json

# Import the Redis dependency
from ..database import get_redis
from ..models.holding import Holding
from .market_service import market_service
from .symbol_service import symbol_service

logger = logging.getLogger(__name__)


# Helper function to safely cast values
def safe_cast(
    value: Any, cast_type: Union[Type[int], Type[float]], default: Union[int, float] = 0
) -> Union[int, float]:
    if value is None:
        return default
    try:
        return cast_type(value)
    except (ValueError, TypeError):
        return default


class PortfolioRefreshService:
    def __init__(self):
        self.last_refresh_time: Optional[datetime] = None

    async def refresh_all_holdings(
        self, user_id: int, db: AsyncSession
    ) -> Dict[str, Any]:
        updated_count = 0
        failed_updates = []

        try:
            if not market_service._authenticated:
                await market_service.authenticate()

            result = await db.execute(select(Holding).where(Holding.user_id == user_id))
            holdings = result.scalars().all()

            if not holdings:
                return {
                    "success": True,
                    "message": "No holdings to refresh.",
                    "updated_count": 0,
                }

            token_to_holding_map = {}
            unique_holdings = {h.company_name: h for h in holdings if h.company_name}

            for name, holding in unique_holdings.items():
                token = await symbol_service.get_token_by_name(name)
                if token:
                    token_to_holding_map[token] = holding
                else:
                    failed_updates.append(
                        f"{name}: Could not find a matching symbol token."
                    )

            if not token_to_holding_map:
                return {
                    "success": False,
                    "message": "Could not find any valid symbols for the holdings.",
                    "updated_count": 0,
                    "failed_updates": failed_updates,
                }

            exchange_tokens = {"NSE": list(token_to_holding_map.keys())}
            market_data = await market_service.get_market_data("FULL", exchange_tokens)

            if not market_data or not market_data.get("fetched"):
                return {
                    "success": False,
                    "message": "API call succeeded but failed to fetch market data.",
                    "updated_count": 0,
                }

            fetched_data_map = {
                item["symbolToken"]: item for item in market_data.get("fetched", [])
            }

            for token, holding_data in fetched_data_map.items():
                if token in token_to_holding_map:
                    holding = token_to_holding_map[token]
                    try:
                        new_ltp = safe_cast(
                            holding_data.get("ltp"), float, holding.ltp or 0
                        )
                        new_market_value = (holding.total_quantity or 0) * new_ltp
                        new_gain_loss = new_market_value - (holding.invested_value or 0)

                        await db.execute(
                            update(Holding)
                            .where(Holding.id == holding.id)
                            .values(
                                ltp=new_ltp,
                                market_value=new_market_value,
                                overall_gain_loss=new_gain_loss,
                                open=safe_cast(holding_data.get("open"), float),
                                high=safe_cast(holding_data.get("high"), float),
                                low=safe_cast(holding_data.get("low"), float),
                                close=safe_cast(holding_data.get("close"), float),
                                trade_volume=safe_cast(
                                    holding_data.get("tradeVolume"), int
                                ),
                                year_high=safe_cast(
                                    holding_data.get("52WeekHigh"), float
                                ),
                                year_low=safe_cast(
                                    holding_data.get("52WeekLow"), float
                                ),
                                total_buy_quantity=safe_cast(
                                    holding_data.get("totBuyQuan"), int
                                ),
                                total_sell_quantity=safe_cast(
                                    holding_data.get("totSellQuan"), int
                                ),
                            )
                        )
                        updated_count += 1
                    except Exception as e:
                        logger.error(
                            f"Error processing DB update for {holding.company_name}: {e}",
                            exc_info=True,
                        )
                        failed_updates.append(
                            f"{holding.company_name}: Database update error"
                        )

            await db.commit()
            self.last_refresh_time = datetime.now()

            # --- THE FINAL FIX: Invalidate the dashboard cache after updating the database ---
            try:
                cache_key = f"dashboard:user:{user_id}"
                async with get_redis() as redis:
                    await redis.delete(cache_key)
                    logger.info(
                        f"Dashboard cache invalidated for user {user_id} after portfolio refresh."
                    )
            except Exception as e:
                logger.warning(
                    f"Failed to invalidate dashboard cache for user {user_id}: {e}"
                )
            # ------------------------------------------------------------------------------------

            return {
                "success": True,
                "message": f"Successfully updated {updated_count} holdings.",
                "updated_count": updated_count,
                "failed_count": len(failed_updates),
                "failed_updates": failed_updates,
                "last_updated": self.last_refresh_time.isoformat(),
            }

        except Exception as e:
            logger.error(
                f"Critical error in portfolio refresh service: {e}", exc_info=True
            )
            await db.rollback()
            return {
                "success": False,
                "message": "A critical server error occurred.",
                "updated_count": 0,
            }

    async def get_last_refresh_info(self) -> Dict[str, Any]:
        return {
            "last_updated": (
                self.last_refresh_time.isoformat() if self.last_refresh_time else None
            ),
            "is_authenticated": market_service._authenticated,
        }


# Global instance
portfolio_refresh_service = PortfolioRefreshService()
