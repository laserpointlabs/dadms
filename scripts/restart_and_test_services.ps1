# DADM Service Restart and Testing Script
# This script will restart all services and run comprehensive tests

Write-Host "=== DADM Service Restart and Testing Workflow ===" -ForegroundColor Green

# Change to project directory
Set-Location "c:\Users\JohnDeHart\Documents\dadm"

Write-Host "`n1. Stopping any existing services..." -ForegroundColor Yellow

# Kill any existing Python processes that might be running services
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "python" } | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "   ✓ Stopped existing Python processes"

# Wait a moment for processes to fully stop
Start-Sleep -Seconds 2

Write-Host "`n2. Starting OpenAI Assistant Service..." -ForegroundColor Yellow
# Start OpenAI service in background
$openaiJob = Start-Job -ScriptBlock {
    Set-Location "c:\Users\JohnDeHart\Documents\dadm\services\openai_service"
    python service.py
}
Write-Host "   ✓ OpenAI service starting (Job ID: $($openaiJob.Id))"

Write-Host "`n3. Starting Echo Test Service..." -ForegroundColor Yellow
# Start Echo service in background
$echoJob = Start-Job -ScriptBlock {
    Set-Location "c:\Users\JohnDeHart\Documents\dadm\services\echo_service"
    python service.py
}
Write-Host "   ✓ Echo service starting (Job ID: $($echoJob.Id))"

Write-Host "`n4. Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n5. Testing service discovery..." -ForegroundColor Yellow
python -c "
from config.service_registry import discover_services, get_discovered_services
import json

print('=== SERVICE DISCOVERY TEST ===')
services = discover_services()
print(f'Discovered {sum(len(svc) for svc in services.values())} services across {len(services)} types')

registry = get_discovered_services()
for service_type, type_services in registry.items():
    print(f'  {service_type}: {list(type_services.keys())}')
print('✓ Service discovery working')
"

Write-Host "`n6. Testing service orchestrators..." -ForegroundColor Yellow
python -c "
print('=== ORCHESTRATOR TEST ===')
try:
    from src.service_orchestrator import ServiceOrchestrator
    from src.enhanced_service_orchestrator import EnhancedServiceOrchestrator
    
    regular = ServiceOrchestrator()
    enhanced = EnhancedServiceOrchestrator()
    
    print(f'Regular orchestrator default service: {regular._get_default_service_name()}')
    print(f'Enhanced orchestrator default service: {enhanced._get_default_service_name()}')
    print('✓ Both orchestrators initialized successfully')
except Exception as e:
    print(f'✗ Error: {e}')
"

Write-Host "`n7. Testing service health endpoints..." -ForegroundColor Yellow
python -c "
import requests
import time

print('=== HEALTH CHECK TEST ===')
services = [
    ('OpenAI Assistant', 'http://localhost:5000/health'),
    ('Echo Service', 'http://localhost:5100/health')
]

for name, url in services:
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print(f'✓ {name}: Healthy')
        else:
            print(f'⚠ {name}: Status {response.status_code}')
    except Exception as e:
        print(f'✗ {name}: Not responding - {e}')
"

Write-Host "`n8. Testing echo service functionality..." -ForegroundColor Yellow
python -c "
import requests
import json

print('=== ECHO SERVICE FUNCTIONAL TEST ===')
try:
    test_payload = {
        'task_name': 'test_task',
        'task_documentation': 'Test documentation',
        'variables': {'test_var': 'test_value'},
        'service_properties': {'service.type': 'test', 'service.name': 'dadm-echo-service'}
    }
    
    response = requests.post('http://localhost:5100/process_task', 
                           json=test_payload, 
                           timeout=10)
    
    if response.status_code == 200:
        result = response.json()
        print(f'✓ Echo service responded: {result.get(\"status\", \"unknown\")}')
    else:
        print(f'✗ Echo service error: Status {response.status_code}')
        
except Exception as e:
    print(f'✗ Echo service test failed: {e}')
"

Write-Host "`n9. Service job status:" -ForegroundColor Yellow
Write-Host "   OpenAI Service Job Status: $(Get-Job $openaiJob.Id | Select-Object -ExpandProperty State)"
Write-Host "   Echo Service Job Status: $(Get-Job $echoJob.Id | Select-Object -ExpandProperty State)"

Write-Host "`n=== NEXT STEPS ===" -ForegroundColor Green
Write-Host "1. Check service logs if any tests failed"
Write-Host "2. Test with Camunda if all services are healthy"
Write-Host "3. Deploy BPMN processes: python scripts/deploy_bpmn.py"
Write-Host "4. Monitor services: python scripts/monitor_process_execution.py"

Write-Host "`nTo stop services later, run: Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Cyan
Write-Host "Service jobs are running in background. Check with: Get-Job" -ForegroundColor Cyan
