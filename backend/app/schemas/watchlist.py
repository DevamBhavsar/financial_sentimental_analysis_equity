from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class WatchlistBase(BaseModel):
    ticker: str
    name: str
    sector: Optional[str] = None


class WatchlistCreate(WatchlistBase):
    pass


class Watchlist(WatchlistBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
