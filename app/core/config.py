from pydantic import BaseSettings


class Settings(BaseSettings):
    app_name: str = "ZeroTrust Docs API"
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/zerotrust_docs"
    secret_key: str = "change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    class Config:
        env_prefix = "ZT_"
        env_file = ".env"


settings = Settings()
