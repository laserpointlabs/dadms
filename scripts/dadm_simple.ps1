# DADM System Manager - Simplified
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "status", "test", "deploy", "logs", "help")]
    [string]$Action = "help"
)

# Color functions
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }

# Service definitions
$Services = @{
    "dadm-consul" = @{ port = 8500; health = "/v1/status/leader" }
    "dadm-camunda" = @{ port = 8080; health = "/engine-rest/engine" }
    "openai-service" = @{ port = 5000; health = "/health" }
    "echo-service" = @{ port = 5100; health = "/health" }
    "service-monitor" = @{ port = $null; health = $null }
}

function Test-ServiceHealth {
    param([string]$ServiceName, [int]$Port, [string]$HealthPath)
    
    if ($Port -eq $null) { return "N/A" }
    
    try {
        $url = "http://localhost:$Port$HealthPath"
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        return if ($response.StatusCode -eq 200) { "Healthy" } else { "Unhealthy" }
    } catch {
        return "Unreachable"
    }
}

function Get-ServiceStatus {
    Write-Info "=== DADM System Status ==="
    Write-Host ""
    
    # Check Docker containers
    try {
        $containers = docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>$null | Select-Object -Skip 1
        
        foreach ($service in $Services.Keys) {
            $containerInfo = $containers | Where-Object { $_ -match "^$service" }
            
            if ($containerInfo) {
                $status = if ($containerInfo -match "Up") { "Running" } else { "Stopped" }
                $healthStatus = Test-ServiceHealth -ServiceName $service -Port $Services[$service].port -Health $Services[$service].health
                
                Write-Host "🔧 $service" -ForegroundColor White
                Write-Host "   Status: " -NoNewline
                if ($status -eq "Running") { Write-Success $status } else { Write-Error $status }
                Write-Host "   Health: " -NoNewline
                switch ($healthStatus) {
                    "Healthy" { Write-Success $healthStatus }
                    "N/A" { Write-Warning $healthStatus }
                    default { Write-Error $healthStatus }
                }
                Write-Host ""
            } else {
                Write-Host "🔧 $service" -ForegroundColor White
                Write-Host "   Status: " -NoNewline; Write-Error "Not Found"
                Write-Host ""
            }
        }
    } catch {
        Write-Error "Error checking Docker containers: $_"
    }
}

function Start-DADMServices {
    Write-Info "=== Starting DADM Services ==="
    
    $startOrder = @("dadm-consul", "dadm-camunda", "openai-service", "echo-service", "service-monitor")
    
    foreach ($service in $startOrder) {
        Write-Host "Starting $service..." -NoNewline
        try {
            $result = docker start $service 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success " ✓"
            } else {
                Write-Error " ✗ ($result)"
            }
        } catch {
            Write-Error " ✗ ($_)"
        }
        Start-Sleep -Seconds 2
    }
    
    Write-Host ""
    Write-Info "Waiting for services to initialize..."
    Start-Sleep -Seconds 10
    Get-ServiceStatus
}

function Stop-DADMServices {
    Write-Info "=== Stopping DADM Services ==="
    
    $stopOrder = @("service-monitor", "echo-service", "openai-service", "dadm-camunda", "dadm-consul")
    
    foreach ($service in $stopOrder) {
        Write-Host "Stopping $service..." -NoNewline
        try {
            docker stop $service | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success " ✓"
            } else {
                Write-Error " ✗"
            }
        } catch {
            Write-Error " ✗ ($_)"
        }
    }
    Write-Host ""
    Write-Success "All services stopped."
}

function Restart-DADMServices {
    Write-Info "=== Restarting DADM Services ==="
    Stop-DADMServices
    Start-Sleep -Seconds 5
    Start-DADMServices
}

function Test-DADMSystem {
    Write-Info "=== Testing DADM System ==="
    Write-Host ""
    
    # Test service discovery
    Write-Host "🔍 Testing Service Discovery..."
    try {
        Set-Location "c:\Users\JohnDeHart\Documents\dadm"
        $result = python .\scripts\test_service_discovery.py 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "   ✓ $result"
        } else {
            Write-Error "   ✗ Service discovery failed: $result"
        }
    } catch {
        Write-Error "   ✗ Service discovery error: $_"
    }
    
    # Test orchestrators
    Write-Host "🎛️  Testing Orchestrators..."
    try {
        $result = python .\scripts\test_orchestrators.py 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "   ✓ $result"
        } else {
            Write-Error "   ✗ Orchestrator test failed: $result"
        }
    } catch {
        Write-Error "   ✗ Orchestrator error: $_"
    }
    
    # Test echo service
    Write-Host "📞 Testing Echo Service..."
    try {
        $testPayload = @{
            task_name = "test_task"
            task_documentation = "Test documentation"
            variables = @{ test_var = "test_value" }
            service_properties = @{ "service.type" = "test"; "service.name" = "dadm-echo-service" }
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "http://localhost:5100/process_task" -Method Post -Body $testPayload -ContentType "application/json" -TimeoutSec 10
        Write-Success "   ✓ Echo service responded: $($response.status)"
    } catch {
        Write-Error "   ✗ Echo service test failed: $_"
    }
    
    Write-Host ""
    Get-ServiceStatus
}

function Show-ServiceLogs {
    Write-Info "=== Service Logs ==="
    Write-Host ""
    Write-Host "Available services:"
    $Services.Keys | ForEach-Object { Write-Host "  - $_" }
    Write-Host ""
    
    $service = Read-Host "Enter service name (or 'all' for all services)"
    
    if ($service -eq "all") {
        foreach ($svc in $Services.Keys) {
            Write-Host "=== $svc Logs ===" -ForegroundColor Yellow
            docker logs --tail 20 $svc
            Write-Host ""
        }
    } elseif ($Services.ContainsKey($service)) {
        Write-Host "=== $service Logs ===" -ForegroundColor Yellow
        docker logs --tail 50 $service
    } else {
        Write-Error "Service '$service' not found."
    }
}

function Show-Help {
    Write-Host "DADM System Manager" -ForegroundColor Green
    Write-Host "===================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\dadm_simple.ps1 [action]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Yellow
    Write-Host "  start    - Start all DADM services"
    Write-Host "  stop     - Stop all DADM services"
    Write-Host "  restart  - Restart all DADM services"
    Write-Host "  status   - Show service status and health"
    Write-Host "  test     - Run comprehensive system tests"
    Write-Host "  logs     - View service logs"
    Write-Host "  help     - Show this help message"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\dadm_simple.ps1 status"
    Write-Host "  .\dadm_simple.ps1 restart"
    Write-Host "  .\dadm_simple.ps1 test"
    Write-Host ""
    Write-Host "Quick URLs:" -ForegroundColor Green
    Write-Host "  Camunda:     http://localhost:8080"
    Write-Host "  Consul:      http://localhost:8500"
    Write-Host "  OpenAI Svc:  http://localhost:5000"
    Write-Host "  Echo Svc:    http://localhost:5100"
}

# Main execution
switch ($Action.ToLower()) {
    "start" { Start-DADMServices }
    "stop" { Stop-DADMServices }
    "restart" { Restart-DADMServices }
    "status" { Get-ServiceStatus }
    "test" { Test-DADMSystem }
    "logs" { Show-ServiceLogs }
    "help" { Show-Help }
    default { Show-Help }
}
