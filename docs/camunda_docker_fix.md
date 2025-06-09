# Camunda Docker Configuration Fixes

## Issues Fixed

### 1. H2 Database Configuration Error

The Camunda container was failing to start due to an H2 database configuration error. The error message was:

```
Feature not supported: AUTO_SERVER=TRUE && DB_CLOSE_ON_EXIT=FALSE [50100-214]
```

The problem was that both `AUTO_SERVER=TRUE` and `DB_CLOSE_ON_EXIT=FALSE` cannot be used together in the H2 database configuration. We fixed this by removing the `DB_CLOSE_ON_EXIT=FALSE` option from the JDBC URL in the `docker-compose.yaml` file.

### 2. Publishing from Camunda Modeler to Docker Environment

To allow proper deployment of BPMN models from Camunda Modeler to the Docker environment, we made the following changes:

1. Added a new volume mapping in `docker-compose.yaml` to mount a persistent directory for deploying BPMN processes: 
   ```yaml
   - camunda_deployment_folder:/camunda/deployment/
   ```

2. Enabled the Camunda deployment scanner with additional environment variables:
   ```yaml
   # Configure auto-deployment
   CAMUNDA_BPM_PROCESS_DEPLOYMENT_RESOURCE_PATTERN: classpath*:**/*.bpmn
   # Enable process application scanning
   CAMUNDA_BPM_PROCESS_APPLICATION_SCAN: "true"
   # Set deployment scanner interval (in seconds)
   CAMUNDA_BPM_JOB_DEPLOYMENT_DEPLOYMENT_SCAN_INTERVAL: 5
   ```

3. Updated the `deploy-bpmn.ps1` script to support direct deployment to the Docker volume via the `docker cp` command, allowing for both REST API-based deployment and file-based deployment.

## How to Deploy BPMN Models

### Option 1: Using the REST API

```powershell
# Deploy a specific BPMN file using the REST API
.\deploy-bpmn.ps1 -BpmnFile path\to\your\process.bpmn

# Deploy all BPMN files in the current directory using the REST API
.\deploy-bpmn.ps1 -DeployAll
```

### Option 2: Using File-Based Deployment (Docker Volume)

```powershell
# Copy a specific BPMN file to the Camunda deployment folder
.\deploy-bpmn.ps1 -BpmnFile path\to\your\process.bpmn -CopyToDeployment

# Copy all BPMN files in the current directory to the Camunda deployment folder
.\deploy-bpmn.ps1 -DeployAll -CopyToDeployment
```

## Publishing from Camunda Modeler

When using Camunda Modeler, configure the deployment settings as follows:

1. Open your BPMN diagram in Camunda Modeler
2. Click on "Deploy" in the toolbar
3. Set the REST Endpoint to: `http://localhost:8080/engine-rest`
4. Set the Deployment Name to match your process name
5. Click "Deploy"

Alternatively, you can use the file-based deployment method by saving your BPMN files and using the script with the `-CopyToDeployment` option to copy them directly to Camunda's deployment folder.
