from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from typing import List, Dict, Any
from ..models.holding import Holding
import logging

logger = logging.getLogger(__name__)

class HoldingService:
    @staticmethod
    async def bulk_create_or_update_holdings(
        db: AsyncSession,
        holdings_data: List[Dict[str, Any]],
        user_id: int
    ) -> Dict[str, int]:
        try:
            logger.info(f"Processing {len(holdings_data)} holdings for user {user_id}")

            # Get existing holdings for the user
            existing_holdings_result = await db.execute(
                select(Holding).where(Holding.user_id == user_id)
            )
            existing_holdings = existing_holdings_result.scalars().all()
            
            # Create a map of existing holdings by ISIN and client_id for faster lookup
            existing_map = {}
            for holding in existing_holdings:
                key = f"{holding.isin}_{holding.client_id or 'none'}"
                existing_map[key] = holding

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
            updated_holdings = []
            skipped_count = 0
            
            # Keep track of processed ISINs to handle duplicates within the excel
            processed_keys = set()

            for data in holdings_data:
                isin = data.get('isin')
                client_id = data.get('client_id')
                
                if not isin:
                    logger.warning(f"Skipping entry with missing ISIN")
                    skipped_count += 1
                    continue
                
                # Create unique key for this holding
                key = f"{isin}_{client_id or 'none'}"
                
                # Skip if we've already processed this exact combination in this upload
                if key in processed_keys:
                    logger.warning(f"Skipping duplicate within excel: ISIN {isin}, Client ID {client_id}")
                    skipped_count += 1
                    continue
                
                processed_keys.add(key)

                # Filter out commented fields from the data
                filtered_data = {k: v for k, v in data.items() if k in allowed_fields}
                
                # Log filtered out fields for debugging
                filtered_out = {k: v for k, v in data.items() if k in commented_fields}
                if filtered_out:
                    logger.debug(f"Filtered out commented fields for {isin}: {list(filtered_out.keys())}")

                # Check if this holding already exists
                if key in existing_map:
                    # Update existing holding
                    existing_holding = existing_map[key]
                    
                    # Update all allowed fields from the excel data
                    for field, value in filtered_data.items():
                        if field != 'isin':  # Don't update the ISIN itself
                            setattr(existing_holding, field, value)
                    
                    updated_holdings.append(existing_holding)
                    logger.info(f"Updated existing holding: {existing_holding.company_name} (ISIN: {isin})")
                else:
                    # Create new holding
                    holding = Holding(user_id=user_id, **filtered_data)
                    new_holdings.append(holding)
                    logger.info(f"Creating new holding: {holding.company_name} (ISIN: {isin})")

            # Save all changes
            if new_holdings:
                db.add_all(new_holdings)
            
            if new_holdings or updated_holdings:
                await db.commit()
                logger.info(f"Successfully processed holdings: {len(new_holdings)} created, {len(updated_holdings)} updated, {skipped_count} skipped.")
            else:
                logger.info("No holdings to process.")

            return {
                'created': len(new_holdings),
                'updated': len(updated_holdings),
                'skipped': skipped_count,
                'total_processed': len(new_holdings) + len(updated_holdings)
            }
            
        except Exception as e:
            logger.error(f"Error in bulk_create_or_update_holdings: {str(e)}")
            await db.rollback()
            raise e

    # Keep the old method for backward compatibility
    @staticmethod
    async def bulk_create_holdings(
        db: AsyncSession,
        holdings_data: List[Dict[str, Any]],
        user_id: int
    ) -> List[Holding]:
        result = await HoldingService.bulk_create_or_update_holdings(db, holdings_data, user_id)
        # Return empty list for compatibility, actual results are in the result dict
        return []