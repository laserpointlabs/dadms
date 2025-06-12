# DADM Docker Compose Deployment Script for Windows PowerShell
# This script helps deploy and manage the DADM system using Docker Compose

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("check", "build", "deploy", "full", "test", "status", "stop", "logs")]
    [string]$Command,
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceName = ""
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BaseDir = Split-Path -Parent $ScriptDir
$DockerDir = Join-Path $BaseDir "docker"

# Service configurations
$Services = @{
    "consul" = @{ port = 8500; path = "/v1/status/leader" }
    "postgres" = @{ port = 5432; path = $null }
    "camunda" = @{ port = 8080; path = "/engine-rest/engine" }
    "qdrant" = @{ port = 6333; path = "/collections" }
    "neo4j" = @{ port = 7474; path = "/" }
    "openai-service" = @{ port = 5000; path = "/health" }
    "echo-service" = @{ port = 5100; path = "/health" }
    "service-monitor" = @{ port = 5200; path = "/health" }
    "mcp-statistical-service" = @{ port = 5201; path = "/health" }
    "mcp-neo4j-service" = @{ port = 5202; path = "/health" }
    "mcp-script-execution-service" = @{ port = 5203; path = "/health" }
    "llm-mcp-pipeline-service" = @{ port = 5204; path = "/health" }
    "dadm-wrapper-service" = @{ port = 5205; path = "/health" }
}

function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    
    switch ($Type) {
        "Success" { Write-Host "✓ $Message" -ForegroundColor Green }
        "Error" { Write-Host "✗ $Message" -ForegroundColor Red }
        "Warning" { Write-Host "⚠ $Message" -ForegroundColor Yellow }
        default { Write-Host "$Message" -ForegroundColor White }
    }
}

function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    # Check Docker
    try {
        $dockerVersion = docker --version
        if ($LASTEXITCODE -eq 0) {
            Write-Status "$dockerVersion" "Success"
        } else {
            Write-Status "Docker is not installed or not in PATH" "Error"
            return $false
        }
    } catch {
        Write-Status "Docker is not installed or not in PATH" "Error"
        return $false
    }
    
    # Check Docker Compose
    try {
        $composeVersion = docker compose version
        if ($LASTEXITCODE -eq 0) {
            Write-Status "$composeVersion" "Success"
        } else {
            Write-Status "Docker Compose is not installed or not in PATH" "Error"
            return $false
        }
    } catch {
        Write-Status "Docker Compose is not installed or not in PATH" "Error"
        return $false
    }
    
    # Check .env file
    $envFile = Join-Path $BaseDir ".env"
    if (Test-Path $envFile) {
        Write-Status ".env file found" "Success"
    } else {
        Write-Status ".env file not found. Using default values." "Warning"
    }
    
    return $true
}

function Build-Services {
    Write-Status "Building Docker services..."
    
    Push-Location $DockerDir
    try {
        docker compose build --no-cache
        if ($LASTEXITCODE -eq 0) {
            Write-Status "All services built successfully" "Success"
            return $true
        } else {
            Write-Status "Failed to build services" "Error"
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Deploy-Services {
    Write-Status "Deploying services..."
    
    Push-Location $DockerDir
    try {
        docker compose up -d
        if ($LASTEXITCODE -eq 0) {
            Write-Status "All services deployed successfully" "Success"
            return $true
        } else {
            Write-Status "Failed to deploy services" "Error"
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Test-ServiceHealth {
    param([string]$ServiceName, [int]$MaxRetries = 30)
    
    if (-not $Services.ContainsKey($ServiceName)) {
        Write-Status "Unknown service: $ServiceName" "Error"
        return $false
    }
    
    $serviceConfig = $Services[$ServiceName]
    $port = $serviceConfig.port
    $path = $serviceConfig.path
    
    if ($null -eq $path) {
        # Special case for database services
        return $true
    }
    
    $url = "http://localhost:$port$path"
    
    for ($attempt = 1; $attempt -le $MaxRetries; $attempt++) {
        try {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                return $true
            }
        } catch {
            # Service not ready yet
        }
        
        if ($attempt -lt $MaxRetries) {
            Start-Sleep -Seconds 2
        }
    }
    
    return $false
}

function Wait-ForServices {
    Write-Status "Waiting for services to become healthy..."
    
    # Services to check in order (dependencies first)
    $checkOrder = @(
        "consul", "postgres", "qdrant", "neo4j", "camunda",
        "openai-service", "echo-service",
        "mcp-statistical-service", "mcp-neo4j-service", "mcp-script-execution-service",
        "llm-mcp-pipeline-service", "dadm-wrapper-service", "service-monitor"
    )
    
    foreach ($serviceName in $checkOrder) {
        Write-Status "Checking $serviceName..."
        if (Test-ServiceHealth -ServiceName $serviceName) {
            Write-Status "$serviceName is healthy" "Success"
        } else {
            Write-Status "$serviceName is not responding" "Error"
            return $false
        }
    }
    
    Write-Status "All services are healthy" "Success"
    return $true
}

function Test-Integration {
    Write-Status "Running integration tests..."
    
    # Test service discovery
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8500/v1/catalog/services" -TimeoutSec 10
        $serviceCount = $response.PSObject.Properties.Count
        Write-Status "Service discovery working: $serviceCount services registered" "Success"
    } catch {
        Write-Status "Service discovery test failed: $($_.Exception.Message)" "Error"
        return $false
    }
    
    # Test LLM-MCP Pipeline Service
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5204/health" -TimeoutSec 10
        Write-Status "LLM-MCP Pipeline Service health check passed" "Success"
        
        $pipelineResponse = Invoke-RestMethod -Uri "http://localhost:5204/pipelines" -TimeoutSec 10
        $pipelineCount = $pipelineResponse.pipelines.Count
        Write-Status "Pipeline service: $pipelineCount pipelines available" "Success"
    } catch {
        Write-Status "LLM-MCP Pipeline Service test failed: $($_.Exception.Message)" "Error"
        return $false
    }
    
    # Test DADM Wrapper Service
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5205/health" -TimeoutSec 10
        Write-Status "DADM Wrapper Service health check passed" "Success"
        
        $infoResponse = Invoke-RestMethod -Uri "http://localhost:5205/info" -TimeoutSec 10
        $serviceName = $infoResponse.service_name
        Write-Status "DADM Wrapper Service info: $serviceName" "Success"
    } catch {
        Write-Status "DADM Wrapper Service test failed: $($_.Exception.Message)" "Error"
        return $false
    }
    
    Write-Status "All integration tests passed" "Success"
    return $true
}

function Show-ServiceStatus {
    Write-Status "Service Status:"
    Write-Host ("-" * 60)
    
    $Services.GetEnumerator() | ForEach-Object {
        $serviceName = $_.Key
        $config = $_.Value
        $port = $config.port
        $path = $config.path
        
        if ($path) {
            $url = "http://localhost:$port$path"
            try {
                $response = Invoke-WebRequest -Uri $url -TimeoutSec 3 -UseBasicParsing
                $status = if ($response.StatusCode -eq 200) { "✓ Running" } else { "✗ Error" }
            } catch {
                $status = "✗ Not responding"
            }
        } else {
            $status = "? Database (check logs)"
        }
        
        Write-Host ("{0,-30} {1,-6} {2}" -f $serviceName, $port, $status)
    }
}

function Stop-Services {
    Write-Status "Stopping services..."
    
    Push-Location $DockerDir
    try {
        docker compose down
        if ($LASTEXITCODE -eq 0) {
            Write-Status "All services stopped" "Success"
        } else {
            Write-Status "Error stopping services" "Error"
        }
    } finally {
        Pop-Location
    }
}

function Show-Logs {
    param([string]$ServiceName = "")
    
    Push-Location $DockerDir
    try {
        if ($ServiceName) {
            docker compose logs -f --tail=50 $ServiceName
        } else {
            docker compose logs -f --tail=50
        }
    } finally {
        Pop-Location
    }
}

# Main execution
switch ($Command.ToLower()) {
    "check" {
        if (Test-Prerequisites) {
            Write-Status "All prerequisites met" "Success"
            exit 0
        } else {
            Write-Status "Prerequisites not met" "Error"
            exit 1
        }
    }
    
    "build" {
        if (-not (Test-Prerequisites)) { exit 1 }
        if (Build-Services) {
            exit 0
        } else {
            exit 1
        }
    }
    
    "deploy" {
        if (-not (Test-Prerequisites)) { exit 1 }
        if (Deploy-Services) {
            if (Wait-ForServices) {
                Show-ServiceStatus
                exit 0
            }
        }
        exit 1
    }
    
    "full" {
        if (-not (Test-Prerequisites)) { exit 1 }
        if (Build-Services) {
            if (Deploy-Services) {
                if (Wait-ForServices) {
                    if (Test-Integration) {
                        Show-ServiceStatus
                        Write-Status "🎉 Full deployment completed successfully!" "Success"
                        exit 0
                    }
                }
            }
        }
        exit 1
    }
    
    "test" {
        if (Test-Integration) {
            exit 0
        } else {
            exit 1
        }
    }
    
    "status" {
        Show-ServiceStatus
        exit 0
    }
    
    "stop" {
        Stop-Services
        exit 0
    }
    
    "logs" {
        Show-Logs -ServiceName $ServiceName
        exit 0
    }
    
    default {
        Write-Status "Unknown command: $Command" "Error"
        Write-Host "Usage: .\deploy_dadm.ps1 <command> [service_name]"
        Write-Host "Commands:"
        Write-Host "  check     - Check prerequisites"
        Write-Host "  build     - Build all services"
        Write-Host "  deploy    - Deploy all services"
        Write-Host "  full      - Full deployment (build + deploy + test)"
        Write-Host "  test      - Run integration tests"
        Write-Host "  status    - Show service status"
        Write-Host "  stop      - Stop all services"
        Write-Host "  logs      - Show logs for all services"
        Write-Host "  logs <service> - Show logs for specific service"
        exit 1
    }
}
