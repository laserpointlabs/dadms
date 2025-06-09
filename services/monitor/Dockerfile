FROM python:3.10-slim

WORKDIR /app

# Install Docker CLI for container management
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://get.docker.com -o get-docker.sh && \
    sh get-docker.sh && \
    rm get-docker.sh && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Create logs directory structure
RUN mkdir -p /app/logs/monitors /app/logs/services /app/logs/processes

# Expose port for health endpoint
EXPOSE 5200

# Default command (can be overridden in docker-compose)
CMD ["python", "scripts/service_monitor.py", "--interval", "60", "--port", "5200"]