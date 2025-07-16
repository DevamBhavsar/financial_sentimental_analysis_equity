from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from ..models.holding import Holding
from ..schemas.holding import HoldingCreate, HoldingUpdate


class HoldingService:
    @staticmethod
    async def get_holdings_by_user(db: AsyncSession, user_id: int) -> List[Holding]:
        result = await db.execute(
            select(Holding).where(Holding.user_id == user_id)
        )
        return result.scalars().all()

    @staticmethod
    async def create_holding(db: AsyncSession, holding: HoldingCreate, user_id: int) -> Holding:
        db_holding = Holding(**holding.dict(), user_id=user_id)
        db.add(db_holding)
        await db.commit()
        await db.refresh(db_holding)
        return db_holding

    @staticmethod
    async def update_holding(
        db: AsyncSession, holding_id: int, holding: HoldingUpdate
    ) -> Optional[Holding]:
        result = await db.execute(
            select(Holding).where(Holding.id == holding_id)
        )
        db_holding = result.scalar_one_or_none()
        if db_holding:
            update_data = holding.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_holding, key, value)
            await db.commit()
            await db.refresh(db_holding)
        return db_holding

    @staticmethod
    async def delete_holding(db: AsyncSession, holding_id: int) -> bool:
        result = await db.execute(
            select(Holding).where(Holding.id == holding_id)
        )
        db_holding = result.scalar_one_or_none()
        if db_holding:
            await db.delete(db_holding)
            await db.commit()
            return True
        return False