# Dockerfile for DADM Prompt Service
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY services/prompt_service/requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy service files
COPY services/prompt_service/ /app/services/prompt_service/
COPY config/ /app/config/

# Set working directory to the service
WORKDIR /app/services/prompt_service

# Create necessary directories
RUN mkdir -p rag_cache test_data logs

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=5300
ENV CONSUL_HTTP_ADDR=consul:8500
ENV SERVICE_HOST=prompt-service
ENV SERVICE_TYPE=utility
ENV USE_CONSUL=true
ENV DOCKER_CONTAINER=true

# Expose port
EXPOSE 5300

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5300/health || exit 1

# Run the service
CMD ["python", "main.py"]
