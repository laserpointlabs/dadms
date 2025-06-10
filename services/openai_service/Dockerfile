# Use Python 3.10 to match requirements comment
FROM python:3.10-slim AS runtime

WORKDIR /app

# Copy main requirements first (install in order of stability)
COPY requirements.txt .

# Install PyTorch CPU-only versions first to prevent CUDA downloads
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch==2.7.1+cpu torchvision==0.22.1+cpu --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Copy and install service-specific requirements
COPY services/openai_service/requirements.txt ./service-requirements.txt
RUN pip install --no-cache-dir -r service-requirements.txt

# Copy configuration and source code
COPY config/ /app/config/
COPY src/ /app/src/
COPY scripts/ /app/scripts/
COPY services/openai_service/ /app/services/openai_service/

# Set environment variables
ENV PYTHONPATH=/app
ENV FLASK_APP=services/openai_service/service.py
ENV FLASK_ENV=production

# Expose the port the service runs on
EXPOSE 5000

# Run the service
CMD ["python", "services/openai_service/service.py"]
