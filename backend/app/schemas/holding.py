from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class HoldingBase(BaseModel):
    ticker: str
    name: str
    quantity: float
    avg_price: float
    sector: Optional[str] = None
    holding_type: str


class HoldingCreate(HoldingBase):
    pass


class HoldingUpdate(HoldingBase):
    pass


class Holding(HoldingBase):
    id: int
    user_id: int
    current_price: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True