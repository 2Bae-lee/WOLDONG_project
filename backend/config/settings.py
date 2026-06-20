from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URI: str
    JWT_SECRET: str
    JWT_EXPIRES_DAYS: int = 7
    PORT: int = 8000
    EMAIL_USER: str
    EMAIL_PASS: str

    class Config:
        env_file = ".env"

settings = Settings()
