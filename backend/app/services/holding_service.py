import pandas as pd
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from ..models.holding import Holding
from ..models.user import User
import logging


logger = logging.getLogger(__name__)


class HoldingService:
    
    async def process_excel_upload(
        self, 
        db: AsyncSession, 
        user: User, 
        file_path: str
    ) -> Dict[str, Any]:
        """Process Excel file upload and create holdings"""
        try:
            # Validate file path
            if not file_path or not isinstance(file_path, str):
                return {
                    'success': False,
                    'error': 'Invalid file path'
                }

            # Read Excel file with error handling
            try:
                df = pd.read_excel(file_path)
            except Exception as e:
                return {
                    'success': False,
                    'error': f'Failed to read Excel file: {str(e)}'
                }
            
            # Validate dataframe
            if df.empty:
                return {
                    'success': False,
                    'error': 'Excel file is empty'
                }
            
            required_columns = ['ticker', 'name', 'quantity', 'avg_price']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                return {
                    'success': False,
                    'error': f'Missing required columns: {missing_columns}'
                }
            
            # Clean data
            df = df.dropna(subset=required_columns)
            
            # Process each row
            created_holdings = []
            errors = []
            
            for row_num, (index, row) in enumerate(df.iterrows(), 1):
                try:
                    # Validate numeric values
                    try:
                        quantity = float(row['quantity'])
                        avg_price = float(row['avg_price'])
                        if quantity <= 0 or avg_price <= 0:
                            raise ValueError("Quantity and price must be positive")
                    except (ValueError, TypeError) as e:
                        errors.append(f"Row {row_num}: Invalid quantity or price - {str(e)}")
                        continue

                    # Validate and clean ticker
                    ticker = str(row['ticker']).strip().upper()
                    if not ticker:
                        errors.append(f"Row {row_num}: Empty ticker")
                        continue

                    # Create holding
                    holding = Holding(
                        user_id=user.id,
                        ticker=ticker,
                        name=str(row['name']).strip(),
                        quantity=quantity,
                        avg_price=avg_price,
                        sector=str(row.get('sector', '')).strip() if pd.notna(row.get('sector')) else None,
                        holding_type=str(row.get('holding_type', 'equity')).strip().lower()
                    )
                    
                    db.add(holding)
                    created_holdings.append(holding)
                    
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
            
            if not created_holdings:
                await db.rollback()
                return {
                    'success': False,
                    'error': 'No valid holdings to create',
                    'errors': errors
                }

            # Commit transaction
            try:
                await db.commit()
            except Exception as e:
                await db.rollback()
                return {
                    'success': False,
                    'error': f'Database error: {str(e)}',
                    'errors': errors
                }
            
            return {
                'success': True,
                'created_count': len(created_holdings),
                'errors': errors,
                'message': f'Successfully created {len(created_holdings)} holdings'
            }
            
        except Exception as e:
            logger.error(f"Excel processing failed: {e}")
            await db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
    
    async def get_user_holdings(
        self, 
        db: AsyncSession, 
        user_id: int
    ) -> List[Holding]:
        """Get all holdings for a user"""
        try:
            result = await db.execute(
                select(Holding)
                .where(Holding.user_id == user_id)
                .order_by(Holding.created_at.desc())
            )
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Failed to get user holdings: {e}")
            return []

    async def get_unique_tickers(
        self, 
        db: AsyncSession, 
        user_id: int
    ) -> List[str]:
        """Get unique tickers for a user"""
        try:
            result = await db.execute(
                select(Holding.ticker)
                .where(Holding.user_id == user_id)
                .distinct()
                .order_by(Holding.ticker)
            )
            return [ticker[0] for ticker in result.fetchall()]
        except Exception as e:
            logger.error(f"Failed to get unique tickers: {e}")
            return []

    async def update_holding_price(
        self, 
        db: AsyncSession, 
        holding_id: int, 
        current_price: float
    ) -> Optional[Holding]:
        """Update current price of a holding"""
        try:
            result = await db.execute(
                update(Holding)
                .where(Holding.id == holding_id)
                .values(current_price=current_price)
                .returning(Holding)
            )
            await db.commit()
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Failed to update holding price: {e}")
            await db.rollback()
            return None
