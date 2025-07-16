from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class Sentiment(Base):
    __tablename__ = "sentiments"

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    ticker = Column(String, nullable=False, index=True)
    sentiment_score = Column(Float, nullable=False)  # -1 to 1
    sentiment_label = Column(String, nullable=False)  # positive, negative, neutral
    confidence = Column(Float, nullable=False)
    recommendation = Column(String, nullable=False)  # buy, sell, hold
    analysis_model = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    article = relationship("Article", back_populates="sentiments")
