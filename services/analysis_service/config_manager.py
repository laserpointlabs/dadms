"""
Analysis Service Configuration Management
Handles environment variables, config files, and service discovery
"""

import os
import json
import logging
from typing import Dict, Any, Optional
from pathlib import Path
from pydantic import BaseModel, Field, validator

from models import AnalysisServiceConfig

logger = logging.getLogger(__name__)

class ConfigManager:
    """Manages configuration from multiple sources with priority"""
    
    def __init__(self, config_file: Optional[str] = None, env_prefix: str = "ANALYSIS_"):
        self.config_file = config_file
        self.env_prefix = env_prefix
        self._config_cache: Optional[AnalysisServiceConfig] = None
        
    def load_config(self) -> AnalysisServiceConfig:
        """Load configuration from all sources with priority order:
        1. Environment variables (highest priority)
        2. Configuration file
        3. Default values (lowest priority)
        """
        if self._config_cache is not None:
            return self._config_cache
            
        # Start with default configuration
        config_data = {}
        
        # Load from configuration file if provided
        if self.config_file and os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r') as f:
                    file_config = json.load(f)
                config_data.update(file_config)
                logger.info(f"Loaded configuration from {self.config_file}")
            except Exception as e:
                logger.warning(f"Failed to load config file {self.config_file}: {e}")
        
        # Override with environment variables
        env_config = self._load_from_environment()
        config_data.update(env_config)
        
        # Create and cache the configuration
        self._config_cache = AnalysisServiceConfig(**config_data)
        logger.info(f"Configuration loaded: prompt_service_url={self._config_cache.prompt_service_url}")
        
        return self._config_cache
    
    def _load_from_environment(self) -> Dict[str, Any]:
        """Load configuration from environment variables"""
        env_config = {}
        
        # Define environment variable mappings
        env_mappings = {
            "PROMPT_SERVICE_URL": "prompt_service_url",
            "OPENAI_SERVICE_URL": "openai_service_url",
            "PYTHON_EXECUTION_URL": "python_execution_url",
            "CAMUNDA_URL": "camunda_base_url", 
            "CAMUNDA_BASE_URL": "camunda_base_url",
            "CONSUL_URL": "consul_url",
            "CONSUL_ENABLED": "consul_enabled",
            "SERVICE_PORT": "port",
            "ANALYSIS_PORT": "port",
            "LLM_PROVIDER": "default_llm_provider",
            "LLM_MODEL": "default_model",
            "LLM_TEMPERATURE": "default_temperature",
            "MAX_TOKENS": "max_tokens_default",
            "STRICT_VALIDATION": "strict_validation",
            "MAX_RETRY_ATTEMPTS": "max_retry_attempts",
            "VALIDATION_TIMEOUT": "validation_timeout",
            "ANALYSIS_STORAGE_PATH": "analysis_storage_path",
            "CACHE_RESULTS": "cache_results",
            "CACHE_TTL": "cache_ttl",
            "WORKFLOW_INTEGRATION": "enable_workflow_integration",
        }
        
        # Check for prefixed and non-prefixed environment variables
        for env_key, config_key in env_mappings.items():
            # Try with prefix first
            prefixed_key = f"{self.env_prefix}{env_key}"
            value = os.getenv(prefixed_key) or os.getenv(env_key)
            
            if value is not None:
                # Convert to appropriate type
                env_config[config_key] = self._convert_env_value(value, config_key)
                logger.debug(f"Environment variable {prefixed_key or env_key} -> {config_key} = {value}")
        
        return env_config
    
    def _convert_env_value(self, value: str, config_key: str) -> Any:
        """Convert environment variable string to appropriate type"""
        # Boolean conversions
        if config_key in ["consul_enabled", "strict_validation", "cache_results", "enable_workflow_integration"]:
            return value.lower() in ("true", "1", "yes", "on")
        
        # Integer conversions
        if config_key in ["port", "max_tokens_default", "max_retry_attempts", "cache_ttl"]:
            try:
                return int(value)
            except ValueError:
                logger.warning(f"Invalid integer value for {config_key}: {value}")
                return value
        
        # Float conversions
        if config_key in ["default_temperature", "validation_timeout"]:
            try:
                return float(value)
            except ValueError:
                logger.warning(f"Invalid float value for {config_key}: {value}")
                return value
        
        # String values (default)
        return value
    
    def reload_config(self) -> AnalysisServiceConfig:
        """Force reload configuration from all sources"""
        self._config_cache = None
        return self.load_config()
    
    def get_effective_config(self) -> Dict[str, Any]:
        """Get the effective configuration as a dictionary for debugging"""
        config = self.load_config()
        return config.dict()

class ServiceDiscoveryConfig:
    """Handle service discovery for finding other DADM services"""
    
    def __init__(self, config: AnalysisServiceConfig):
        self.config = config
        self.consul_client = None
        
    def discover_prompt_service(self) -> str:
        """Discover prompt service URL via Consul or return configured URL"""
        if not self.config.consul_enabled:
            return self.config.prompt_service_url
            
        try:
            # Optional import - consul is only needed if service discovery is enabled
            try:
                import consul  # type: ignore
            except ImportError:
                logger.warning("python-consul package not installed, falling back to configured URL")
                return self.config.prompt_service_url
                
            if self.consul_client is None:
                self.consul_client = consul.Consul(host=self._extract_consul_host())
            
            # Look for prompt service in Consul
            services = self.consul_client.health.service('dadm-prompt-service', passing=True)
            if services[1]:  # If healthy services found
                service = services[1][0]['Service']
                url = f"http://{service['Address']}:{service['Port']}"
                logger.info(f"Discovered prompt service via Consul: {url}")
                return url
                
        except Exception as e:
            logger.warning(f"Failed to discover prompt service via Consul: {e}")
        
        # Fallback to configured URL
        logger.info(f"Using configured prompt service URL: {self.config.prompt_service_url}")
        return self.config.prompt_service_url
    
    def _extract_consul_host(self) -> str:
        """Extract host from Consul URL"""
        url = self.config.consul_url
        if "://" in url:
            url = url.split("://")[1]
        if ":" in url:
            url = url.split(":")[0]
        return url

# Global configuration manager instance
_config_manager: Optional[ConfigManager] = None

def get_config_manager(config_file: Optional[str] = None) -> ConfigManager:
    """Get or create the global configuration manager"""
    global _config_manager
    if _config_manager is None:
        # Look for config file in standard locations
        if config_file is None:
            possible_paths = [
                os.getenv("ANALYSIS_CONFIG_FILE"),
                "./config.json",
                "./analysis_config.json", 
                "/etc/dadm/analysis_config.json",
                os.path.expanduser("~/.dadm/analysis_config.json")
            ]
            
            for path in possible_paths:
                if path and os.path.exists(path):
                    config_file = path
                    break
        
        _config_manager = ConfigManager(config_file)
        
    return _config_manager

def load_service_config() -> AnalysisServiceConfig:
    """Load service configuration - main entry point"""
    return get_config_manager().load_config()

def get_service_discovery() -> ServiceDiscoveryConfig:
    """Get service discovery helper"""
    config = load_service_config()
    return ServiceDiscoveryConfig(config)
