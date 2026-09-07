from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


# Project root:
# ChronoGraph/backend/
BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "ChronoGraph API"
    app_version: str = "1.0.0"
    debug: bool = True

    neo4j_uri: str
    neo4j_username: str
    neo4j_password: str

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()