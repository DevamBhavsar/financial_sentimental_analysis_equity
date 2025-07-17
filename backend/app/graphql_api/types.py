import strawberry
from typing import Optional
from datetime import datetime


@strawberry.type
class User:
    id: int
    email: str
    first_name: str
    last_name: str
    is_active: bool
    created_at: datetime


@strawberry.type
class Holding:
    id: int
    user_id: int
    ticker: str
    name: str
    quantity: float
    avg_price: float
    current_price: Optional[float]
    sector: Optional[str]
    holding_type: str
    created_at: datetime
    updated_at: Optional[datetime]


@strawberry.type
class Article:
    id: int
    title: str
    content: Optional[str]
    url: str
    source: str
    author: Optional[str]
    published_at: datetime
    ticker: Optional[str]
    sector: Optional[str]
    is_processed: bool
    created_at: datetime


@strawberry.type
class Sentiment:
    id: int
    article_id: int
    ticker: str
    sentiment_score: float
    sentiment_label: str
    confidence: float
    recommendation: str
    analysis_model: str
    created_at: datetime


@strawberry.type
class Watchlist:
    id: int
    user_id: int
    ticker: str
    name: str
    sector: Optional[str]
    created_at: datetime


@strawberry.type
class AuthPayload:
    access_token: str
    token_type: str
    expires_in: int
    user: User


@strawberry.input
class UserInput:
    email: str
    password: str
    first_name: str
    last_name: str


@strawberry.input
class LoginInput:
    email: str
    password: str


@strawberry.input
class HoldingInput:
    ticker: str
    name: str
    quantity: float
    avg_price: float
    sector: Optional[str] = None
    holding_type: str


@strawberry.input
class WatchlistInput:
    ticker: str
    name: str
    sector: Optional[str] = None
