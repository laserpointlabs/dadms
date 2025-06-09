# Consul Service Registration Script for DADM
# This script automatically registers all DADM services with Consul

# Function to load service configuration from service folder
function Get-ServiceConfig {
    param([string]$ServiceFolder)
    
    $configPath = Join-Path $ServiceFolder "service_config.json"
    if (Test-Path $configPath) {
        try {
            $config = Get-Content $configPath | ConvertFrom-Json
            return $config.service
        } catch {
            Write-Host "⚠️ Failed to load config from $configPath : $_" -ForegroundColor Yellow
            return $null
        }
    }
    return $null
}

# Function to get all service definitions from service folders
function Get-ServiceDefinitions {
    $serviceDefinitions = @{}
    $servicesDir = Join-Path (Get-Location) "services"
    
    if (Test-Path $servicesDir) {
        $serviceFolders = Get-ChildItem -Path $servicesDir -Directory
        
        foreach ($folder in $serviceFolders) {
            $config = Get-ServiceConfig $folder.FullName
            if ($config) {
                $serviceDefinitions[$folder.Name] = @{
                    name = $config.name
                    port = $config.port
                    type = $config.type
                    healthEndpoint = $config.health_endpoint
                    metadata = @{
                        version = if ($config.version) { $config.version } else { "1.0" }
                        description = if ($config.description) { $config.description } else { "DADM Service" }
                    }
                }
                
                # Add any additional metadata from config
                if ($config.metadata) {
                    foreach ($key in $config.metadata.PSObject.Properties.Name) {
                        $serviceDefinitions[$folder.Name].metadata[$key] = $config.metadata.$key
                    }
                }
                
                # Add environment-specific metadata
                if ($env:OPENAI_ASSISTANT_ID -and $config.type -eq "assistant") {
                    $serviceDefinitions[$folder.Name].metadata.assistant_id = $env:OPENAI_ASSISTANT_ID
                }
                
                Write-Host "✅ Loaded service config: $($config.name) from $($folder.Name)" -ForegroundColor Green
            } else {
                Write-Host "⚠️ No service_config.json found in $($folder.Name)" -ForegroundColor Yellow
            }
        }
    }
    
    if ($serviceDefinitions.Count -eq 0) {
        Write-Host "❌ No service configurations found in services/ directory" -ForegroundColor Red
        Write-Host "   Make sure each service has a service_config.json file" -ForegroundColor Yellow
    }
    
    return $serviceDefinitions
}

# Function to get running Docker containers and their network information
function Get-RunningContainers {
    $containers = @{}
    
    try {
        # Get all running containers with their network info
        $containerInfo = docker ps --format "json" | ConvertFrom-Json
        
        foreach ($container in $containerInfo) {
            # Get detailed network information for each container
            $networkInfo = docker inspect $container.Names --format "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" 2>$null
            
            if ($networkInfo) {
                $containers[$container.Names] = @{
                    id = $container.ID
                    image = $container.Image
                    status = $container.Status
                    ports = $container.Ports
                    ipAddress = $networkInfo.Trim()
                }
                Write-Host "🐳 Found container: $($container.Names) at $networkInfo" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Host "⚠️ Failed to get container information: $_" -ForegroundColor Yellow
    }
    
    return $containers
}

# Function to find matching container for a service
function Find-ServiceContainer {
    param(
        [string]$ServiceFolderName,
        [string]$ServiceName,
        [hashtable]$RunningContainers
    )
    
    # Try multiple matching strategies
    $possibleNames = @(
        $ServiceName,                              # Exact service name
        $ServiceFolderName,                        # Service folder name
        "$ServiceFolderName-service",              # Folder name + "-service"
        $ServiceName.Replace("dadm-", ""),         # Remove "dadm-" prefix
        $ServiceName.Replace("-", "_"),            # Replace dashes with underscores
        $ServiceName.Replace("_", "-"),            # Replace underscores with dashes
        $ServiceFolderName.Replace("_", "-"),      # Folder name with dashes
        "$($ServiceFolderName.Replace('_', '-'))-service",  # Folder name with dashes + "-service"
        $ServiceFolderName.Replace("_service", ""), # Remove "_service" suffix
        "$($ServiceFolderName.Replace('_service', ''))-service"  # Replace "_service" with "-service"
    )
    
    foreach ($name in $possibleNames) {
        if ($RunningContainers.ContainsKey($name)) {
            Write-Host "✅ Matched service '$ServiceName' to container '$name'" -ForegroundColor Green
            return @{
                containerName = $name
                containerInfo = $RunningContainers[$name]
            }
        }
    }
    
    # If no exact match, try partial matching
    foreach ($containerName in $RunningContainers.Keys) {
        $servicePart = $ServiceName.Replace('dadm-', '')
        $folderPart = $ServiceFolderName.Replace('_service', '').Replace('_', '-')
        
        if ($containerName -like "*$servicePart*" -or 
            $containerName -like "*$folderPart*" -or
            $containerName -like "*$ServiceFolderName*") {
            Write-Host "✅ Partially matched service '$ServiceName' to container '$containerName'" -ForegroundColor Yellow
            return @{
                containerName = $containerName
                containerInfo = $RunningContainers[$containerName]
            }
        }
    }
    
    Write-Host "❌ No matching container found for service '$ServiceName' (folder: $ServiceFolderName)" -ForegroundColor Red
    Write-Host "   Available containers: $($RunningContainers.Keys -join ', ')" -ForegroundColor Gray
    return $null
}

# Load service definitions dynamically
$script:serviceDefinitions = Get-ServiceDefinitions

function Test-ConsulRunning {
    try {
        $consulStatus = Invoke-WebRequest -Uri 'http://localhost:8500/v1/status/leader' -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        return $consulStatus.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Start-ConsulContainer {
    try {
        # Check if consul container exists
        $containerExists = docker ps -a --filter "name=^consul$" --format "{{.Names}}" 2>$null
        if ($containerExists -eq 'consul') {
            # Container exists, start it
            docker start consul
        } else {
            # Container doesn't exist, create and start it
            docker run -d --name consul -p 8500:8500 consul:1.15
        }
        Start-Sleep -Seconds 3
        return Test-ConsulRunning
    } catch {
        Write-Host "❌ Failed to start Consul with Docker: $_" -ForegroundColor Red
        return $false
    }
}

function Register-Service {
    param (
        [string]$ServiceDir,
        [hashtable]$ServiceDef,
        [hashtable]$RunningContainers
    )
    
    # Find the matching container for this service
    $containerMatch = Find-ServiceContainer -ServiceFolderName $ServiceDir -ServiceName $ServiceDef.name -RunningContainers $RunningContainers
    
    if (-not $containerMatch) {
        Write-Host "❌ Cannot register $($ServiceDef.name) - no running container found" -ForegroundColor Red
        return $false
    }
    
    $containerName = $containerMatch.containerName
    $containerIP = $containerMatch.containerInfo.ipAddress
    
    # Use container IP for address since Consul needs to reach it from within Docker network
    $serviceAddress = $containerIP
    $healthCheckUrl = "http://$containerIP`:$($ServiceDef.port)$($ServiceDef.healthEndpoint)"
    
    Write-Host "Registering $($ServiceDef.name)..." -ForegroundColor Cyan
    Write-Host "  Container: $containerName" -ForegroundColor Gray
    Write-Host "  Address: $serviceAddress" -ForegroundColor Gray
    Write-Host "  Health Check: $healthCheckUrl" -ForegroundColor Gray
      # Create service registration data
    $serviceData = @{
        Name = $ServiceDef.name
        Address = $serviceAddress
        Port = [int]$ServiceDef.port
        Tags = @("type-$($ServiceDef.type)", "container-$containerName")
        Meta = @{}
        Check = @{
            HTTP = $healthCheckUrl
            Interval = '10s'
            Timeout = '3s'
        }
    }
      # Add metadata as strings (Consul requires string values)
    foreach ($key in $ServiceDef.metadata.Keys) {
        $value = $ServiceDef.metadata[$key]
        if ($null -ne $value) {
            $serviceData.Meta[$key] = $value.ToString()
        }
    }
    
    # Register with Consul
    try {
        $serviceJson = $serviceData | ConvertTo-Json -Depth 10
        Invoke-RestMethod -Uri 'http://localhost:8500/v1/agent/service/register' `
            -Method Put `
            -Body $serviceJson `
            -ContentType 'application/json' `
            -UseBasicParsing
            
        Write-Host "✅ Successfully registered $($ServiceDef.name)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Failed to register $($ServiceDef.name): $_" -ForegroundColor Red
        return $false
    }
}

# Main Script

# 1. Check/Start Consul
Write-Host "`nChecking if Consul is running..." -ForegroundColor Cyan
if (-not (Test-ConsulRunning)) {
    Write-Host "❌ Consul is not running locally." -ForegroundColor Red
    Write-Host "Starting Consul with Docker..." -ForegroundColor Yellow
    
    if (-not (Start-ConsulContainer)) {
        Write-Host "Cannot proceed without Consul running. Please start Consul first with:" -ForegroundColor Red
        Write-Host "   docker run -d --name consul -p 8500:8500 consul:1.15" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "✅ Consul is running!" -ForegroundColor Green

# 2. Open Consul UI
Write-Host "`nOpening Consul UI in your default browser..." -ForegroundColor Cyan
Start-Process "http://localhost:8500/ui/dc1/services"

# 3. Load environment if needed
if (-not $env:DOCKER_CONTAINER) {
    . "$PSScriptRoot\setup_environment.ps1"
}

# 4. Auto-register services from the services directory
$servicesPath = Join-Path (Split-Path $PSScriptRoot) "services"
$registered = @()

# Get running containers first
Write-Host "`nDiscovering running containers..." -ForegroundColor Cyan
$runningContainers = Get-RunningContainers

Write-Host "`nRegistering discovered services..." -ForegroundColor Cyan
Get-ChildItem -Path $servicesPath -Directory | ForEach-Object {
    $serviceName = $_.Name
    
    if ($script:serviceDefinitions.ContainsKey($serviceName)) {
        $serviceDef = $script:serviceDefinitions[$serviceName]
        if (Register-Service -ServiceDir $serviceName -ServiceDef $serviceDef -RunningContainers $runningContainers) {
            $registered += $serviceName
        }
    } else {
        Write-Host "⚠️ No service definition found for $serviceName" -ForegroundColor Yellow
    }
}

# 5. Final status check
Write-Host "`nFinal service status:" -ForegroundColor Cyan

Write-Host "⏳ Waiting a few seconds for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$services = Invoke-RestMethod -Uri 'http://localhost:8500/v1/catalog/services' -UseBasicParsing
$services | Get-Member -MemberType NoteProperty | 
    Where-Object { $_.Name -ne 'consul' } | 
    ForEach-Object {
        $name = $_.Name
        $healthCheck = Invoke-RestMethod -Uri "http://localhost:8500/v1/health/service/$name" -UseBasicParsing
        if ($healthCheck.Count -gt 0) {
            $status = $healthCheck[0].Checks | 
                Where-Object { $_.ServiceName -eq $name } |
                Select-Object -First 1
            
            $color = switch ($status.Status) {
                'passing' { 'Green' }
                'warning' { 'Yellow' }
                'critical' { 'Red' }
                default { 'Gray' }
            }
            
            Write-Host "  $name`: $($status.Status)" -ForegroundColor $color
        } else {
            Write-Host "  $name`: Not found" -ForegroundColor Red
        }
    }

Write-Host "`nDone! Services registered: $($registered -join ', ')" -ForegroundColor Cyan
Write-Host "Check the Consul UI for service details." -ForegroundColor Cyan
