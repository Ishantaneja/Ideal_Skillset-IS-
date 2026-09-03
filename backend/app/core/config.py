from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """
    Central application settings loaded from environment variables and .env file.
    """
    PROJECT_NAME: str = "Ideal SkillSet"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # MongoDB Configuration
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "ideal_skillsetdb"

    # JWT Authentication Configuration
    JWT_SECRET: str = "change-this-to-a-long-random-secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Ollama LLM Configuration (Local AI)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"

    # Frontend CORS Configuration
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
