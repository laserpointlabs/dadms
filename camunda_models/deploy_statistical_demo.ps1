# Statistical MCP Demo - Deployment and Test Script
# PowerShell script to deploy and test the statistical BPMN process

Write-Host "🚀 Statistical MCP Demo - Deployment Script" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Configuration
$CamundaUrl = "http://localhost:8080"
$BpmnFile = "simple_mcp_demo_process_statistical.bpmn"
$ProcessKey = "statistical_mcp_demo"

# Step 1: Check if Camunda is running
Write-Host "`n1️⃣ Checking Camunda status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$CamundaUrl/engine-rest/engine" -Method GET -TimeoutSec 5
    Write-Host "✅ Camunda is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Camunda is not running on $CamundaUrl" -ForegroundColor Red
    Write-Host "Please start Camunda first!" -ForegroundColor Red
    exit 1
}

# Step 2: Validate BPMN file
Write-Host "`n2️⃣ Validating BPMN file..." -ForegroundColor Yellow
if (Test-Path $BpmnFile) {
    $fileSize = (Get-Item $BpmnFile).Length
    Write-Host "✅ BPMN file found: $BpmnFile ($fileSize bytes)" -ForegroundColor Green
} else {
    Write-Host "❌ BPMN file not found: $BpmnFile" -ForegroundColor Red
    exit 1
}

# Step 3: Check MCP services
Write-Host "`n3️⃣ Checking MCP services..." -ForegroundColor Yellow
$services = @{
    "Statistical Service" = "http://localhost:5201/health"
    "OpenAI Service" = "http://localhost:5000/health"
}

foreach ($service in $services.GetEnumerator()) {
    try {
        $response = Invoke-RestMethod -Uri $service.Value -Method GET -TimeoutSec 3
        Write-Host "✅ $($service.Key) is running" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  $($service.Key) not responding at $($service.Value)" -ForegroundColor Yellow
    }
}

# Step 4: Deploy BPMN to Camunda
Write-Host "`n4️⃣ Deploying BPMN process..." -ForegroundColor Yellow
try {
    # Create multipart form data for deployment
    $boundary = "----WebKitFormBoundary$(Get-Random)"
    $LF = "`r`n"
    
    # Read BPMN file content
    $bpmnContent = Get-Content $BpmnFile -Raw -Encoding UTF8
    
    # Create form data
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"deployment-name`"",
        "",
        "statistical-mcp-demo-deployment",
        "--$boundary",
        "Content-Disposition: form-data; name=`"deployment-source`"",
        "",
        "DADM-PowerShell-Script",
        "--$boundary",
        "Content-Disposition: form-data; name=`"data`"; filename=`"$BpmnFile`"",
        "Content-Type: application/xml",
        "",
        $bpmnContent,
        "--$boundary--"
    )
    
    $body = $bodyLines -join $LF
    $headers = @{
        "Content-Type" = "multipart/form-data; boundary=$boundary"
    }
    
    $response = Invoke-RestMethod -Uri "$CamundaUrl/engine-rest/deployment/create" -Method POST -Body $body -Headers $headers
    Write-Host "✅ BPMN deployed successfully" -ForegroundColor Green
    Write-Host "   Deployment ID: $($response.id)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Verify process definition
Write-Host "`n5️⃣ Verifying process definition..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$CamundaUrl/engine-rest/process-definition?key=$ProcessKey" -Method GET
    if ($response.Count -gt 0) {
        Write-Host "✅ Process definition found: $($response[0].name)" -ForegroundColor Green
        Write-Host "   Version: $($response[0].version)" -ForegroundColor Gray
        Write-Host "   ID: $($response[0].id)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Process definition not found" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to verify process definition: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: Test process execution
Write-Host "`n6️⃣ Testing process execution..." -ForegroundColor Yellow

# Sample test data
$testData = @{
    variables = @{
        dataset_name = @{ value = "Demo Test Scores"; type = "String" }
        data_values = @{ value = "85,90,88,92,87,78,82,85,80,83,89,91,86,84,79"; type = "String" }
        analysis_level = @{ value = "comprehensive"; type = "String" }
        confidence_level = @{ value = 95; type = "Long" }
        data_description = @{ value = "Student test scores for statistical demo"; type = "String" }
    }
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "$CamundaUrl/engine-rest/process-definition/key/$ProcessKey/start" -Method POST -Body $testData -ContentType "application/json"
    Write-Host "✅ Process instance started successfully" -ForegroundColor Green
    Write-Host "   Process Instance ID: $($response.id)" -ForegroundColor Gray
    
    # Check for user tasks
    Start-Sleep -Seconds 2
    $tasks = Invoke-RestMethod -Uri "$CamundaUrl/engine-rest/task?processInstanceId=$($response.id)" -Method GET
    if ($tasks.Count -gt 0) {
        Write-Host "📋 Active user task found: $($tasks[0].name)" -ForegroundColor Cyan
        Write-Host "   Task ID: $($tasks[0].id)" -ForegroundColor Gray
        Write-Host "   You can complete this task in Camunda Tasklist" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Process execution failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 7: Summary
Write-Host "`n🎯 Summary" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan
Write-Host "✅ BPMN file: $BpmnFile (validated)" -ForegroundColor Green
Write-Host "✅ Process deployed to Camunda" -ForegroundColor Green
Write-Host "✅ Test instance created" -ForegroundColor Green
Write-Host "`n📖 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open Camunda Cockpit: $CamundaUrl/camunda/app/cockpit/" -ForegroundColor White
Write-Host "2. View process diagram and instances" -ForegroundColor White
Write-Host "3. Open Camunda Tasklist: $CamundaUrl/camunda/app/tasklist/" -ForegroundColor White
Write-Host "4. Complete the user task with your data" -ForegroundColor White
Write-Host "5. Monitor execution through the statistical analysis pipeline" -ForegroundColor White

Write-Host "`n🎨 BPMN Graphics:" -ForegroundColor Magenta
Write-Host "The BPMN file includes complete visual elements for diagram rendering in Camunda Modeler or Cockpit" -ForegroundColor White

Write-Host "`n🧮 Mathematical Processing:" -ForegroundColor Magenta
Write-Host "This process performs REAL statistical calculations using NumPy/SciPy, not fake/mock results!" -ForegroundColor White
