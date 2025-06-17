"""
Configuration settings for {{cookiecutter.service_name}} service
"""

from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Service configuration settings"""
    
    # Service settings
    service_name: str = "{{cookiecutter.service_name}}"
    service_port: int = 8000
    debug: bool = False
    log_level: str = "INFO"
    
    # Consul settings
    consul_host: str = "localhost"
    consul_port: int = 8500
    consul_timeout: int = 10
    
    # Database settings (optional)
    database_url: Optional[str] = None
    
    # External service URLs
    camunda_url: Optional[str] = None
    service_orchestrator_url: Optional[str] = None
    
    class Config:
        env_prefix = "{{cookiecutter.service_name.upper()}}_"
        case_sensitive = False

# Global settings instance
settings = Settings()
