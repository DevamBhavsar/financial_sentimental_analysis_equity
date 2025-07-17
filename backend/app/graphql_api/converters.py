from ..models.user import User as UserModel
from ..models.holding import Holding as HoldingModel
from ..models.article import Article as ArticleModel
from ..models.sentiment import Sentiment as SentimentModel
from ..models.watchlist import Watchlist as WatchlistModel
from .types import User, Holding, Article, Sentiment, Watchlist


def user_to_graphql(user: UserModel) -> User:
    """Convert SQLAlchemy User model to GraphQL User type."""
    return User(
        id=int(user.id),  # type: ignore
        email=str(user.email),  # type: ignore
        first_name=str(user.first_name),  # type: ignore
        last_name=str(user.last_name),  # type: ignore
        is_active=bool(user.is_active),  # type: ignore
        created_at=user.created_at,  # type: ignore
    )


def holding_to_graphql(holding: HoldingModel) -> Holding:
    """Convert SQLAlchemy Holding model to GraphQL Holding type."""
    return Holding(
        id=int(holding.id),  # type: ignore
        user_id=int(holding.user_id),  # type: ignore
        ticker=str(holding.ticker),  # type: ignore
        name=str(holding.name),  # type: ignore
        quantity=float(holding.quantity),  # type: ignore
        avg_price=float(holding.avg_price),  # type: ignore
        current_price=(
            float(holding.current_price) if holding.current_price is not None else None  # type: ignore
        ),
        sector=str(holding.sector) if holding.sector is not None else None,  # type: ignore
        holding_type=str(holding.holding_type),  # type: ignore
        created_at=holding.created_at,  # type: ignore
        updated_at=holding.updated_at,  # type: ignore
    )


def watchlist_to_graphql(watchlist: WatchlistModel) -> Watchlist:
    """Convert SQLAlchemy Watchlist model to GraphQL Watchlist type."""
    return Watchlist(
        id=int(watchlist.id),  # type: ignore
        user_id=int(watchlist.user_id),  # type: ignore
        ticker=str(watchlist.ticker),  # type: ignore
        name=str(watchlist.name),  # type: ignore
        sector=str(watchlist.sector) if watchlist.sector is not None else None,  # type: ignore
        created_at=watchlist.created_at,  # type: ignore
    )


def sentiment_to_graphql(sentiment: SentimentModel) -> Sentiment:
    """Convert SQLAlchemy Sentiment model to GraphQL Sentiment type."""
    return Sentiment(
        id=int(sentiment.id),  # type: ignore
        article_id=int(sentiment.article_id),  # type: ignore
        ticker=str(sentiment.ticker),  # type: ignore
        sentiment_score=float(sentiment.sentiment_score),  # type: ignore
        sentiment_label=str(sentiment.sentiment_label),  # type: ignore
        confidence=float(sentiment.confidence),  # type: ignore
        recommendation=str(sentiment.recommendation),  # type: ignore
        analysis_model=str(sentiment.analysis_model),  # type: ignore
        created_at=sentiment.created_at,  # type: ignore
    )


def article_to_graphql(article: ArticleModel) -> Article:
    """Convert SQLAlchemy Article model to GraphQL Article type."""
    return Article(
        id=int(article.id),  # type: ignore
        title=str(article.title),  # type: ignore
        content=str(article.content) if article.content is not None else None,  # type: ignore
        url=str(article.url),  # type: ignore
        source=str(article.source),  # type: ignore
        author=str(article.author) if article.author is not None else None,  # type: ignore
        published_at=article.published_at,  # type: ignore
        ticker=str(article.ticker) if article.ticker is not None else None,  # type: ignore
        sector=str(article.sector) if article.sector is not None else None,  # type: ignore
        is_processed=bool(article.is_processed),  # type: ignore
        created_at=article.created_at,  # type: ignore
    )
