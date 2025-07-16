from apscheduler.schedulers.asyncio import AsyncIOScheduler
from ..services.news_service import NewsService
from ..database import get_db


class NewsScheduler:
    def __init__(self, news_service: NewsService):
        self.scheduler = AsyncIOScheduler()
        self.news_service = news_service

    async def fetch_news_job(self):
        async for db in get_db():
            await self.news_service.fetch_and_store_articles(db, query="finance")

    def start(self):
        self.scheduler.add_job(
            self.fetch_news_job, "interval", minutes=15
        )
        self.scheduler.start()

    def shutdown(self):
        self.scheduler.shutdown()
