from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from datetime import datetime, timedelta, timezone
from ..models.article import Article
from ..models.sentiment import Sentiment
from ..nlp.sentiment_analyzer import SentimentAnalyzer
import logging

logger = logging.getLogger(__name__)


class SentimentService:
    def __init__(self):
        try:
            self.analyzer = SentimentAnalyzer()
        except Exception as e:
            logger.error(f"Failed to initialize SentimentAnalyzer: {e}")
            raise
    
    async def process_article_sentiment(
        self, 
        db: AsyncSession, 
        article: Article
    ) -> Dict[str, Any]:
        """Process sentiment analysis for an article"""
        try:
            if not article or not getattr(article, 'title', None):
                return {
                    'success': False,
                    'error': 'Invalid article data'
                }

            # Check if article was already processed
            if getattr(article, 'is_processed', False):
                return {
                    'success': False,
                    'error': 'Article already processed'
                }

            # Analyze sentiment
            sentiment_result = self.analyzer.analyze_article(
                str(article.title), 
                str(article.content) if getattr(article, 'content', None) is not None else None
            )
            
            # Validate sentiment result
            if not sentiment_result or 'sentiment_score' not in sentiment_result:
                return {
                    'success': False,
                    'error': 'Sentiment analysis failed'
                }

            # Create sentiment record
            sentiment = Sentiment(
                article_id=article.id,
                ticker=article.ticker,
                sentiment_score=sentiment_result['sentiment_score'],
                sentiment_label=sentiment_result['sentiment_label'],
                confidence=sentiment_result['confidence'],
                recommendation=sentiment_result['recommendation'],
                analysis_model=sentiment_result['analysis_model']
            )
            
            db.add(sentiment)
            
            # Update article as processed
            setattr(article, 'is_processed', True)
            
            try:
                await db.commit()
            except Exception as e:
                await db.rollback()
                return {
                    'success': False,
                    'error': f'Database error: {str(e)}'
                }
            
            return {
                'success': True,
                'sentiment_id': sentiment.id,
                'sentiment_score': sentiment_result['sentiment_score'],
                'recommendation': sentiment_result['recommendation']
            }
            
        except Exception as e:
            logger.error(f"Sentiment processing failed: {e}")
            await db.rollback()
            return {
                'success': False,
                'error': str(e)
            }
    
    async def get_ticker_sentiment_summary(
        self, 
        db: AsyncSession, 
        ticker: str, 
        days: int = 7
    ) -> Dict[str, Any]:
        """Get sentiment summary for a ticker"""
        try:
            # Validate inputs
            if not ticker or not isinstance(ticker, str):
                raise ValueError("Invalid ticker")
            
            if not isinstance(days, int) or days < 1:
                days = 7

            since_date = datetime.now(timezone.utc) - timedelta(days=days)
            
            # Get recent sentiments
            result = await db.execute(
                select(Sentiment)
                .where(
                    and_(
                        func.upper(Sentiment.ticker) == ticker.upper(),
                        Sentiment.created_at >= since_date
                    )
                )
                .order_by(Sentiment.created_at.desc())
            )
            sentiments = result.scalars().all()
            
            if not sentiments:
                return {
                    'ticker': ticker.upper(),
                    'avg_sentiment': 0.0,
                    'sentiment_trend': 'neutral',
                    'recommendation': 'hold',
                    'confidence': 0.0,
                    'article_count': 0,
                    'recommendation_breakdown': {'buy': 0, 'sell': 0, 'hold': 0},
                    'days_analyzed': days
                }
            
            # Calculate metrics
            sentiment_scores = [float(getattr(s, 'sentiment_score', 0.0)) for s in sentiments if hasattr(s, 'sentiment_score')]
            confidence_scores = [float(getattr(s, 'confidence', 0.0)) for s in sentiments if hasattr(s, 'confidence')]
            
            avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0.0
            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0
            
            # Determine trend and recommendation
            trend = 'neutral'
            recommendation = 'hold'
            
            if avg_sentiment > 0.2 and avg_confidence > 0.6:
                trend = 'positive'
                recommendation = 'buy'
            elif avg_sentiment < -0.2 and avg_confidence > 0.6:
                trend = 'negative'
                recommendation = 'sell'
            
            # Count recommendations
            recommendations = [str(s.recommendation) for s in sentiments]
            recommendation_counts = {
                'buy': sum(1 for r in recommendations if r == 'buy'),
                'sell': sum(1 for r in recommendations if r == 'sell'),
                'hold': sum(1 for r in recommendations if r == 'hold')
            }
            
            return {
                'ticker': ticker.upper(),
                'avg_sentiment': float(format(avg_sentiment, '.4f')),
                'sentiment_trend': trend,
                'recommendation': recommendation,
                'confidence': float(format(avg_confidence, '.4f')),
                'article_count': len(sentiments),
                'recommendation_breakdown': recommendation_counts,
                'days_analyzed': days
            }
            
        except Exception as e:
            logger.error(f"Sentiment summary failed for {ticker}: {e}")
            return {
                'ticker': ticker.upper() if ticker else 'UNKNOWN',
                'avg_sentiment': 0.0,
                'sentiment_trend': 'neutral',
                'recommendation': 'hold',
                'confidence': 0.0,
                'article_count': 0,
                'recommendation_breakdown': {'buy': 0, 'sell': 0, 'hold': 0},
                'days_analyzed': days,
                'error': str(e)
            }