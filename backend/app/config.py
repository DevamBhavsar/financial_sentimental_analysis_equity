from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from pathlib import Path


class Settings(BaseSettings):
    """
    Settings for the application.
    """

    # Database configuration
    DATABASE_URL: str
    REDIS_URL: str

    # JWT configuration
    JWT_SECRET: str
    JWT_ALGORITHM: str
    EXPIRY_MIN: int

    # External APIs
    news_api_key: Optional[str] = None
    alpha_vantage_api_key: Optional[str] = None

    # Angel One SmartAPI
    angel_one_api_key: Optional[str] = None
    angel_one_secret_key: Optional[str] = None
    angel_one_client_code: Optional[str] = None
    angel_one_totp_secret: Optional[str] = None
    angel_one_mpin: Optional[int] = None
    # File upload
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    upload_dir: str = "uploads"

    # Scheduler
    news_fetch_interval: int = 300  # 5 minutes

    # Application
    APP_NAME: str = "News Aggregation System"
    debug: bool = False

    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()  # type: ignore
