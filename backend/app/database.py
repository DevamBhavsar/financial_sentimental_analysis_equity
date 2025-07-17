# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base
import redis.asyncio as aioredis

from .config import settings
from sqlalchemy.ext.asyncio import async_sessionmaker
from contextlib import asynccontextmanager

print(settings.DATABASE_URL)  # Database
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.debug,
    connect_args={"check_same_thread": False},
)


AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

# Redis connection pool
redis_pool = None


@asynccontextmanager
async def get_redis():
    global redis_pool
    if redis_pool is None:
        redis_pool = aioredis.ConnectionPool.from_url(
            settings.REDIS_URL, max_connections=10
        )
    client = aioredis.Redis(connection_pool=redis_pool)
    try:
        yield client
    finally:
        await client.close()


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
    if redis_pool:
        await redis_pool.disconnect()
