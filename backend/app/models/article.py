from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text)
    url = Column(String, unique=True, nullable=False)
    source = Column(String, nullable=False)
    author = Column(String)
    published_at = Column(DateTime(timezone=True), nullable=False)
    ticker = Column(String, index=True)
    sector = Column(String)
    is_processed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    sentiments = relationship("Sentiment", back_populates="article")