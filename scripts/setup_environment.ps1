# Setup environment variables for DADM OpenAI service

# Get OpenAI API key from user if not set
if (-not $env:OPENAI_API_KEY) {
    $apiKey = Read-Host -Prompt "Enter your OpenAI API key"
    if ($apiKey) {
        $env:OPENAI_API_KEY = $apiKey
        Write-Host "OPENAI_API_KEY set successfully." -ForegroundColor Green
    } else {
        Write-Host "OPENAI_API_KEY is required. Setup failed." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Using existing OPENAI_API_KEY environment variable." -ForegroundColor Green
}

# Set default environment variables for local development
$env:PORT = "5000"
$env:ASSISTANT_NAME = "DADM Decision Analysis Assistant"
$env:ASSISTANT_MODEL = "gpt-4o"
$env:CONSUL_HTTP_ADDR = "localhost:8500"
$env:SERVICE_HOST = "localhost"
$env:SERVICE_TYPE = "assistant"
$env:USE_CONSUL = "true"
$env:DOCKER_CONTAINER = "false"

Write-Host "Environment variables set for local development:" -ForegroundColor Cyan
Write-Host "- PORT: $env:PORT"
Write-Host "- ASSISTANT_NAME: $env:ASSISTANT_NAME"
Write-Host "- ASSISTANT_MODEL: $env:ASSISTANT_MODEL"
Write-Host "- CONSUL_HTTP_ADDR: $env:CONSUL_HTTP_ADDR"
Write-Host "- SERVICE_HOST: $env:SERVICE_HOST"
Write-Host "- SERVICE_TYPE: $env:SERVICE_TYPE"
Write-Host "- USE_CONSUL: $env:USE_CONSUL"
Write-Host "- DOCKER_CONTAINER: $env:DOCKER_CONTAINER"

# Check if Consul is running locally
try {
    $consulStatus = Invoke-WebRequest -Uri "http://localhost:8500/v1/status/leader" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($consulStatus.StatusCode -eq 200) {
        Write-Host "✅ Consul is running locally!" -ForegroundColor Green
    } 
} catch {
    Write-Host "⚠️ Consul does not appear to be running locally." -ForegroundColor Yellow
    Write-Host "You can start it with Docker: docker run -d --name consul -p 8500:8500 consul:1.15" -ForegroundColor Yellow
}

# Done
Write-Host "`nSetup complete! You can now run the OpenAI service locally." -ForegroundColor Green
Write-Host "For more information, see docs/environment_variables.md"
