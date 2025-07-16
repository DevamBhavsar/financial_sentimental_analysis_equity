from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ArticleBase(BaseModel):
    title: str
    content: Optional[str] = None
    url: str
    source: str
    author: Optional[str] = None
    published_at: datetime
    ticker: Optional[str] = None
    sector: Optional[str] = None


class ArticleCreate(ArticleBase):
    pass


class ArticleResponse(ArticleBase):
    id: int
    is_processed: bool
    created_at: datetime

    class Config:
        from_attributes = True
