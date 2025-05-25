"""
Application configuration management using Pydantic Settings.
"""

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Application
    app_name: str = Field(default="Enterprise Admin System", alias="APP_NAME")
    app_version: str = Field(default="1.0.0", alias="APP_VERSION")
    debug: bool = Field(default=False, alias="DEBUG")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # Database
    database_url: str = Field(alias="DATABASE_URL")
    database_url_sync: str | None = Field(default=None, alias="DATABASE_URL_SYNC")

    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    # JWT
    secret_key: str = Field(alias="SECRET_KEY")
    algorithm: str = Field(default="HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=30, alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    refresh_token_expire_days: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    # CORS
    allowed_origins: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        alias="ALLOWED_ORIGINS",
    )

    # File Upload
    max_file_size: int = Field(default=10485760, alias="MAX_FILE_SIZE")  # 10MB
    upload_dir: str = Field(default="uploads", alias="UPLOAD_DIR")
    allowed_extensions: list[str] = Field(
        default=["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"],
        alias="ALLOWED_EXTENSIONS",
    )

    # Email (Optional)
    smtp_host: str | None = Field(default=None, alias="SMTP_HOST")
    smtp_port: int | None = Field(default=587, alias="SMTP_PORT")
    smtp_user: str | None = Field(default=None, alias="SMTP_USER")
    smtp_password: str | None = Field(default=None, alias="SMTP_PASSWORD")
    email_from: str | None = Field(default=None, alias="EMAIL_FROM")

    # Security
    bcrypt_rounds: int = Field(default=12, alias="BCRYPT_ROUNDS")
    session_timeout_minutes: int = Field(default=60, alias="SESSION_TIMEOUT_MINUTES")

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @field_validator("allowed_extensions", mode="before")
    @classmethod
    def parse_allowed_extensions(cls, v):
        """Parse allowed extensions from string or list."""
        if isinstance(v, str):
            return [ext.strip() for ext in v.split(",")]
        return v

    model_config = {"env_file": ".env", "case_sensitive": False}


# Global settings instance
settings = Settings()
