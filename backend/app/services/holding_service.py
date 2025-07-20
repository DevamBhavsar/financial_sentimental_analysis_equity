from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any
from ..models.holding import Holding
import logging

logger = logging.getLogger(__name__)

class HoldingService:
    @staticmethod
    async def bulk_create_holdings(
        db: AsyncSession,
        holdings_data: List[Dict[str, Any]],
        user_id: int
    ) -> List[Holding]:
        try:
            logger.info(f"Creating {len(holdings_data)} holdings for user {user_id}")

            existing_isins = await db.execute(
                select(Holding.isin).where(Holding.user_id == user_id)
            )
            existing_isin_set = set(row[0] for row in existing_isins.fetchall())

            # Define the fields that are currently active in the SQLAlchemy model
            allowed_fields = {
                'client_id', 'company_name', 'isin', 'market_cap', 'sector',
                'total_quantity', 'avg_trading_price', 'ltp', 'invested_value',
                'market_value', 'overall_gain_loss', 'stcg_quantity', 'stcg_value'
            }
            
            # Fields that are commented out in the model (will be filtered out)
            commented_fields = {
                'free_quantity', 'unsettled_quantity', 'margin_pledged_quantity',
                'paylater_mtf_quantity', 'unpaid_cusa_qty', 'blocked_qty',
                'ltcg_quantity', 'ltcg_value'
            }

            new_holdings = []
            skipped_count = 0

            for data in holdings_data:
                isin = data.get('isin')
                if not isin or isin in existing_isin_set:
                    logger.warning(f"Skipping duplicate or invalid ISIN: {isin}")
                    skipped_count += 1
                    continue

                # Filter out commented fields from the data
                filtered_data = {k: v for k, v in data.items() if k in allowed_fields}
                
                # Log filtered out fields for debugging
                filtered_out = {k: v for k, v in data.items() if k in commented_fields}
                if filtered_out:
                    logger.debug(f"Filtered out commented fields for {isin}: {list(filtered_out.keys())}")

                holding = Holding(user_id=user_id, **filtered_data)
                new_holdings.append(holding)
                existing_isin_set.add(isin)

            if new_holdings:
                db.add_all(new_holdings)
                await db.commit()
                logger.info(f"Successfully created {len(new_holdings)} holdings, skipped {skipped_count} duplicates.")
            else:
                logger.info("No new holdings to create.")

            return new_holdings
        except Exception as e:
            logger.error(f"Error in bulk_create_holdings: {str(e)}")
            await db.rollback()
            raise e