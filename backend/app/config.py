from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseSettings):
    llm_api_key: str = os.getenv("LLM_API_KEY", "")
    llm_base_url: str = os.getenv("LLM_BASE_URL", "https://api.deepseek.com/v1")
    llm_model: str = os.getenv("LLM_MODEL", "deepseek-chat")
    jwt_secret: str = os.getenv("JWT_SECRET", "dev-secret-key-change-me")
    port: int = int(os.getenv("PORT", "8000"))
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    cache_ttl: int = 300  # 5 minutes

    class Config:
        env_file = ".env"


settings = Settings()
