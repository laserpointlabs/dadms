# DADM Testing Scripts for Windows PowerShell
# This file contains PowerShell commands for testing the DADM system

## Service Management
# Start services
docker-compose up -d

# Stop services  
docker-compose down

# Check running containers
docker ps

# View service logs
docker logs openai-service --tail 20
docker logs camunda --tail 20
docker logs consul --tail 20

## Testing Communication Fix
# Test OpenAI service directly
python .\test_communication_fix.py

# Test service orchestrator integration
python .\test_orchestrator_integration.py

# Test enhanced orchestrator
python -c "
import sys, os
sys.path.insert(0, os.path.abspath('.'))
from src.service_orchestrator import ServiceOrchestrator
print('Orchestrator available:', ServiceOrchestrator is not None)
"

## BPMN Workflow Testing
# Run a complete decision process workflow
python .\scripts\test_openai_decision_process.py

# Start the main DADM application
python .\src\app.py --process "OpenAI Decision Process"

## Service Health Checks
# Check all service endpoints
python -c "
import requests
services = [
    ('Camunda', 'http://localhost:8080'),
    ('OpenAI Service', 'http://localhost:5000/health'),
    ('Echo Service', 'http://localhost:5100/health'),
    ('Consul', 'http://localhost:8500/v1/status/leader')
]
for name, url in services:
    try:
        r = requests.get(url, timeout=5)
        print(f'{name}: ✅ {r.status_code}')
    except:
        print(f'{name}: ❌ Not responding')
"

## File Operations (Windows paths)
# View recent logs
Get-Content .\logs\app_startup.log -Tail 20 -Wait

# Check Python environment
python --version
pip list | Select-String -Pattern "requests|flask|openai"

# Project structure
Get-ChildItem -Recurse -Directory | Select-Object Name, FullName

## Development Commands
# Install dependencies
pip install -r requirements.txt

# Run tests
python -m pytest tests\ -v

# Clear Python cache
Get-ChildItem -Path . -Recurse -Name "__pycache__" | Remove-Item -Recurse -Force

## Environment Variables (for PowerShell session)
$env:CAMUNDA_URL = "http://localhost:8080"
$env:OPENAI_SERVICE_URL = "http://localhost:5000"
$env:CONSUL_URL = "http://localhost:8500"

# Check environment
Get-ChildItem Env: | Where-Object Name -like "*CAMUNDA*" -or Name -like "*OPENAI*" -or Name -like "*CONSUL*"

## Debugging
# Python with debug output
$env:PYTHONUNBUFFERED = "1"
python .\src\app.py --debug

# Enable detailed logging
$env:LOG_LEVEL = "DEBUG"

# Check process status
Get-Process | Where-Object {$_.ProcessName -like "*python*" -or $_.ProcessName -like "*docker*"}
