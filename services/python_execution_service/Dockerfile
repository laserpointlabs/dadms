# Python Execution Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for Python execution
RUN apt-get update && apt-get install -y \
    curl \
    docker.io \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy service code
COPY services/python_execution_service/ ./services/python_execution_service/
COPY config/ ./config/

# Install Python dependencies
COPY services/python_execution_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create execution directories
RUN mkdir -p /app/execution_workspace && \
    chmod 755 /app/execution_workspace

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8003/health || exit 1

# Run the service
WORKDIR /app/services/python_execution_service
CMD ["python", "-m", "uvicorn", "service:app", "--host", "0.0.0.0", "--port", "8003"]
