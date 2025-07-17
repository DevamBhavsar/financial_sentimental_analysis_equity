import strawberry
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy import select, and_

# Fixed imports
from ..models.user import User as UserModel
from ..models.holding import Holding as HoldingModel
from ..models.article import Article as ArticleModel
from ..models.sentiment import Sentiment as SentimentModel
from ..models.watchlist import Watchlist as WatchlistModel

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
    async def me(self, info: strawberry.Info) -> User:
        if "current_user" not in info.context:
            raise Exception("Authentication required")
        current_user = info.context["current_user"]
        return user_to_graphql(current_user)

    @strawberry.field
    async def holdings(self, info: strawberry.Info) -> List[Holding]:
        if "current_user" not in info.context:
            raise Exception("Authentication required")
        db = info.context["db"]
        current_user = info.context["current_user"]

        result = await db.execute(
            select(HoldingModel).where(HoldingModel.user_id == current_user.id)
        )
        holdings = result.scalars().all()

        return [holding_to_graphql(h) for h in holdings]

    @strawberry.field
    async def watchlist(self, info: strawberry.Info) -> List[Watchlist]:
        if "current_user" not in info.context:
            raise Exception("Authentication required")
        db = info.context["db"]
        current_user = info.context["current_user"]

        result = await db.execute(
            select(WatchlistModel).where(WatchlistModel.user_id == current_user.id)
        )
        watchlists = result.scalars().all()

        return [watchlist_to_graphql(w) for w in watchlists]

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

        return [sentiment_to_graphql(s) for s in sentiments]

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

        return [article_to_graphql(a) for a in articles]


@strawberry.type
class Mutation:
    @strawberry.field
    async def login(self, info: strawberry.Info, input: LoginInput) -> AuthPayload:
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
                access_token=access_token,
                token_type="bearer",
                expires_in=settings.EXPIRY_MIN * 60,
                user=user_to_graphql(user),
            )
        except Exception as e:
            raise Exception(f"Login failed: {str(e)}")

    @strawberry.field
    async def register(self, info: strawberry.Info, input: UserInput) -> AuthPayload:
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
                access_token=access_token,
                token_type="bearer",
                expires_in=settings.EXPIRY_MIN * 60,
                user=user_to_graphql(user),
            )
        except Exception as e:
            raise Exception(f"Registration failed: {str(e)}")

    @strawberry.field
    async def add_holding(self, info: strawberry.Info, input: HoldingInput) -> Holding:
        if "current_user" not in info.context:
            raise Exception("Authentication required")

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

        return holding_to_graphql(holding)

    @strawberry.field
    async def add_to_watchlist(
        self, info: strawberry.Info, input: WatchlistInput
    ) -> Watchlist:
        if "current_user" not in info.context:
            raise Exception("Authentication required")

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

        return watchlist_to_graphql(watchlist)

    @strawberry.field
    async def remove_holding(self, info: strawberry.Info, id: int) -> bool:
        if "current_user" not in info.context:
            raise Exception("Authentication required")

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
        if "current_user" not in info.context:
            raise Exception("Authentication required")

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
