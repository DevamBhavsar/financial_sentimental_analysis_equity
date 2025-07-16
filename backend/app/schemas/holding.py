from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class HoldingBase(BaseModel):
    ticker: str
    name: str
    quantity: float
    avg_price: float
    sector: Optional[str] = None
    holding_type: str  # 'equity' or 'mutual_fund'


class HoldingCreate(HoldingBase):
    pass


class HoldingUpdate(BaseModel):
    quantity: Optional[float] = None
    avg_price: Optional[float] = None
    current_price: Optional[float] = None


class HoldingResponse(HoldingBase):
    id: int
    user_id: int
    current_price: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
