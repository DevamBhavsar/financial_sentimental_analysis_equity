from pydantic import BaseModel, validator, Field
from typing import Optional
from datetime import datetime

class HoldingBase(BaseModel):
    company_name: str
    isin: str
    sector: str
    total_quantity: int
    avg_trading_price: float
    ltp: float
    invested_value: float
    market_value: float
    overall_gain_loss: float
    
    # Optional fields that might not always be present (aligned with SQLAlchemy model)
    client_id: Optional[str] = None
    market_cap: Optional[float] = None
    stcg_quantity: Optional[int] = None
    stcg_value: Optional[float] = None
    
    # Commented fields for future use - uncomment when model is updated
    # free_quantity: Optional[int] = None
    # unsettled_quantity: Optional[int] = None
    # margin_pledged_quantity: Optional[int] = None
    # paylater_mtf_quantity: Optional[int] = None
    # unpaid_cusa_qty: Optional[int] = None
    # blocked_qty: Optional[int] = None
    # ltcg_quantity: Optional[int] = None
    # ltcg_value: Optional[float] = None
    
    @validator('company_name')
    def name_must_not_be_empty(cls, v):
        if not v or v.strip() == '':
            raise ValueError('Company name cannot be empty')
        return v.strip()
    
    @validator('total_quantity')
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Total quantity must be greater than 0')
        return v
    
    @validator('avg_trading_price', 'ltp')
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Price must be greater than 0')
        return v
    
    @validator('invested_value', 'market_value')
    def value_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Value must be greater than 0')
        return v

class HoldingCreate(HoldingBase):
    user_id: int

class HoldingUpdate(BaseModel):
    company_name: Optional[str] = None
    isin: Optional[str] = None
    sector: Optional[str] = None
    total_quantity: Optional[int] = None
    avg_trading_price: Optional[float] = None
    ltp: Optional[float] = None
    invested_value: Optional[float] = None
    market_value: Optional[float] = None
    overall_gain_loss: Optional[float] = None
    client_id: Optional[str] = None
    market_cap: Optional[float] = None
    stcg_quantity: Optional[int] = None
    stcg_value: Optional[float] = None
    
    # Commented fields for future use - uncomment when model is updated
    # free_quantity: Optional[int] = None
    # unsettled_quantity: Optional[int] = None
    # margin_pledged_quantity: Optional[int] = None
    # paylater_mtf_quantity: Optional[int] = None
    # unpaid_cusa_qty: Optional[int] = None
    # blocked_qty: Optional[int] = None
    # ltcg_quantity: Optional[int] = None
    # ltcg_value: Optional[float] = None
    
    @validator('company_name')
    def name_must_not_be_empty(cls, v):
        if v is not None and (not v or v.strip() == ''):
            raise ValueError('Company name cannot be empty')
        return v.strip() if v else v
    
    @validator('total_quantity')
    def quantity_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Total quantity must be greater than 0')
        return v
    
    @validator('avg_trading_price', 'ltp')
    def price_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Price must be greater than 0')
        return v
    
    @validator('invested_value', 'market_value')
    def value_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Value must be greater than 0')
        return v

class Holding(HoldingBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True