import strawberry
from strawberry.types import Info
from strawberry.file_uploads import Upload
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy import select, and_
import logging


class ValidationError(Exception):
    pass


class ProcessingError(Exception):
    pass

logger = logging.getLogger(__name__)

# Fixed imports
from ..models.user import User as UserModel
from ..models.holding import Holding as HoldingModel
from ..models.article import Article as ArticleModel
from ..models.sentiment import Sentiment as SentimentModel
from ..models.watchlist import Watchlist as WatchlistModel
from ..services.excel_service import ExcelService
from ..services.holding_service import HoldingService

# Fixed auth imports
from ..auth.auth import authenticate_user, create_access_token, get_password_hash
from ..config import settings
from .types import (
    User,
    Holding,
    Article,
    Sentiment,
    Watchlist,
    AuthPayload,
    UserInput,
    LoginInput,
    HoldingInput,
    WatchlistInput,
    DashboardData,
    UploadHoldingsResponse,
)
from .converters import (
    user_to_graphql,
    holding_to_graphql,
    watchlist_to_graphql,
    sentiment_to_graphql,
    article_to_graphql,
)

@strawberry.type
class Query:
    @strawberry.field
    async def dashboard(self, info: Info) -> DashboardData:
        current_user = info.context.get("current_user")
        if not current_user:
            raise Exception("Authentication required")
        db = info.context["db"]

        result = await db.execute(
            select(HoldingModel).where(HoldingModel.user_id == current_user.id)
        )
        holdings = result.scalars().all()

        if not holdings:
            return DashboardData(
                totalMarketValue=0,
                overallSentiment="N/A",
                topPerformingAsset="N/A",
                worstPerformingAsset="N/A",
                holdings=[]
            )

        total_market_value = sum(h.market_value for h in holdings)
        top_asset = max(holdings, key=lambda h: h.overall_gain_loss, default=None)
        worst_asset = min(holdings, key=lambda h: h.overall_gain_loss, default=None)

        return DashboardData(
            totalMarketValue=total_market_value,
            overallSentiment="Neutral", # Placeholder
            topPerformingAsset=top_asset.company_name if top_asset else "N/A",
            worstPerformingAsset=worst_asset.company_name if worst_asset else "N/A",
            holdings=[holding_to_graphql(h) for h in holdings],
        )
        

    @strawberry.field
    async def me(self, info: Info) -> User:
        current_user = info.context.get("current_user")
        if not current_user:
            raise Exception("Authentication required")

        return user_to_graphql(current_user)

    @strawberry.field
    async def holdings(self, info: Info) -> List[Holding]:
        current_user = info.context.get("current_user")
        if not current_user:
            raise Exception("Authentication required")
        db = info.context["db"]
        result = await db.execute(
            select(HoldingModel).where(HoldingModel.user_id == current_user.id)
        )
        holdings_list = result.scalars().all()
        return [holding_to_graphql(h) for h in holdings_list]


    @strawberry.field
    async def watchlist(self, info: Info) -> List[Watchlist]:
        current_user = info.context.get("current_user")
        if not current_user:
            raise Exception("Authentication required")
        db = info.context["db"]

        result = await db.execute(
            select(WatchlistModel).where(WatchlistModel.user_id == current_user.id)
        )
        watchlists = result.scalars().all()

        return [watchlist_to_graphql(w) for w in watchlists]

    @strawberry.field
    async def sentiment_analysis(
        self, info: Info, ticker: str, days: int = 7
    ) -> List[Sentiment]:
        db = info.context["db"]
        since_date = datetime.utcnow() - timedelta(days=days)

        result = await db.execute(
            select(SentimentModel)
            .where(
                and_(
                    SentimentModel.ticker == ticker,
                    SentimentModel.created_at >= since_date,
                )
            )
            .order_by(SentimentModel.created_at.desc())
        )
        sentiments = result.scalars().all()

        return [sentiment_to_graphql(s) for s in sentiments]

    @strawberry.field
    async def recent_articles(
        self, info: Info, ticker: Optional[str] = None, limit: int = 10
    ) -> List[Article]:
        db = info.context["db"]

        query = (
            select(ArticleModel).order_by(ArticleModel.published_at.desc()).limit(limit)
        )
        if ticker:
            query = query.where(ArticleModel.ticker == ticker)

        result = await db.execute(query)
        articles = result.scalars().all()

        return [article_to_graphql(a) for a in articles]

@strawberry.type
class Mutation:
    @strawberry.field
    async def login(self, info: Info, input: LoginInput) -> AuthPayload:
        try:
            db = info.context["db"]
            user = await authenticate_user(db, input.email, input.password)
            if not user:
                raise Exception("Invalid credentials")

            access_token_expires = timedelta(minutes=settings.EXPIRY_MIN)
            access_token = create_access_token(
                data={"sub": user.email}, expires_delta=access_token_expires
            )

            return AuthPayload(
                accessToken=access_token,
                token_type="bearer",
                expires_in=settings.EXPIRY_MIN * 60,
                user=user_to_graphql(user),
            )
        except Exception as e:
            raise Exception(f"Login failed: {str(e)}")

    @strawberry.field
    async def register(self, info: Info, input: UserInput) -> AuthPayload:
        try:
            if len(input.password) < 8:
                raise Exception("Password must be at least 8 characters")

            db = info.context["db"]

            existing_user = await db.execute(
                select(UserModel).where(UserModel.email == input.email)
            )
            if existing_user.scalar_one_or_none():
                raise Exception("User already exists")

            hashed_password = get_password_hash(input.password)
            user = UserModel(
                email=input.email,
                hashed_password=hashed_password,
                first_name=input.first_name,
                last_name=input.last_name,
            )

            db.add(user)
            await db.commit()
            await db.refresh(user)

            access_token_expires = timedelta(minutes=settings.EXPIRY_MIN)
            access_token = create_access_token(
                data={"sub": user.email}, expires_delta=access_token_expires
            )

            return AuthPayload(
                accessToken=access_token,
                token_type="bearer",
                expires_in=settings.EXPIRY_MIN * 60,
                user=user_to_graphql(user),
            )
        except Exception as e:
            raise Exception(f"Registration failed: {str(e)}")

    @strawberry.field
    async def add_holding(self, info: Info, input: HoldingInput) -> Holding:
        current_user = info.context.get("current_user")
        if not current_user:
            raise Exception("Authentication required")

        db = info.context["db"]

        holding = HoldingModel(
            user_id=current_user.id,
            ticker=input.ticker,
            name=input.name,
            quantity=input.quantity,
            avg_price=input.avg_price,
            sector=input.sector,
            holding_type=input.holding_type,
        )

        db.add(holding)
        await db.commit()
        await db.refresh(holding)

        return holding_to_graphql(holding)

    @strawberry.field
    async def upload_holdings(self, info: Info, file: Upload) -> UploadHoldingsResponse:
        logger.info("=== UPLOAD_HOLDINGS MUTATION STARTED ===")
        
        try:
            current_user = info.context.get("current_user")
            if not current_user:
                logger.error("No current user found in context")
                raise ValidationError("Authentication required")
            
            logger.info(f"User authenticated: {current_user.id} - {current_user.email}")
            
            # Log file details
            logger.info(f"Received file: {file.filename}")
            logger.info(f"Content type: {file.content_type}")
            
            # Validate file type
            if not file.filename.lower().endswith(('.xlsx', '.csv')):
                logger.error(f"Invalid file type: {file.filename}")
                raise ValidationError("Only Excel (.xlsx) or CSV files are allowed")
            
            # Read file content to check size
            content = await file.read()
            file_size = len(content)
            logger.info(f"File size: {file_size} bytes ({file_size / (1024*1024):.2f} MB)")
            
            # Reset file pointer
            await file.seek(0)
            
            # Validate file size (10MB limit)
            if file_size > 10 * 1024 * 1024:
                raise ValidationError("File size must be less than 10MB")
            
            # Process file
            logger.info("Starting Excel processing...")
            excel_service = ExcelService()
            holdings_data = await excel_service.read_excel(file, file.filename)
            logger.info(f"Excel processing completed. Found {len(holdings_data)} records")
            
            # Store holdings
            logger.info("Starting database operations...")
            holding_service = HoldingService()
            result = await holding_service.bulk_create_holdings(
                info.context["db"],
                holdings_data,
                current_user.id
            )
            
            success_count = len(result)
            logger.info(f"Database operations completed. Created {success_count} holdings")
            
            logger.info("=== UPLOAD_HOLDINGS MUTATION COMPLETED SUCCESSFULLY ===")
            return UploadHoldingsResponse(
                success=True,
                message=f"Successfully processed {success_count} holdings",
                count=success_count
            )

        except ValidationError as e:
            logger.error(f"Validation error: {str(e)}")
            return UploadHoldingsResponse(
                success=False,
                message=str(e),
                count=0
            )
        except Exception as e:
            logger.error(f"Unexpected error in upload_holdings: {str(e)}", exc_info=True)
            return UploadHoldingsResponse(
                success=False,
                message="An unexpected error occurred. Please try again.",
                count=0
            )
    @strawberry.field
    async def add_to_watchlist(self, info: Info, input: WatchlistInput) -> Watchlist:
        current_user = info.context.get("current_user")
        if not current_user:
            raise Exception("Authentication required")

        db = info.context["db"]

        watchlist = WatchlistModel(
            user_id=current_user.id,
            ticker=input.ticker,
            name=input.name,
            sector=input.sector,
        )

        db.add(watchlist)
        await db.commit()
        await db.refresh(watchlist)

        return watchlist_to_graphql(watchlist)

    @strawberry.field
    async def remove_holding(self, info: Info, id: int) -> bool:
        current_user = info.context.get("current_user")
        if not current_user:
            raise Exception("Authentication required")

        db = info.context["db"]

        result = await db.execute(
            select(HoldingModel).where(
                and_(HoldingModel.id == id, HoldingModel.user_id == current_user.id)
            )
        )
        holding = result.scalar_one_or_none()

        if not holding:
            return False

        await db.delete(holding)
        await db.commit()
        return True

    @strawberry.field
    async def remove_from_watchlist(self, info: Info, id: int) -> bool:
        current_user = info.context.get("current_user")
        if not current_user:
            raise Exception("Authentication required")

        db = info.context["db"]

        result = await db.execute(
            select(WatchlistModel).where(
                and_(WatchlistModel.id == id, WatchlistModel.user_id == current_user.id)
            )
        )
        watchlist = result.scalar_one_or_none()

        if not watchlist:
            return False

        await db.delete(watchlist)
        await db.commit()
        return True

from strawberry.schema.config import StrawberryConfig

schema = strawberry.Schema(
    query=Query, 
    mutation=Mutation, 
    config=StrawberryConfig(auto_camel_case=False)
)
