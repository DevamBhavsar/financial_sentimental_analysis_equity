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
        first_name=str(user.first_name) if user.first_name else None,  # type: ignore
        last_name=str(user.last_name) if user.last_name else None,  # type: ignore
        is_active=bool(user.is_active),  # type: ignore
        created_at=user.created_at,  # type: ignore
        updated_at=user.updated_at,  # type: ignore
    )


def holding_to_graphql(holding: HoldingModel) -> Holding:
    """Convert SQLAlchemy Holding model to GraphQL Holding type."""
    return Holding(
        id=int(holding.id),
        user_id=int(holding.user_id),
        company_name=str(holding.company_name),
        isin=str(holding.isin),
        sector=str(holding.sector),
        total_quantity=int(holding.total_quantity),
        avg_trading_price=float(holding.avg_trading_price),
        ltp=float(holding.ltp),
        invested_value=float(holding.invested_value),
        market_value=float(holding.market_value),
        overall_gain_loss=float(holding.overall_gain_loss),
        client_id=str(holding.client_id) if holding.client_id is not None else None,
        market_cap=(
            float(holding.market_cap) if holding.market_cap is not None else None
        ),
        stcg_quantity=(
            int(holding.stcg_quantity) if holding.stcg_quantity is not None else None
        ),
        stcg_value=(
            float(holding.stcg_value) if holding.stcg_value is not None else None
        ),
        open=float(holding.open) if holding.open is not None else None,
        high=float(holding.high) if holding.high is not None else None,
        low=float(holding.low) if holding.low is not None else None,
        close=float(holding.close) if holding.close is not None else None,
        trade_volume=(
            int(holding.trade_volume) if holding.trade_volume is not None else None
        ),
        year_high=float(holding.year_high) if holding.year_high is not None else None,
        year_low=float(holding.year_low) if holding.year_low is not None else None,
        total_buy_quantity=(
            int(holding.total_buy_quantity)
            if holding.total_buy_quantity is not None
            else None
        ),
        total_sell_quantity=(
            int(holding.total_sell_quantity)
            if holding.total_sell_quantity is not None
            else None
        ),
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
