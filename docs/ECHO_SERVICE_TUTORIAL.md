# Echo Test Service Tutorial

This tutorial walks you through deploying and testing the Echo Test Service with DADM.

## Overview

The Echo Test Service provides a simple example service that echoes back input data with additional metadata. This tutorial shows how to:

1. Deploy the Echo Test Service
2. Deploy the Echo Test Process BPMN model
3. Run the process and verify it works

## Prerequisites

- DADM environment set up and functioning
- Docker and Docker Compose installed (for containerized deployment)
- Camunda Modeler for deploying BPMN models

## Step 1: Start the Services

First, let's make sure all necessary services are running. We've created a script to help with this:

```bash
python scripts/start_services.py
```

This script will:
- Check which services are running and which need to be started
- Attempt to start any services that aren't running
- Verify that services are healthy after starting

If you want to start only specific services, you can specify them:

```bash
python scripts/start_services.py --services test/echo assistant/openai
```

## Step 2: Verify Service Status

Let's verify that both our Echo service and OpenAI service are running properly:

```bash
python scripts/check_service_status.py
```

You should see output indicating that both services are healthy:
```
✓ test/echo:
  Endpoint: http://localhost:5100
  Status: healthy
  Response Time: 5ms

✓ assistant/openai:
  Endpoint: http://localhost:5000
  Status: healthy
  Response Time: 12ms
```

If either service shows as unhealthy or unreachable, see the [Service Troubleshooting Guide](SERVICE_TROUBLESHOOTING.md).

## Step 3: Deploy the Echo Test Process BPMN Model

Before deploying, it's a good idea to validate the BPMN model:

```bash
# Validate the BPMN model
python scripts/validate_bpmn.py --model camunda_models/echo_test_process.bpmn
```

If any issues are found, you can fix them automatically:

```bash
# Fix common issues in the BPMN model
python scripts/fix_bpmn.py --model camunda_models/echo_test_process.bpmn
```

Or use the combined validation, fixing, and deployment script:

```bash
# On Windows
scripts\check_and_deploy_bpmn.bat --model echo_test_process

# On Linux/macOS
./scripts/check_and_deploy_bpmn.sh --model echo_test_process
```

Alternatively, you can deploy manually:

1. Open Camunda Modeler
2. Open the file `camunda_models/echo_test_process.bpmn`
3. Click the "Deploy" button
4. Enter the REST endpoint of your Camunda engine (e.g., `http://localhost:8080/engine-rest`)
5. Deploy the model

The BPMN model includes:
- A start event
- An Echo Task service task that uses the Echo Test Service
- An OpenAI Task service task that uses the OpenAI Service
- An end event

## Step 4: Run the Test Process

Now, let's run the test process to verify everything works properly:

```bash
python src/app.py --start-process "Echo Test Process"
```

This will start an instance of the Echo Test Process and the service orchestrator will:
1. Execute the Echo Task using the Echo Test Service
2. Execute the OpenAI Task using the OpenAI Assistant Service
3. Complete the process

You can see detailed logs of what's happening in the terminal.

## Step 5: Check Process Results

After the process completes, you can check the results in Camunda:

1. Open Camunda Cockpit (http://localhost:8080/camunda/app/cockpit/)
2. Navigate to "Process Instances"
3. Find the completed instance of "Echo Test Process"
4. Check the process variables to see the outputs of both the Echo Task and OpenAI Task

## Step 6: Modify and Extend

Now that you've successfully tested the Echo Test Process, you can:

1. Modify the Echo Test Service to add new functionality
2. Create your own services following the same pattern
3. Create more complex BPMN processes that use multiple services

## Troubleshooting

If you encounter any issues:

1. Check the service logs:
   ```bash
   docker logs echo-service
   docker logs openai-service
   ```

2. Check the service status:
   ```bash
   python scripts/check_service_status.py
   ```

3. Try rebuilding the services:
   ```bash
   bash scripts/rebuild_echo_service.sh
   ```

4. Refer to the [Service Troubleshooting Guide](SERVICE_TROUBLESHOOTING.md) for common issues and solutions.

## Conclusion

You've successfully deployed and tested the Echo Test Service alongside the OpenAI Service. This demonstrates how DADM can be extended with additional services following a standardized pattern.

For more information on creating your own services, see [Implementing Services](IMPLEMENTING_SERVICES.md).