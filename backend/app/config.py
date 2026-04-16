from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "OceanGuard"
    debug: bool = True
    secret_key: ***ENTFERNT*** = "Ocean" #change this
    algorithm: str = "HS256"
    access_token_expire_minutes: ***ENTFERNT*** = 1440
    database_url: str = "sqlite+aiosqlite:///./oceanguard.db"
    aisstream_api_key: ***ENTFERNT*** = ""

    class Config:
        env_file = ".env"

settings = Settings()