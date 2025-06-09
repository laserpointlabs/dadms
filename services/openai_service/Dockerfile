# Stage 1: NVIDIA runtime image with CUDA libraries preinstalled
FROM nvidia/cuda:11.8.0-runtime-ubuntu22.04 AS cuda

# Stage 2: slim Python image for the actual service code
FROM python:3.9-slim AS runtime

# Copy CUDA from the NVIDIA image so we don't re-download it every build
COPY --from=cuda /usr/local/cuda /usr/local/cuda

ENV LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH

WORKDIR /app

# Copy main requirements first
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

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
