# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import declarative_base
import redis.asyncio as aioredis
from .config import settings
from sqlalchemy.ext.asyncio import async_sessionmaker

# Database
engine = create_async_engine(
    settings.DATABASE_URL, echo=settings.debug, pool_pre_ping=True, pool_recycle=300
)


AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

Base = declarative_base()

# Redis
redis_client = None


async def get_redis():
    global redis_client
    if redis_client is None:
        redis_client = await aioredis.from_url(settings.REDIS_URL)
    return redis_client


async def get_db():
    session = AsyncSessionLocal()
    try:
        yield session
    finally:
        await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    await engine.dispose()
    if redis_client:
        await redis_client.close()
