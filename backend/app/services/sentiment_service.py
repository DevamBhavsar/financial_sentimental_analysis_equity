from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from ..models.sentiment import Sentiment
from ..schemas.sentiment import SentimentCreate # Make sure this schema exists
from ..nlp.sentiment_analyzer import SentimentAnalyzer
import logging

logger = logging.getLogger(__name__)

class SentimentService:
    def __init__(self):
        try:
            self.analyzer = SentimentAnalyzer()
        except RuntimeError as e:
            logger.error(f"Failed to initialize SentimentService: {e}")
            self.analyzer = None

    async def analyze_and_store_sentiment(
        self, db: AsyncSession, article_id: int, text: str, ticker: str
    ) -> Sentiment:
        """
        Analyzes text sentiment and stores the result in the database.
        """
        if not self.analyzer:
            raise Exception("Sentiment Analyzer is not initialized.")

        sentiment_result = self.analyzer.analyze(text)

        # Convert sentiment label (POSITIVE/NEGATIVE) to a recommendation
        recommendation = self.get_recommendation(
            sentiment_result["label"], sentiment_result["score"]
        )

        sentiment_data = SentimentCreate(
            article_id=article_id,
            ticker=ticker,
            sentiment_score=sentiment_result["score"],
            sentiment_label=sentiment_result["label"],
            confidence=sentiment_result["score"], # Confidence is usually the score itself
            recommendation=recommendation,
            analysis_model=self.analyzer.model_name,
        )

        return await self.create_sentiment(db, sentiment_data)

    @staticmethod
    async def create_sentiment(db: AsyncSession, sentiment: SentimentCreate) -> Sentiment:
        db_sentiment = Sentiment(**sentiment.dict())
        db.add(db_sentiment)
        await db.commit()
        await db.refresh(db_sentiment)
        return db_sentiment

    def get_recommendation(self, label: str, score: float) -> str:
        """
        Determines a recommendation based on sentiment label and score.
        """
        if label == "POSITIVE" and score > 0.7:
            return "strong_buy"
        elif label == "POSITIVE":
            return "buy"
        elif label == "NEGATIVE" and score > 0.7:
            return "strong_sell"
        elif label == "NEGATIVE":
            return "sell"
        else:
            return "hold"