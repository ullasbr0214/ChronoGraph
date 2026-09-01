from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "ChronoGraph"
    app_version: str = "1.0.0"

    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_username: str = "neo4j"
    neo4j_password: str = "password"

    class Config:
        env_file = ".env"


settings = Settings()