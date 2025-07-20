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
        id=int(holding.id),  # type: ignore
        user_id=int(holding.user_id),  # type: ignore
        company_name=str(holding.company_name),  # type: ignore
        isin=str(holding.isin),  # type: ignore
        sector=str(holding.sector),  # type: ignore
        total_quantity=int(holding.total_quantity),  # type: ignore
        avg_trading_price=float(holding.avg_trading_price),  # type: ignore
        ltp=float(holding.ltp),  # type: ignore
        invested_value=float(holding.invested_value),  # type: ignore
        market_value=float(holding.market_value),  # type: ignore
        overall_gain_loss=float(holding.overall_gain_loss),  # type: ignore
        
        # Handle optional fields with proper null checking
        client_id=str(holding.client_id) if holding.client_id is not None else None,  # type: ignore
        market_cap=float(holding.market_cap) if holding.market_cap is not None else None,  # type: ignore
        stcg_quantity=int(holding.stcg_quantity) if holding.stcg_quantity is not None else None,  # type: ignore
        stcg_value=float(holding.stcg_value) if holding.stcg_value is not None else None,  # type: ignore
        
        # Commented fields for future use - uncomment when model is updated
        # free_quantity=int(holding.free_quantity) if holding.free_quantity is not None else None,  # type: ignore
        # unsettled_quantity=int(holding.unsettled_quantity) if holding.unsettled_quantity is not None else None,  # type: ignore
        # margin_pledged_quantity=int(holding.margin_pledged_quantity) if holding.margin_pledged_quantity is not None else None,  # type: ignore
        # paylater_mtf_quantity=int(holding.paylater_mtf_quantity) if holding.paylater_mtf_quantity is not None else None,  # type: ignore
        # unpaid_cusa_qty=int(holding.unpaid_cusa_qty) if holding.unpaid_cusa_qty is not None else None,  # type: ignore
        # blocked_qty=int(holding.blocked_qty) if holding.blocked_qty is not None else None,  # type: ignore
        # ltcg_quantity=int(holding.ltcg_quantity) if holding.ltcg_quantity is not None else None,  # type: ignore
        # ltcg_value=float(holding.ltcg_value) if holding.ltcg_value is not None else None,  # type: ignore
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