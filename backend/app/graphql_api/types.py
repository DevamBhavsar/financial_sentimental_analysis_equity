import strawberry
from strawberry.file_uploads import Upload
from typing import List, Optional
from datetime import datetime

# Auth Types
@strawberry.type
class User:
    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

@strawberry.input
class UserInput:
    email: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

@strawberry.input
class LoginInput:
    email: str
    password: str

@strawberry.type
class AuthPayload:
    accessToken: str
    token_type: str
    expires_in: int
    user: User

# Holding Types
@strawberry.type
class Holding:
    id: int = strawberry.field(name="id")
    user_id: int = strawberry.field(name="user_id")
    company_name: str = strawberry.field(name="company_name")
    isin: str = strawberry.field(name="isin")
    market_cap: float = strawberry.field(name="market_cap")
    sector: str = strawberry.field(name="sector")
    total_quantity: int = strawberry.field(name="total_quantity")
    free_quantity: int = strawberry.field(name="free_quantity")
    avg_trading_price: float = strawberry.field(name="avg_trading_price")
    ltp: float = strawberry.field(name="ltp")
    invested_value: float = strawberry.field(name="invested_value")
    market_value: float = strawberry.field(name="market_value")
    overall_gain_loss: float = strawberry.field(name="overall_gain_loss")

@strawberry.input
class HoldingInput:
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

# Watchlist Types
@strawberry.type
class Watchlist:
    id: int
    user_id: int
    ticker: str
    name: str
    sector: Optional[str] = None
    created_at: datetime

@strawberry.input
class WatchlistInput:
    ticker: str
    name: str
    sector: str

# Other Data Types
@strawberry.type
class Article:
    id: int
    title: str
    content: Optional[str] = None
    url: str
    source: str
    author: Optional[str] = None
    published_at: datetime
    ticker: Optional[str] = None
    sector: Optional[str] = None
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
class DashboardData:
    totalMarketValue: float
    overallSentiment: str
    topPerformingAsset: str
    worstPerformingAsset: str
    holdings: List[Holding]

@strawberry.type
class UploadHoldingsResponse:
    success: bool
    message: str
    count: Optional[int] = 0
