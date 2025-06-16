"""
Python Execution Service Configuration Management
Handles environment variables, config files, and service discovery
"""

import os
import json
import logging
from typing import Dict, Any, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class PythonExecutionConfig:
    """Configuration manager for Python execution service"""
    
    def __init__(self, config_file: Optional[str] = None):
        self.config_file = config_file or self._find_config_file()
        self._config_cache: Optional[Dict[str, Any]] = None
        
    def _find_config_file(self) -> Optional[str]:
        """Find service configuration file"""
        possible_paths = [
            os.getenv("PYTHON_EXECUTION_CONFIG_FILE"),
            os.path.join(os.path.dirname(__file__), "service_config.json"),
            "./service_config.json",
            "/etc/dadm/python_execution_config.json"
        ]
        
        for path in possible_paths:
            if path and os.path.exists(path):
                return path
        return None
    
    def load_config(self) -> Dict[str, Any]:
        """Load configuration from file and environment"""
        if self._config_cache is not None:
            return self._config_cache
            
        # Load from file
        config_data = self._load_from_file()
        
        # Override with environment variables
        env_overrides = self._load_from_environment()
        if env_overrides:
            config_data = self._merge_config(config_data, env_overrides)
        
        self._config_cache = config_data
        return config_data
    
    def _load_from_file(self) -> Dict[str, Any]:
        """Load configuration from JSON file"""
        if not self.config_file or not os.path.exists(self.config_file):
            logger.warning(f"Config file not found: {self.config_file}")
            return self._get_default_config()
        
        try:
            with open(self.config_file, 'r') as f:
                config = json.load(f)
                logger.info(f"Loaded configuration from {self.config_file}")
                return config
        except Exception as e:
            logger.error(f"Failed to load config file {self.config_file}: {e}")
            return self._get_default_config()
    
    def _load_from_environment(self) -> Dict[str, Any]:
        """Load configuration overrides from environment variables"""
        env_config = {}
        
        # Environment variable mappings
        env_mappings = {
            "PORT": ("service", "port"),
            "SERVICE_HOST": ("runtime", "host"),
            "CONSUL_HTTP_ADDR": ("consul", "url"),
            "USE_CONSUL": ("consul", "enabled"),
            "EXECUTION_TIMEOUT": ("defaults", "timeout"),
            "MAX_CONCURRENT_EXECUTIONS": ("runtime", "max_concurrent"),
            "DOCKER_ENABLED": ("runtime", "docker_enabled")
        }
        
        for env_key, (section, config_key) in env_mappings.items():
            value = os.getenv(env_key)
            if value is not None:
                if section not in env_config:
                    env_config[section] = {}
                
                # Convert to appropriate type
                converted_value = self._convert_env_value(value, config_key)
                env_config[section][config_key] = converted_value
                logger.debug(f"Environment override: {env_key} -> {section}.{config_key} = {converted_value}")
        
        return env_config
    
    def _convert_env_value(self, value: str, config_key: str) -> Any:
        """Convert environment variable to appropriate type"""
        # Boolean conversions
        if config_key in ["enabled", "docker_enabled"]:
            return value.lower() in ("true", "1", "yes", "on")
        
        # Integer conversions
        if config_key in ["port", "timeout", "max_concurrent"]:
            try:
                return int(value)
            except ValueError:
                logger.warning(f"Invalid integer value for {config_key}: {value}")
                return value
        
        # String values (default)
        return value
    
    def _merge_config(self, base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
        """Merge configuration dictionaries"""
        result = base.copy()
        
        for key, value in override.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._merge_config(result[key], value)
            else:
                result[key] = value
        
        return result
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration"""
        return {
            "service": {
                "name": "dadm-python-execution-service",
                "type": "python-execution",
                "port": 8003,
                "version": "1.0.0",
                "health_endpoint": "/health",
                "description": "DADM Python Execution Service",
                "tags": ["python", "execution", "computational", "dadm"]
            },
            "consul": {
                "enabled": True,
                "url": "localhost:8500"
            },
            "runtime": {
                "host": "localhost",
                "docker_enabled": True,
                "max_concurrent": 5
            },
            "defaults": {
                "timeout": 300,
                "environment": "scientific"
            }
        }
    
    def get_service_info(self) -> Dict[str, Any]:
        """Get service information for registration"""
        config = self.load_config()
        return config.get("service", {})
    
    def get_consul_config(self) -> Dict[str, Any]:
        """Get Consul configuration"""
        config = self.load_config()
        return config.get("consul", {})
    
    def get_runtime_config(self) -> Dict[str, Any]:
        """Get runtime configuration"""
        config = self.load_config()
        return config.get("runtime", {})
    
    def get_defaults(self) -> Dict[str, Any]:
        """Get default execution settings"""
        config = self.load_config()
        return config.get("defaults", {})

# Global configuration instance
_config_manager: Optional[PythonExecutionConfig] = None

def get_config_manager() -> PythonExecutionConfig:
    """Get or create global configuration manager"""
    global _config_manager
    if _config_manager is None:
        _config_manager = PythonExecutionConfig()
    return _config_manager

def load_service_config() -> Dict[str, Any]:
    """Load service configuration - main entry point"""
    return get_config_manager().load_config()

def get_service_info() -> Dict[str, Any]:
    """Get service information for registration"""
    return get_config_manager().get_service_info()

def get_consul_config() -> Dict[str, Any]:
    """Get Consul configuration"""
    return get_config_manager().get_consul_config()
