from pydantic import BaseModel
from datetime import datetime


class SentimentBase(BaseModel):
    article_id: int
    ticker: str
    sentiment_score: float
    sentiment_label: str
    confidence: float
    recommendation: str
    analysis_model: str


class SentimentCreate(SentimentBase):
    pass


class Sentiment(SentimentBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True