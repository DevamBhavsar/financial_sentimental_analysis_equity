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
    sector: str = strawberry.field(name="sector")
    total_quantity: int = strawberry.field(name="total_quantity")
    avg_trading_price: float = strawberry.field(name="avg_trading_price")
    ltp: float = strawberry.field(name="ltp")
    invested_value: float = strawberry.field(name="invested_value")
    market_value: float = strawberry.field(name="market_value")
    overall_gain_loss: float = strawberry.field(name="overall_gain_loss")
    
    # Optional fields that might not always be present
    client_id: Optional[str] = strawberry.field(name="client_id", default=None)
    market_cap: Optional[float] = strawberry.field(name="market_cap", default=None)
    stcg_quantity: Optional[int] = strawberry.field(name="stcg_quantity", default=None)
    stcg_value: Optional[float] = strawberry.field(name="stcg_value", default=None)
    
    # Commented fields for future use
    # free_quantity: Optional[int] = strawberry.field(name="free_quantity", default=None)
    # unsettled_quantity: Optional[int] = strawberry.field(name="unsettled_quantity", default=None)
    # margin_pledged_quantity: Optional[int] = strawberry.field(name="margin_pledged_quantity", default=None)
    # paylater_mtf_quantity: Optional[int] = strawberry.field(name="paylater_mtf_quantity", default=None)
    # unpaid_cusa_qty: Optional[int] = strawberry.field(name="unpaid_cusa_qty", default=None)
    # blocked_qty: Optional[int] = strawberry.field(name="blocked_qty", default=None)
    # ltcg_quantity: Optional[int] = strawberry.field(name="ltcg_quantity", default=None)
    # ltcg_value: Optional[float] = strawberry.field(name="ltcg_value", default=None)

@strawberry.input
class HoldingInput:
    company_name: str
    isin: str
    sector: str
    total_quantity: int
    avg_trading_price: float
    ltp: float
    invested_value: float
    market_value: float
    overall_gain_loss: float
    
    # Optional fields
    client_id: Optional[str] = None
    market_cap: Optional[float] = None
    stcg_quantity: Optional[int] = None
    stcg_value: Optional[float] = None

@strawberry.input
class HoldingUpdateInput:
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