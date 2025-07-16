import strawberry
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy import select, and_

from ..models import (
    User as UserModel,
    Holding as HoldingModel,
    Article as ArticleModel,
    Sentiment as SentimentModel,
    Watchlist as WatchlistModel,
)
from ..auth import authenticate_user, create_access_token, get_password_hash
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
)


# Define GraphQL schema
@strawberry.type
class Query:
    @strawberry.field
    async def me(self, info: strawberry.Info) -> User:
        # Get current user from context
        current_user = info.context["current_user"]
        return User(
            id=current_user.id,
            email=current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            is_active=current_user.is_active,
            created_at=current_user.created_at,
        )

    @strawberry.field
    async def holdings(self, info: strawberry.Info) -> List[Holding]:
        db = info.context["db"]
        current_user = info.context["current_user"]

        result = await db.execute(
            select(HoldingModel).where(HoldingModel.user_id == current_user.id)
        )
        holdings = result.scalars().all()

        return [
            Holding(
                id=h.id,
                user_id=h.user_id,
                ticker=h.ticker,
                name=h.name,
                quantity=h.quantity,
                avg_price=h.avg_price,
                current_price=h.current_price,
                sector=h.sector,
                holding_type=h.holding_type,
                created_at=h.created_at,
                updated_at=h.updated_at,
            )
            for h in holdings
        ]

    @strawberry.field
    async def watchlist(self, info: strawberry.Info) -> List[Watchlist]:
        db = info.context["db"]
        current_user = info.context["current_user"]

        result = await db.execute(
            select(WatchlistModel).where(WatchlistModel.user_id == current_user.id)
        )
        watchlists = result.scalars().all()

        return [
            Watchlist(
                id=w.id,
                user_id=w.user_id,
                ticker=w.ticker,
                name=w.name,
                sector=w.sector,
                created_at=w.created_at,
            )
            for w in watchlists
        ]

    @strawberry.field
    async def sentiment_analysis(
        self, info: strawberry.Info, ticker: str, days: int = 7
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

        return [
            Sentiment(
                id=s.id,
                article_id=s.article_id,
                ticker=s.ticker,
                sentiment_score=s.sentiment_score,
                sentiment_label=s.sentiment_label,
                confidence=s.confidence,
                recommendation=s.recommendation,
                analysis_model=s.analysis_model,
                created_at=s.created_at,
            )
            for s in sentiments
        ]

    @strawberry.field
    async def recent_articles(
        self, info: strawberry.Info, ticker: Optional[str] = None, limit: int = 10
    ) -> List[Article]:
        db = info.context["db"]

        query = (
            select(ArticleModel).order_by(ArticleModel.published_at.desc()).limit(limit)
        )
        if ticker:
            query = query.where(ArticleModel.ticker == ticker)

        result = await db.execute(query)
        articles = result.scalars().all()

        return [
            Article(
                id=a.id,
                title=a.title,
                content=a.content,
                url=a.url,
                source=a.source,
                author=a.author,
                published_at=a.published_at,
                ticker=a.ticker,
                sector=a.sector,
                is_processed=a.is_processed,
                created_at=a.created_at,
            )
            for a in articles
        ]


@strawberry.type
class Mutation:
    @strawberry.field
    async def login(self, info: strawberry.Info, input: LoginInput) -> AuthPayload:
        db = info.context["db"]

        user = await authenticate_user(db, input.email, input.password)
        if not user:
            raise Exception("Invalid credentials")

        access_token_expires = timedelta(minutes=settings.EXPIRY_MIN)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )

        return AuthPayload(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.EXPIRY_MIN * 60,
            user=User(
                id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                is_active=user.is_active,
                created_at=user.created_at,
            ),
        )

    @strawberry.field
    async def register(self, info: strawberry.Info, input: UserInput) -> AuthPayload:
        db = info.context["db"]

        # Check if user already exists
        existing_user = await db.execute(
            select(UserModel).where(UserModel.email == input.email)
        )
        if existing_user.scalar_one_or_none():
            raise Exception("User already exists")

        # Create new user
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

        # Generate token
        access_token_expires = timedelta(minutes=settings.EXPIRY_MIN)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )

        return AuthPayload(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.EXPIRY_MIN * 60,
            user=User(
                id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                is_active=user.is_active,
                created_at=user.created_at,
            ),
        )

    @strawberry.field
    async def add_holding(self, info: strawberry.Info, input: HoldingInput) -> Holding:
        db = info.context["db"]
        current_user = info.context["current_user"]

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

        return Holding(
            id=holding.id,
            user_id=holding.user_id,
            ticker=holding.ticker,
            name=holding.name,
            quantity=holding.quantity,
            avg_price=holding.avg_price,
            current_price=holding.current_price,
            sector=holding.sector,
            holding_type=holding.holding_type,
            created_at=holding.created_at,
            updated_at=holding.updated_at,
        )

    @strawberry.field
    async def add_to_watchlist(
        self, info: strawberry.Info, input: WatchlistInput
    ) -> Watchlist:
        db = info.context["db"]
        current_user = info.context["current_user"]

        watchlist = WatchlistModel(
            user_id=current_user.id,
            ticker=input.ticker,
            name=input.name,
            sector=input.sector,
        )

        db.add(watchlist)
        await db.commit()
        await db.refresh(watchlist)

        return Watchlist(
            id=watchlist.id,
            user_id=watchlist.user_id,
            ticker=watchlist.ticker,
            name=watchlist.name,
            sector=watchlist.sector,
            created_at=watchlist.created_at,
        )

    @strawberry.field
    async def remove_holding(self, info: strawberry.Info, id: int) -> bool:
        db = info.context["db"]
        current_user = info.context["current_user"]

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
    async def remove_from_watchlist(self, info: strawberry.Info, id: int) -> bool:
        db = info.context["db"]
        current_user = info.context["current_user"]

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


schema = strawberry.Schema(query=Query, mutation=Mutation)
