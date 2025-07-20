import strawberry
from strawberry.types import Info
from strawberry.file_uploads import Upload
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy import select, and_
import logging
import json
import hashlib


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
from ..database import get_redis
from .types import (
    User,
    Holding,
    Article,
    Sentiment,
    Watchlist,
    AuthPayload,
    UserInput,
    LoginInput,
    UpdateProfileInput,
    ChangePasswordInput,
    HoldingInput,
    WatchlistInput,
    DashboardData,
    PortfolioSummary,
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
        
        # Try to get data from cache first
        cache_key = f"dashboard:user:{current_user.id}"
        async with get_redis() as redis:
            cached_data = await redis.get(cache_key)
            if cached_data:
                logger.info(f"Dashboard cache hit for user {current_user.id}")
                try:
                    data_dict = json.loads(cached_data)
                    # Reconstruct the response from cached data
                    portfolio = PortfolioSummary(**data_dict["portfolio"])
                    # Holdings are already in GraphQL format from cache
                    holdings = [Holding(**h) for h in data_dict["holdings_graphql"]]
                    return DashboardData(
                        portfolio=portfolio,
                        overallSentiment=data_dict["overallSentiment"],
                        topPerformingAsset=data_dict["topPerformingAsset"],
                        worstPerformingAsset=data_dict["worstPerformingAsset"],
                        totalStocks=data_dict["totalStocks"],
                        sectorsCount=data_dict["sectorsCount"],
                        holdings=holdings
                    )
                except (json.JSONDecodeError, KeyError) as e:
                    logger.warning(f"Cache data corrupted for user {current_user.id}: {e}")
                    await redis.delete(cache_key)

        result = await db.execute(
            select(HoldingModel).where(HoldingModel.user_id == current_user.id)
        )
        holdings = result.scalars().all()

        if not holdings:
            empty_portfolio = PortfolioSummary(
                totalMarketValue=0,
                totalInvestedValue=0,
                totalGainLoss=0,
                totalGainLossPercent=0,
                todaysGainLoss=0,
                todaysGainLossPercent=0,
                totalDividends=0,
                avgGainLossPercent=0
            )
            return DashboardData(
                portfolio=empty_portfolio,
                overallSentiment="N/A",
                topPerformingAsset="N/A",
                worstPerformingAsset="N/A",
                totalStocks=0,
                sectorsCount=0,
                holdings=[]
            )

        # Calculate portfolio metrics
        total_market_value = sum(h.market_value for h in holdings)
        total_invested_value = sum(h.invested_value for h in holdings)
        total_gain_loss = sum(h.overall_gain_loss for h in holdings)
        total_gain_loss_percent = (total_gain_loss / total_invested_value * 100) if total_invested_value > 0 else 0
        
        # Get unique sectors
        sectors = set(h.sector for h in holdings if h.sector)
        
        # Calculate today's gains (placeholder - would need real-time data)
        todays_gain_loss = total_gain_loss * 0.1  # Placeholder
        todays_gain_loss_percent = (todays_gain_loss / total_invested_value * 100) if total_invested_value > 0 else 0
        
        # Calculate average gain/loss percentage across all holdings
        individual_gain_percentages = []
        for h in holdings:
            if h.invested_value > 0:
                individual_gain_percentages.append((h.overall_gain_loss / h.invested_value) * 100)
        
        avg_gain_loss_percent = sum(individual_gain_percentages) / len(individual_gain_percentages) if individual_gain_percentages else 0
        
        top_asset = max(holdings, key=lambda h: h.overall_gain_loss, default=None)
        worst_asset = min(holdings, key=lambda h: h.overall_gain_loss, default=None)

        portfolio = PortfolioSummary(
            totalMarketValue=total_market_value,
            totalInvestedValue=total_invested_value,
            totalGainLoss=total_gain_loss,
            totalGainLossPercent=total_gain_loss_percent,
            todaysGainLoss=todays_gain_loss,
            todaysGainLossPercent=todays_gain_loss_percent,
            totalDividends=0,  # Placeholder
            avgGainLossPercent=avg_gain_loss_percent
        )

        dashboard_data = DashboardData(
            portfolio=portfolio,
            overallSentiment="Neutral", # Placeholder
            topPerformingAsset=top_asset.company_name if top_asset else "N/A",
            worstPerformingAsset=worst_asset.company_name if worst_asset else "N/A",
            totalStocks=len(holdings),
            sectorsCount=len(sectors),
            holdings=[holding_to_graphql(h) for h in holdings],
        )
        
        # Cache the result for 5 minutes
        try:
            cache_data = {
                "portfolio": {
                    "totalMarketValue": total_market_value,
                    "totalInvestedValue": total_invested_value,
                    "totalGainLoss": total_gain_loss,
                    "totalGainLossPercent": total_gain_loss_percent,
                    "todaysGainLoss": todays_gain_loss,
                    "todaysGainLossPercent": todays_gain_loss_percent,
                    "totalDividends": 0,
                    "avgGainLossPercent": avg_gain_loss_percent
                },
                "overallSentiment": "Neutral",
                "topPerformingAsset": top_asset.company_name if top_asset else "N/A",
                "worstPerformingAsset": worst_asset.company_name if worst_asset else "N/A",
                "totalStocks": len(holdings),
                "sectorsCount": len(sectors),
                "holdings_graphql": [holding_to_graphql(h).__dict__ for h in holdings]  # Store GraphQL formatted data
            }
            async with get_redis() as redis:
                await redis.setex(cache_key, 300, json.dumps(cache_data, default=str))  # 5 minutes
                logger.info(f"Dashboard data cached for user {current_user.id}")
        except Exception as e:
            logger.warning(f"Failed to cache dashboard data for user {current_user.id}: {e}")
        
        return dashboard_data
        

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
        db = info.context["db"]
        user = await authenticate_user(db, input.email, input.password)
        if not user:
            raise Exception("Invalid email or password. Please check your credentials and try again.")

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

    @strawberry.field
    async def register(self, info: Info, input: UserInput) -> AuthPayload:
        try:
            if len(input.password) < 8:
                raise Exception("Password must be at least 8 characters long. Please choose a stronger password.")

            db = info.context["db"]

            existing_user = await db.execute(
                select(UserModel).where(UserModel.email == input.email)
            )
            if existing_user.scalar_one_or_none():
                raise Exception("An account with this email address already exists. Please use a different email or try logging in.")

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
            company_name=input.company_name,
            isin=input.isin,
            sector=input.sector,
            total_quantity=input.total_quantity,
            avg_trading_price=input.avg_trading_price,
            ltp=input.ltp,
            invested_value=input.invested_value,
            market_value=input.market_value,
            overall_gain_loss=input.overall_gain_loss,
            client_id=input.client_id,
            market_cap=input.market_cap,
            stcg_quantity=input.stcg_quantity,
            stcg_value=input.stcg_value,
        )

        db.add(holding)
        await db.commit()
        await db.refresh(holding)

        # Invalidate dashboard cache after adding holding
        try:
            cache_key = f"dashboard:user:{current_user.id}"
            async with get_redis() as redis:
                await redis.delete(cache_key)
                logger.info(f"Dashboard cache invalidated after adding holding for user {current_user.id}")
        except Exception as e:
            logger.warning(f"Failed to invalidate cache for user {current_user.id}: {e}")

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
            result = await holding_service.bulk_create_or_update_holdings(
                info.context["db"],
                holdings_data,
                current_user.id
            )
            
            created_count = result['created']
            updated_count = result['updated']
            skipped_count = result['skipped']
            total_processed = result['total_processed']
            
            logger.info(f"Database operations completed. Created: {created_count}, Updated: {updated_count}, Skipped: {skipped_count}")
            
            # Create detailed message
            message_parts = []
            if created_count > 0:
                message_parts.append(f"{created_count} new holdings created")
            if updated_count > 0:
                message_parts.append(f"{updated_count} existing holdings updated")
            if skipped_count > 0:
                message_parts.append(f"{skipped_count} duplicates skipped")
            
            message = "Successfully processed: " + ", ".join(message_parts)
            
            # Invalidate dashboard cache after successful upload
            try:
                cache_key = f"dashboard:user:{current_user.id}"
                async with get_redis() as redis:
                    await redis.delete(cache_key)
                    logger.info(f"Dashboard cache invalidated for user {current_user.id}")
            except Exception as e:
                logger.warning(f"Failed to invalidate cache for user {current_user.id}: {e}")
            
            logger.info("=== UPLOAD_HOLDINGS MUTATION COMPLETED SUCCESSFULLY ===")
            return UploadHoldingsResponse(
                success=True,
                message=message,
                count=total_processed,
                created=created_count,
                updated=updated_count,
                skipped=skipped_count
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
        
        # Invalidate dashboard cache after removing holding
        try:
            cache_key = f"dashboard:user:{current_user.id}"
            async with get_redis() as redis:
                await redis.delete(cache_key)
                logger.info(f"Dashboard cache invalidated after removing holding for user {current_user.id}")
        except Exception as e:
            logger.warning(f"Failed to invalidate cache for user {current_user.id}: {e}")
        
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

    @strawberry.field
    async def update_profile(self, info: Info, input: UpdateProfileInput) -> User:
        current_user = info.context.get("current_user")
        if not current_user:
            raise Exception("Authentication required")
        
        db = info.context["db"]
        
        # Get the user from database
        result = await db.execute(
            select(UserModel).where(UserModel.id == current_user.id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise Exception("User not found")
        
        # Update fields if provided
        if input.first_name is not None:
            user.first_name = input.first_name
        if input.last_name is not None:
            user.last_name = input.last_name
        if input.email is not None:
            # Check if email already exists
            existing_user = await db.execute(
                select(UserModel).where(
                    and_(UserModel.email == input.email, UserModel.id != current_user.id)
                )
            )
            if existing_user.scalar_one_or_none():
                raise Exception("This email address is already registered. Please use a different email address.")
            user.email = input.email
        
        await db.commit()
        await db.refresh(user)
        
        return user_to_graphql(user)

    @strawberry.field
    async def change_password(self, info: Info, input: ChangePasswordInput) -> bool:
        current_user = info.context.get("current_user")
        if not current_user:
            raise Exception("Authentication required")
        
        db = info.context["db"]
        
        # Get the user from database
        result = await db.execute(
            select(UserModel).where(UserModel.id == current_user.id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise Exception("User not found")
        
        # Verify current password
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        if not pwd_context.verify(input.current_password, user.hashed_password):
            raise Exception("Current password is incorrect. Please verify your current password and try again.")
        
        # Update password
        user.hashed_password = get_password_hash(input.new_password)
        await db.commit()
        
        logger.info(f"Password changed for user {current_user.id}")
        return True

from strawberry.schema.config import StrawberryConfig

schema = strawberry.Schema(
    query=Query, 
    mutation=Mutation, 
    config=StrawberryConfig(auto_camel_case=False)
)
