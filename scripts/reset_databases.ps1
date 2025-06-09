# Reset Databases and Docker Volumes Script
# This script clears Neo4j, Qdrant databases and resets Docker volumes for clean testing

param(
    [switch]$SkipConfirmation,
    [switch]$KeepContainers,
    [switch]$Verbose
)

# Set error handling
$ErrorActionPreference = "Continue"

function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    switch ($Type) {
        "Success" { Write-Host "[$timestamp] ✅ $Message" -ForegroundColor Green }
        "Warning" { Write-Host "[$timestamp] ⚠️  $Message" -ForegroundColor Yellow }
        "Error"   { Write-Host "[$timestamp] ❌ $Message" -ForegroundColor Red }
        "Info"    { Write-Host "[$timestamp] ℹ️  $Message" -ForegroundColor Cyan }
        default   { Write-Host "[$timestamp] $Message" }
    }
}

function Test-DockerRunning {
    try {
        docker version > $null 2>&1
        return $true
    }
    catch {
        return $false
    }
}

function Clear-Neo4jDatabase {
    Write-Status "Clearing Neo4j database..." "Info"
    
    try {
        # Try to run the Python script to clear Neo4j
        python scripts/clear_neo4j.py
        Write-Status "Neo4j database cleared successfully" "Success"
        return $true
    }
    catch {
        Write-Status "Failed to clear Neo4j database: $($_.Exception.Message)" "Warning"
        return $false
    }
}

function Clear-QdrantDatabase {
    Write-Status "Clearing Qdrant database..." "Info"
    
    try {
        # Create a simple Python script to clear Qdrant
        $qdrantClearScript = @"
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

try:
    from qdrant_client import QdrantClient
    
    # Connect to Qdrant
    client = QdrantClient(host="localhost", port=6333)
    
    # Get all collections
    collections = client.get_collections()
    
    if collections.collections:
        for collection in collections.collections:
            collection_name = collection.name
            print(f"Deleting collection: {collection_name}")
            client.delete_collection(collection_name)
        print(f"Cleared {len(collections.collections)} collections from Qdrant")
    else:
        print("No collections found in Qdrant")
        
except Exception as e:
    print(f"Error clearing Qdrant: {e}")
    sys.exit(1)
"@
        
        # Write the script to a temporary file
        $tempScript = "scripts/temp_clear_qdrant.py"
        $qdrantClearScript | Out-File -FilePath $tempScript -Encoding UTF8
        
        # Run the script
        python $tempScript
        
        # Clean up temp script
        Remove-Item $tempScript -ErrorAction SilentlyContinue
        
        Write-Status "Qdrant database cleared successfully" "Success"
        return $true
    }
    catch {
        Write-Status "Failed to clear Qdrant database: $($_.Exception.Message)" "Warning"
        return $false
    }
}

function Stop-DockerServices {
    Write-Status "Stopping Docker services..." "Info"
    
    try {
        # Change to docker directory if it exists
        if (Test-Path "docker/docker-compose.yml") {
            Push-Location "docker"
            docker-compose down
            Pop-Location
        } else {
            # Try from root directory
            docker-compose down
        }
        
        Write-Status "Docker services stopped" "Success"
        return $true
    }
    catch {
        Write-Status "Failed to stop Docker services: $($_.Exception.Message)" "Warning"
        return $false
    }
}

function Remove-DockerVolumes {
    Write-Status "Removing Docker volumes..." "Info"
    
    try {
        # Get all volumes related to DADM
        $volumes = docker volume ls --format "{{.Name}}" | Where-Object { 
            $_ -match "dadm|neo4j|qdrant|postgres|camunda" 
        }
        
        if ($volumes) {
            Write-Status "Found volumes to remove: $($volumes -join ', ')" "Info"
            
            foreach ($volume in $volumes) {
                try {
                    docker volume rm $volume
                    Write-Status "Removed volume: $volume" "Success"
                }
                catch {
                    Write-Status "Failed to remove volume $volume`: $($_.Exception.Message)" "Warning"
                }
            }
        } else {
            Write-Status "No DADM-related volumes found" "Info"
        }
        
        return $true
    }
    catch {
        Write-Status "Failed to remove Docker volumes: $($_.Exception.Message)" "Error"
        return $false
    }
}

function Remove-DockerImages {
    param([switch]$Force)
    
    Write-Status "Removing Docker images..." "Info"
    
    try {
        # Get DADM-related images
        $images = docker images --format "{{.Repository}}:{{.Tag}}" | Where-Object { 
            $_ -match "dadm|openai-service|echo-service" 
        }
        
        if ($images) {
            Write-Status "Found images to remove: $($images -join ', ')" "Info"
            
            foreach ($image in $images) {
                try {
                    if ($Force) {
                        docker rmi -f $image
                    } else {
                        docker rmi $image
                    }
                    Write-Status "Removed image: $image" "Success"
                }
                catch {
                    Write-Status "Failed to remove image $image`: $($_.Exception.Message)" "Warning"
                }
            }
        } else {
            Write-Status "No DADM-related images found" "Info"
        }
        
        return $true
    }
    catch {
        Write-Status "Failed to remove Docker images: $($_.Exception.Message)" "Error"
        return $false
    }
}

function Start-DockerServices {
    Write-Status "Starting Docker services..." "Info"
    
    try {
        # Change to docker directory if it exists
        if (Test-Path "docker/docker-compose.yml") {
            Push-Location "docker"
            docker-compose up -d
            Pop-Location
        } else {
            # Try from root directory
            docker-compose up -d
        }
        
        # Wait a bit for services to start
        Write-Status "Waiting 30 seconds for services to initialize..." "Info"
        Start-Sleep -Seconds 30
        
        Write-Status "Docker services started" "Success"
        return $true
    }
    catch {
        Write-Status "Failed to start Docker services: $($_.Exception.Message)" "Error"
        return $false
    }
}

function Show-ServiceStatus {
    Write-Status "Checking service status..." "Info"
    
    try {
        # Check Docker containers
        Write-Host "`n=== Docker Container Status ===" -ForegroundColor Cyan
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        # Check Docker volumes
        Write-Host "`n=== Docker Volumes ===" -ForegroundColor Cyan
        docker volume ls --format "table {{.Name}}\t{{.Driver}}"
        
        return $true
    }
    catch {
        Write-Status "Failed to get service status: $($_.Exception.Message)" "Error"
        return $false
    }
}

# Main execution
Write-Host "="*80 -ForegroundColor Green
Write-Host "DADM Database and Docker Reset Script" -ForegroundColor Green
Write-Host "="*80 -ForegroundColor Green

# Check if Docker is running
if (-not (Test-DockerRunning)) {
    Write-Status "Docker is not running or not accessible" "Error"
    Write-Status "Please start Docker Desktop and try again" "Error"
    exit 1
}

# Confirmation prompt
if (-not $SkipConfirmation) {
    Write-Host "`nThis script will:" -ForegroundColor Yellow
    Write-Host "  1. Clear Neo4j database (all nodes and relationships)" -ForegroundColor Yellow
    Write-Host "  2. Clear Qdrant database (all collections)" -ForegroundColor Yellow
    Write-Host "  3. Stop all Docker services" -ForegroundColor Yellow
    Write-Host "  4. Remove Docker volumes (data will be lost)" -ForegroundColor Yellow
    Write-Host "  5. Remove Docker images (will need to rebuild)" -ForegroundColor Yellow
    if (-not $KeepContainers) {
        Write-Host "  6. Restart Docker services" -ForegroundColor Yellow
    }
    Write-Host ""
    
    $response = Read-Host "Are you sure you want to proceed? (yes/no)"
    if ($response -ne "yes" -and $response -ne "y") {
        Write-Status "Operation cancelled by user" "Info"
        exit 0
    }
}

Write-Status "Starting database and Docker reset process..." "Info"

# Step 1: Clear databases before stopping services
$databasesCleared = $false

Write-Status "Attempting to clear databases while services are running..." "Info"
$neo4jCleared = Clear-Neo4jDatabase
$qdrantCleared = Clear-QdrantDatabase

if ($neo4jCleared -and $qdrantCleared) {
    $databasesCleared = $true
    Write-Status "Both databases cleared successfully while running" "Success"
} else {
    Write-Status "Some databases could not be cleared while running, will retry after restart" "Warning"
}

# Step 2: Stop Docker services
Stop-DockerServices

# Step 3: Remove volumes and images
Remove-DockerVolumes
Remove-DockerImages -Force

# Step 4: Restart services if requested
if (-not $KeepContainers) {
    Start-DockerServices
    
    # Step 5: Clear databases again if they weren't cleared initially
    if (-not $databasesCleared) {
        Write-Status "Retrying database clearing after restart..." "Info"
        Start-Sleep -Seconds 10  # Give services more time to start
        
        $neo4jCleared = Clear-Neo4jDatabase
        $qdrantCleared = Clear-QdrantDatabase
        
        if ($neo4jCleared -and $qdrantCleared) {
            Write-Status "Databases cleared successfully after restart" "Success"
        } else {
            Write-Status "Some databases still could not be cleared" "Warning"
        }
    }
}

# Step 6: Show final status
Show-ServiceStatus

Write-Host "`n" + ("="*80) -ForegroundColor Green
Write-Status "Database and Docker reset process completed!" "Success"
Write-Host "="*80 -ForegroundColor Green

if ($KeepContainers) {
    Write-Status "Note: Docker services were stopped but not restarted (--KeepContainers flag)" "Info"
    Write-Status "Run 'docker-compose up -d' to restart services when ready" "Info"
}

Write-Status "You can now run tests with a clean environment" "Info"
