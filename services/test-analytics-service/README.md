# test-analytics-service

Analytics service for data processing

## Quick Start

### Using Docker Compose

Add this service to your `docker-compose.yml`:

```yaml
test-analytics-service:
  build: ./services/test-analytics-service
  container_name: dadm-test-analytics-service
  ports:
    - "5000:5000"
  environment:
    - PORT=5000
  networks:
    - dadm-network
  depends_on:
    - consul
```

### Manual Setup

1. Install dependencies:
   ```bash
   cd services/test-analytics-service
   pip install -r requirements.txt
   ```

2. Run the service:
   ```bash
   python service.py
   ```

3. Test the service:
   ```bash
   curl http://localhost:5000/health
   ```

## API Endpoints

- `GET /health` - Health check
- `GET /info` - Service information
- `POST /process` - Process requests

## Configuration

Service configuration is stored in `service_config.json` and can be customized for your needs.

## Testing

Run the test suite:

```bash
python test_service.py
```
