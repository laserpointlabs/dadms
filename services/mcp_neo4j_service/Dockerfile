# Dockerfile for MCP Neo4j Service
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY services/mcp_neo4j_service/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy service code
COPY services/mcp_neo4j_service/ /app/service/
COPY mcp_servers/ /app/mcp_servers/

# Create data directory
RUN mkdir -p /app/data

# Set environment variables
ENV PYTHONPATH="/app:/app/service:/app/mcp_servers"
ENV SERVICE_PORT=5202
ENV FLASK_APP=service.service
ENV FLASK_ENV=production
ENV NEO4J_URI=bolt://neo4j:7687
ENV NEO4J_USER=neo4j
ENV NEO4J_PASSWORD=password

# Expose port
EXPOSE 5202

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=30s \
    CMD curl -f http://localhost:5202/health || exit 1

# Run the service
CMD ["python", "/app/service/service.py"]
