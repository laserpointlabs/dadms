FROM python:3.10-slim AS runtime
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY services/ollama_service/requirements.txt ./service-requirements.txt
RUN pip install --no-cache-dir -r service-requirements.txt

COPY config/ /app/config/
COPY src/ /app/src/
COPY scripts/ /app/scripts/
COPY services/ollama_service/ /app/services/ollama_service/

ENV PYTHONPATH=/app
ENV FLASK_APP=services/ollama_service/service.py
ENV FLASK_ENV=production

EXPOSE 5200
CMD ["python", "services/ollama_service/service.py"]
