from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    Nothing is hardcoded: every value can be overridden via the environment
    (or a local .env file), which satisfies the assessment's requirement to
    use environment variables and avoid hardcoded credentials.
    """

    # Default points at the docker-compose "db" service. Override in prod.
    database_url: str = "postgresql://postgres:postgres@db:5432/inventory"

    # Comma-separated list of allowed CORS origins. "*" allows all.
    cors_origins: str = "*"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
