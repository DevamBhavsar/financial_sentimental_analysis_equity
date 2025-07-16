from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ArticleBase(BaseModel):
    title: str
    url: str
    source: str
    published_at: datetime
    content: Optional[str] = None
    author: Optional[str] = None
    ticker: Optional[str] = None
    sector: Optional[str] = None


class ArticleCreate(ArticleBase):
    pass


class ArticleUpdate(ArticleBase):
    is_processed: bool


class Article(ArticleBase):
    id: int
    is_processed: bool
    created_at: datetime

    class Config:
        orm_mode = True