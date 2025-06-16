# Analysis Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY services/analysis_service/requirements.txt ./services/analysis_service/
RUN pip install --no-cache-dir -r services/analysis_service/requirements.txt

# Copy service files
COPY services/analysis_service/ ./services/analysis_service/
COPY config/ ./config/

# Set working directory to the service
WORKDIR /app/services/analysis_service

# Expose service port (will be configured via environment)
EXPOSE 8002

# Health check (use configured port)
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${ANALYSIS_SERVICE_PORT:-8002}/health || exit 1

# Run the service with configuration support
CMD ["python", "service.py"]
