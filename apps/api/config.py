import os
from functools import lru_cache
from typing import Optional

from dotenv import load_dotenv


ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(ENV_PATH)


def _parse_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _parse_bool(value: Optional[str], default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class Settings:
    def __init__(self) -> None:
        self.api_title = os.getenv("API_TITLE", "Music Royalties API")
        self.api_version = os.getenv("API_VERSION", "0.1.0")
        self.secret_key = os.getenv("SECRET_KEY", "your-secret-key-keep-it-safe")
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7)))
        self.allow_insecure_auth = _parse_bool(os.getenv("ALLOW_INSECURE_AUTH"), True)
        self.auto_create_tables = _parse_bool(os.getenv("AUTO_CREATE_TABLES"), True)
        self.cors_allow_origins = _parse_csv(
            os.getenv(
                "CORS_ALLOW_ORIGINS",
                "http://localhost,http://localhost:5173,http://127.0.0.1:5173",
            )
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
