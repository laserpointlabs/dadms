FROM python:3.10-slim

WORKDIR /app

# Copy requirements first for better caching
COPY services/echo_service/requirements.txt .
# Ensure pip is up to date and install dependencies with explicit version pinning
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the service code
COPY services/echo_service/service.py .

# Expose the port
EXPOSE 5100

# Command to run the service
CMD ["python", "service.py"]