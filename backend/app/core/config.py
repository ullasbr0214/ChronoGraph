from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "ChronoGraph API"
    app_version: str = "1.0.0"
    debug: bool = True

    # Optional so the application can start for an offline/demo review.
    neo4j_uri: str = ""
    neo4j_username: str = ""
    neo4j_password: str = ""

    # Local evidence mode is the safe default for the final demo.
    demo_mode: bool = Field(True, validation_alias="CHRONOGRAPH_DEMO_MODE")

    @field_validator("demo_mode", mode="before")
    @classmethod
    def normalize_demo_mode(cls, value):
        """Accept boolean strings even when a Windows .env has whitespace."""
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"true", "1", "yes", "y", "on"}:
                return True
            if normalized in {"false", "0", "no", "n", "off", ""}:
                return False
        return value

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
