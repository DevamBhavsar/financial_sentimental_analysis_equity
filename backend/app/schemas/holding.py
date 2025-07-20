
from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime

class HoldingBase(BaseModel):
    id: int
    user_id: int
    company_name: str
    isin: str
    market_cap: float
    sector: str
    total_quantity: int
    free_quantity: int
    avg_trading_price: float
    ltp: float
    invested_value: float
    market_value: float
    overall_gain_loss: float


    @validator('company_name')
    def name_must_not_be_empty(cls, v):
        if not v or v.strip() == '':
            raise ValueError('Name cannot be empty')
        return v.strip()

    @validator('total_quantity', 'free_quantity')
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        return v

    @validator('avg_trading_price', 'ltp', 'invested_value', 'market_value', 'overall_gain_loss')
    def avg_price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Average price must be greater than 0')
        return v



class HoldingCreate(HoldingBase):
    pass

class HoldingUpdate(HoldingBase):
    pass

class Holding(HoldingBase):
    id: int
    user_id: int
    company_name: str
    client_id : int
    isin: str
    market_cap: float
    sector: str
    total_quantity: int
    # free_quantity: int
    avg_trading_price: float
    ltp: float
    invested_value: float
    market_value: float
    overall_gain_loss: float

    class Config:
        from_attributes = True
