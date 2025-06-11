# Dockerfile for MCP Script Execution Service
FROM python:3.11

# Set working directory
WORKDIR /app

# Install system dependencies including R and Scilab
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    g++ \
    r-base \
    r-base-dev \
    wget \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Install Scilab (optional - can be commented out if not needed)
# RUN wget -O scilab.deb https://www.scilab.org/download/6.1.1/scilab-6.1.1.amd64.deb \
#     && dpkg -i scilab.deb || apt-get install -f -y \
#     && rm scilab.deb

# Install Python dependencies
COPY services/mcp_script_execution_service/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install common R packages for statistical analysis
RUN R -e "install.packages(c('ggplot2', 'dplyr', 'jsonlite', 'forecast'), repos='https://cran.rstudio.com/')"

# Copy service code
COPY services/mcp_script_execution_service/ /app/service/
COPY mcp_servers/ /app/mcp_servers/

# Create necessary directories
RUN mkdir -p /app/data /app/output /app/scripts

# Set environment variables
ENV PYTHONPATH="/app:/app/service:/app/mcp_servers"
ENV SERVICE_PORT=5203
ENV FLASK_APP=service.service
ENV FLASK_ENV=production
ENV SANDBOX_MODE=true
ENV MAX_EXECUTION_TIME=300

# Security: Create non-root user for script execution
RUN useradd -m -s /bin/bash scriptrunner
RUN chown -R scriptrunner:scriptrunner /app/data /app/output

# Expose port
EXPOSE 5203

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=30s \
    CMD curl -f http://localhost:5203/health || exit 1

# Run the service
CMD ["python", "/app/service/service.py"]
