from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from ..models.article import Article
from ..schemas.article import ArticleCreate
from newsapi import NewsApiClient
from ..config import settings


class NewsService:
    def __init__(self):
        self.newsapi = NewsApiClient(api_key=settings.news_api_key)

    async def fetch_and_store_articles(
        self, db: AsyncSession, query: str, language: str = "en"
    ):
        top_headlines = self.newsapi.get_top_headlines(
            q=query, language=language, page_size=100
        )
        articles = top_headlines["articles"]
        for article_data in articles:
            article = ArticleCreate(
                title=article_data["title"],
                content=article_data["content"],
                url=article_data["url"],
                source=article_data["source"]["name"],
                author=article_data["author"],
                published_at=article_data["publishedAt"],
            )
            await self.create_article(db, article)

    @staticmethod
    async def get_articles(
        db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[Article]:
        result = await db.execute(select(Article).offset(skip).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def create_article(db: AsyncSession, article: ArticleCreate) -> Article:
        db_article = Article(**article.dict())
        db.add(db_article)
        await db.commit()
        await db.refresh(db_article)
        return db_article

    @staticmethod
    async def get_article_by_url(db: AsyncSession, url: str) -> Optional[Article]:
        result = await db.execute(select(Article).where(Article.url == url))
        return result.scalar_one_or_none()
