from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str | None = None
    import_write_enabled: bool = False
    log_level: str = "INFO"
    iati_api_key: SecretStr | None = None
    iati_publisher_ref: str | None = None
    iati_max_records: int = Field(default=100, ge=1, le=100)
    iati_timeout_seconds: float = Field(default=20, gt=0, le=60)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
