from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "ChronoGraph API"
    app_version: str = "1.0.0"
    debug: bool = True

    # Optional so the application can still start for an offline/demo review.
    neo4j_uri: str = ""
    neo4j_username: str = ""
    neo4j_password: str = ""

    # Set CHRONOGRAPH_DEMO_MODE=true to intentionally use local evidence.
    demo_mode: bool = Field(False, validation_alias="CHRONOGRAPH_DEMO_MODE")

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
