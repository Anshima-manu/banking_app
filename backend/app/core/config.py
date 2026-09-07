from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "Banking Admin Portal"
    debug: bool = False

    database_url: str
    jwt_secret: str
    jwt_algorithm: str= "HS256"
    access_token_expire_minutes: int = 60

    frontend_url: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file = ".env",
        extra = "ignore",
    )

settings = Settings()