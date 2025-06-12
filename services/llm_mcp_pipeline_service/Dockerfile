# Dockerfile for LLM-MCP Pipeline Service
FROM python:3.10-slim

LABEL maintainer="DADM Team"
LABEL description="LLM-MCP Pipeline Service for streamlined AI and mathematical analysis orchestration"

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy main requirements first (for better caching)
COPY requirements.txt ./main-requirements.txt

# Install PyTorch CPU-only versions first to prevent CUDA downloads and speed up builds
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch==2.7.1+cpu torchvision==0.22.1+cpu --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r main-requirements.txt

# Copy service-specific requirements and install
COPY services/llm_mcp_pipeline_service/requirements.txt ./service-requirements.txt
RUN pip install --no-cache-dir -r service-requirements.txt

# Copy configuration and source code
COPY config/ /app/config/
COPY src/ /app/src/
COPY services/llm_mcp_pipeline_service/ /app/services/llm_mcp_pipeline_service/

# Create directories for logs and data
RUN mkdir -p /app/logs /app/data

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=5204
ENV HOST=0.0.0.0
ENV DEBUG=false

# Expose the service port
EXPOSE 5204

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5204/health || exit 1

# Run the service
CMD ["python", "services/llm_mcp_pipeline_service/service.py"]
