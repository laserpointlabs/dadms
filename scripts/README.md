# DADM Helper Scripts

This directory contains utility scripts for various tasks related to the DADM project.

## Available Scripts

### 1. BPMN Deployment Script (`deploy_bpmn.py`)

Deploys BPMN models from the `camunda_models` directory to a Camunda server.

**Usage:**
```bash
python deploy_bpmn.py -m model_name -s http://localhost:8080  # Deploy a single model
python deploy_bpmn.py -a -s http://localhost:8080             # Deploy all models
```

See [bpmn_deployment.md](../docs/bpmn_deployment.md) for more details.

### 2. BPMN TTL Fixer (`fix_bpmn_ttl.py`)

Adds the required `historyTimeToLive` attribute to BPMN models.

**Usage:**
```bash
python fix_bpmn_ttl.py  # Fix all BPMN models in the camunda_models directory
```

See [bpmn_ttl_fix.md](../docs/bpmn_ttl_fix.md) for more details.

### 3. Unified Assistant ID Manager (`sync_assistant_id_unified.py`)

Comprehensive tool for managing OpenAI assistant IDs across all components.

**Usage:**
```bash
python scripts/sync_assistant_id_unified.py            # Sync assistant IDs
python scripts/sync_assistant_id_unified.py --force    # Force update from OpenAI
python scripts/sync_assistant_id_unified.py --repair   # Attempt to repair invalid IDs
python scripts/sync_assistant_id_unified.py --check-only # Only check without making changes
```

This unified script handles verification, synchronization, and repair of assistant IDs across all components.

### 4. OpenAI Decision Process Test (`test_openai_decision_process.py`)

Comprehensive test script for running and monitoring the OpenAI Decision Process BPMN workflow.

**Usage:**
```bash
python scripts/test_openai_decision_process.py
```

This script will deploy the BPMN process definition (if needed), start a process instance with test input, monitor execution using the enhanced orchestrator, collect performance metrics and task outputs, and generate a detailed execution report.

### 5. RAG File Testing (`test_rag_files.py`)

Test script for verifying RAG file management functionality.

**Usage:**
```bash
python scripts/test_rag_files.py
```

### 6. Process Execution Monitor (`monitor_process_execution.py`)

### 7. Environment Cleanup (`cleanup_environment.py`)

Quickly wipe Docker containers, volumes and reset databases.

**Usage:**
```bash
python scripts/cleanup_environment.py
```

## Running the Scripts

All scripts should be run from the project root directory:

```bash
python scripts/deploy_bpmn.py -a -s http://localhost:8080
```

Or you can change to the scripts directory first:

```bash
cd scripts
python deploy_bpmn.py -a -s http://localhost:8080
```
