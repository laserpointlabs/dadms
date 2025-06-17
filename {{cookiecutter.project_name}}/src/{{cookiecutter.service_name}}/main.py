"""
Main application entry point for {{cookiecutter.service_name}} service
"""

import uvicorn
from fastapi import FastAPI
from .routes import router
from .config import settings
from .consul_client import register_service
import logging
import structlog

# Configure structured logging
structlog.configure(
    processors=[
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.make_filtering_bound_logger(settings.log_level),
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

# Create FastAPI app
app = FastAPI(
    title="{{cookiecutter.project_name}}",
    description="{{cookiecutter.description}}",
    version="{{cookiecutter.version}}",
)

# Include routes
app.include_router(router, prefix="/{{cookiecutter.service_name}}")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for service monitoring"""
    return {
        "status": "healthy",
        "service": "{{cookiecutter.service_name}}",
        "version": "{{cookiecutter.version}}"
    }

@app.on_event("startup")
async def startup_event():
    """Register service with Consul on startup"""
    logger.info("Starting {{cookiecutter.service_name}} service")
    try:
        register_service()
        logger.info("Service registered with Consul")
    except Exception as e:
        logger.error("Failed to register with Consul", error=str(e))

def main():
    """Main entry point"""
    logger.info("Starting {{cookiecutter.service_name}} service on port {}", settings.service_port)
    uvicorn.run(
        "src.{{cookiecutter.service_name}}.main:app",
        host="0.0.0.0",
        port=settings.service_port,
        reload=settings.debug
    )

if __name__ == "__main__":
    main()
