from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from ..models.sentiment import Sentiment
from ..schemas.sentiment import SentimentCreate
from ..nlp.sentiment_analyzer import SentimentAnalyzer


class SentimentService:
    def __init__(self):
        self.analyzer = SentimentAnalyzer()

    async def analyze_and_store_sentiment(
        self, db: AsyncSession, article_id: int, text: str, ticker: str
    ) -> Sentiment:
        sentiment_result = self.analyzer.analyze(text)
        sentiment = SentimentCreate(
            article_id=article_id,
            ticker=ticker,
            sentiment_score=sentiment_result["score"],
            sentiment_label=sentiment_result["label"],
            confidence=sentiment_result["confidence"],
            recommendation=self.get_recommendation(sentiment_result["score"]),
            analysis_model=self.analyzer.model_name,
        )
        return await self.create_sentiment(db, sentiment)

    @staticmethod
    async def create_sentiment(db: AsyncSession, sentiment: SentimentCreate) -> Sentiment:
        db_sentiment = Sentiment(**sentiment.dict())
        db.add(db_sentiment)
        await db.commit()
        await db.refresh(db_sentiment)
        return db_sentiment

    @staticmethod
    async def get_sentiments_by_ticker(
        db: AsyncSession, ticker: str
    ) -> List[Sentiment]:
        result = await db.execute(
            select(Sentiment).where(Sentiment.ticker == ticker)
        )
        return result.scalars().all()

    def get_recommendation(self, score: float) -> str:
        if score > 0.2:
            return "buy"
        elif score < -0.2:
            return "sell"
        else:
            return "hold"
