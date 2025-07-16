from pydantic import BaseModel
from datetime import datetime


class SentimentBase(BaseModel):
    ticker: str
    sentiment_score: float
    sentiment_label: str
    confidence: float
    recommendation: str
    analysis_model: str


class SentimentCreate(SentimentBase):
    article_id: int


class SentimentResponse(SentimentBase):
    id: int
    article_id: int
    created_at: datetime

    class Config:
        from_attributes = True
