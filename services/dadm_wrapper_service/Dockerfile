FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY services/dadm_wrapper_service/requirements.txt .
RUN pip install --no-cache-dir --timeout 300 --retries 3 -r requirements.txt

# Copy application code
COPY services/dadm_wrapper_service/ .

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=5205
ENV HOST=0.0.0.0

# Expose port
EXPOSE 5205

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5205/health || exit 1

# Run the application
CMD ["python", "service.py"]
