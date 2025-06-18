# DADM - Decision Analysis and Decision Management

DADM is an integrated platform that combines Business Process Management (BPM), Artificial Intelligence, and Graph Database technologies to provide robust decision analysis and decision management capabilities.

## Overview

DADM (Decision Analysis and Decision Management) provides an end-to-end solution for modeling, executing, and analyzing decision processes. By leveraging Camunda for process execution, OpenAI for AI-assisted decision making, and Neo4j for knowledge graph relationships, DADM enables sophisticated deciThe system will be available at:
- **React UI**: http://localhost:3000
- **Process Management**: http://localhost:3000/processes
- **Backend API**: http://localhost:8000  
- **Camunda**: http://localhost:8080/camunda
- **System Management**: http://localhost:3000 (navigate to System Management tab)workflows.

### Key Features

- **BPMN-Driven Workflows**: Create and deploy decision process models using the industry-standard BPMN notation
- **AI-Augmented Decision Support**: Leverage OpenAI's capabilities to analyze complex decision scenarios with conversation persistence across process tasks
- **Process Management Dashboard**: Comprehensive web-based interface for managing Camunda process instances, viewing active and completed processes, starting new instances, and terminating running processes
- **Thread Context Viewer**: Real-time viewer for OpenAI Assistant conversations, displaying full thread history with message ordering and markdown support
- **Thread Persistence Management**: Maintain conversation continuity within business processes for coherent multi-step decision analysis
- **Knowledge Graph Integration**: Store and query relationships between decision factors using Neo4j with enhanced hierarchical structures and descriptive relationship names
- **Vector Database Support**: Semantic search and retrieval using Qdrant vector database
- **Live System Dashboard**: Real-time monitoring and control of all system components with web-based interface
- **Analysis Data Visualization**: Interactive viewer for analysis results with process definition integration
- **Service Management**: Start/stop/restart controls for backend services and analysis daemon via PM2 with both web UI and terminal options
- **High-Performance Orchestration**: Optimized service orchestration with caching and prefetching capabilities
- **Containerized Deployment**: Simple deployment with Docker and docker-compose
- **Extensible Architecture**: Modular design allows for easy integration with additional tools and services

## Recent Changes

- **June 18, 2025**: Version 0.11.0 Release - Enhanced DADM Dashboard with comprehensive system monitoring and control capabilities. Added **Thread Context Viewer** for real-time OpenAI conversation analysis, live analysis data viewer with process definition integration, and robust Camunda API integration. Implemented start/stop/restart controls for backend services and analysis daemon via PM2. Fixed "Unknown Process" display issue by adding proper process definition lookup from Camunda history API. Added standalone `manage-backend.sh` script for server management when UI is unavailable. **NEW**: Added comprehensive **Process Management Dashboard** with full CRUD operations for Camunda process instances - view all active and completed processes, start new instances with custom variables, and terminate running processes directly from the web interface.
- **June 11, 2025**: Version 0.9.0 Release - Major thread persistence implementation enabling conversation continuity across business process tasks, OpenAI Playground URL generation for debugging, and enhanced development workflow with live code mounting. Added comprehensive analysis data management commands and improved Camunda startup reliability.
- **June 11, 2025**: Thread Persistence Implementation - Implemented sophisticated thread management for OpenAI Assistant conversations, enabling context preservation across multiple tasks within the same business process. Process instances now maintain dedicated conversation threads for coherent multi-step decision analysis. Added live code mounting in Docker development environment for faster iteration.
- **June 5, 2025**: PostgreSQL Database Migration - Successfully migrated from H2 to PostgreSQL database for Camunda, resolving VARCHAR(4000) limitations and improving scalability. Updated Docker configurations with proper authentication methods and enhanced container reliability. All 48 Camunda tables now running on PostgreSQL with improved performance and data handling capabilities.
- **May 29, 2025**: Enhanced JSON recommendation expansion - Significantly improved the data persistence layer with dynamic relationship naming and hierarchical node structures in Neo4j. The system now creates meaningful graph relationships using JSON keys as descriptive names (e.g., "ANALYSIS", "STAKEHOLDERS", "KEY_SPECIFICATIONS"), enabling better decision traceability and more intuitive graph queries. See [release_notes_v0.7.0.md](release_notes_v0.7.0.md) for complete details.
- **May 28, 2025**: Service monitoring and reliability improvements - Added comprehensive service monitoring system with automatic recovery capabilities, standardized health endpoints across all services, and enhanced Docker configurations. See [release_notes_v0.6.0.md](release_notes_v0.6.0.md) for complete details.
- **May 17, 2025**: Codebase cleanup and restructuring - Reorganized helper scripts, created proper Python package structure, and added comprehensive installation verification scripts. Added automated setup scripts for Windows and Linux/macOS environments.
- **May 16, 2025**: OpenAI Assistant integration - Added robust OpenAI Assistant integration with file upload capabilities and implemented the UAS selection decision process workflow. Created diagnostic tools for checking OpenAI API integration.
- **May 15, 2025**: Process management enhancements - Added ability to start a process by name via command line, implemented argument parsing, and added support for passing initial variables to started processes. Added flexible timeout configuration and monitor-only mode.

## Architecture

DADM combines several key technologies into a cohesive platform:

- **Camunda Platform**: Provides the BPM engine for process orchestration with PostgreSQL backend
- **PostgreSQL**: Robust database engine for workflow persistence and scalability
- **OpenAI**: Powers the AI-assisted decision analysis
- **Neo4j**: Graph database for knowledge representation
- **Qdrant**: Vector database for semantic search
- **Python Application**: Core application logic and service integrations

## Database Infrastructure

### PostgreSQL Migration (June 2025)
DADM has been migrated from H2 to PostgreSQL for enhanced performance and scalability:

#### Benefits:
- **No VARCHAR(4000) Limitations**: Handle large process definitions and complex data
- **Production-Ready**: ACID compliance and robust transaction handling
- **Scalability**: Support for concurrent users and large datasets
- **Performance**: Optimized indexing and query execution
- **Reliability**: Enhanced backup, recovery, and monitoring capabilities

#### Technical Details:
- **Database**: PostgreSQL 15
- **Tables**: 48 Camunda tables successfully migrated
- **Authentication**: Trust/MD5 hybrid configuration
- **Data Types**: Enhanced support (e.g., `bytea` for large binary data)

### Verification Steps

After installation, verify that the PostgreSQL migration was successful:

1. **Check Database Tables**: Verify all 48 Camunda tables are created in PostgreSQL:
   ```powershell
   docker exec dadm-postgres psql -U camunda -d camunda -c "\dt"
   ```

2. **Verify Process Data**: Check that process instances are stored correctly:
   ```powershell
   docker exec dadm-postgres psql -U camunda -d camunda -c "SELECT COUNT(*) FROM act_hi_procinst;"
   ```

3. **Test Camunda Interface**: Access the Camunda web interface at http://localhost:8080/camunda

4. **Check Container Health**: Ensure all services are running properly:
   ```powershell
   docker ps
   ```

5. **Monitor Logs**: Check for any database connection errors:
   ```powershell
   docker logs dadm-camunda
   ```

## Installation

### Prerequisites

- Docker and docker-compose
- Python 3.10 or higher
- Git
- PostgreSQL 15 (automatically deployed via Docker)

### Quick Setup

For a quick setup with an automated script:

Run the setup script:

```bash
# Make the script executable
chmod +x setup.sh

# Run the script
./setup.sh
```

### Manual Setup

If you prefer to set up manually:

1. Clone the repository:
   ```bash
   git clone https://gitlab.mgmt.internal/jdehart/dadm.git
   cd dadm
   ```

2. Create a virtual environment:
   ```bash
   # Using venv
   python -m venv .venv
   source .venv/bin/activate  # On Windows use .\.venv\Scripts\activate

   # Using conda
   conda create -n dadm python=3.10
   conda activate dadm
   ```

3. Install dependencies and the package in development mode:
   ```powershell
   pip install -r requirements.txt
   pip install -e .
   ```

4. Start the Docker services:
   ```powershell
   docker-compose -f docker/docker-compose.yml up -d
   ```

5. Verify your installation:
   ```bash
   python scripts/verify_environment.py
   ```

## Usage

### Running the Application

After installation, you can use the following commands:

```powershell
# Run the main application with default settings
dadm

# Start a specific BPMN process
dadm --start-process "DADM Demo Process"

# Start a process with variables
dadm -s "DADM Demo Process" -v '{"variable1":"value1"}'

# Monitor mode (only watch for tasks without starting a process)
dadm -m

# List available process definitions
dadm -l
```

### Working with BPMN Models

DADM provides helper scripts for working with BPMN models:

```powershell
# Deploy all BPMN models to Camunda
dadm-deploy-bpmn -a -s http://localhost:8080

# Deploy a specific model
dadm-deploy-bpmn -m model_name -s http://localhost:8080

# Fix BPMN models by adding historyTimeToLive attribute
dadm-fix-bpmn-ttl
```

### OpenAI Integration

DADM integrates with OpenAI's API to provide AI-assisted decision analysis. To use this feature:

1. Set your OpenAI API key in the configuration:
   ```python
   # config/openai_config.py
   OPENAI_API_KEY = "your-api-key-here"
   ```

2. Run the application with OpenAI support enabled:
   ```powershell
   dadm --start-process "DADM Demo Process"
   ```

The OpenAI integration will analyze inputs, provide recommendations, and help with decision documentation throughout the workflow.

## Tools and Utilities

DADM provides several tools and utilities to help with development, deployment, and monitoring.

### BPMN Deployment

To deploy BPMN models to the Camunda engine:

```bash
python -m scripts.deploy_bpmn -m your_model.bpmn
```

To deploy all models in the `camunda_models` directory:

```bash
python -m scripts.deploy_bpmn --all
```

### Process Execution Monitoring

The process execution monitor helps track BPMN process execution and troubleshoot issues:

```bash
python -m scripts.monitor_process_execution -p <process-instance-id> -i 3
```

Options:
- `-p, --process-instance`: Process instance ID to monitor (optional)
- `-i, --interval`: Polling interval in seconds (default: 5)
- `-c, --count`: Number of poll iterations (0 for continuous)
- `-v, --verbose`: Show detailed information

## Services

The DADM system provides the following services:

1. **OpenAI Assistant Service**: Main service for decision analysis using OpenAI's Assistant API
2. **Echo Test Service**: A simple test service for demonstrating service integration
3. **Service Monitor**: Background process to ensure services stay available

For more information on creating and integrating services, see [Implementing Services](docs/IMPLEMENTING_SERVICES.md).

## Starting Services

Before running DADM, you should ensure all services are running:

```bash
python scripts/start_services.py
```

To check the status of all services:

```bash
python scripts/check_service_status.py
```

For a complete tutorial on using the Echo Test Service, see [Echo Service Tutorial](docs/ECHO_SERVICE_TUTORIAL.md).

## Process Management

The DADM Process Management dashboard provides comprehensive control over Camunda process instances through an intuitive web interface. This feature bridges the gap between the powerful Camunda engine and user-friendly process administration.

### Features

**Process Instance Overview:**
- View all process instances (active and completed) in a unified table
- Real-time status indicators with color-coded chips (Active, Completed, Terminated)
- Process duration calculations and business key display
- Sortable and searchable process list with pagination

**Process Definitions Management:**
- Browse all available process definitions with version information
- Quick-start functionality for launching new process instances
- Visual cards showing process metadata and deployment details

**Process Instance Control:**
- **Start New Processes**: Launch process instances from any available definition with custom variables
- **Terminate Active Processes**: Safely stop running processes with reason tracking
- **Process Details**: View comprehensive information about individual instances

**Summary Dashboard:**
- Live counters for active processes, total instances, and available definitions
- Visual indicators for system health and process activity

### Using the Process Management Dashboard

1. **Access the Dashboard**: Navigate to the "Process Management" tab in the DADM UI (http://localhost:3000/processes)

2. **View Process Status**: The main table shows all process instances with:
   - Instance ID (shortened for readability)
   - Process name and version
   - Current status (Active/Completed/Terminated)
   - Start time and duration
   - Business key (if applicable)

3. **Start a New Process**:
   - Browse available process definitions in the top section
   - Click "Start Process" on any definition card
   - Optionally provide initial variables in JSON format
   - The new instance will appear in the main table

4. **Terminate Running Processes**:
   - Find the active process in the main table
   - Click the "Stop" icon in the Actions column
   - Confirm termination in the dialog
   - The process will be safely terminated and marked as such

5. **Monitor System Activity**:
   - Check the summary cards for quick system overview
   - Use the refresh button to update all data
   - Monitor process durations and completion rates

### Backend API Integration

The Process Management UI integrates with dedicated REST endpoints:

- `GET /api/process/instances` - Retrieve all process instances
- `GET /api/process/definitions/list` - Get available process definitions
- `POST /api/process/instances/start` - Start new process instances
- `DELETE /api/process/instances/:id` - Terminate active processes
- `GET /api/process/instances/:id` - Get detailed process information

These endpoints provide robust error handling, input validation, and comprehensive status reporting for reliable process management operations.

## Server Management

DADM provides multiple ways to manage the backend API server and analysis daemon for robust system operation. The system includes both a web-based dashboard and a standalone terminal script (`ui/manage-backend.sh`) for comprehensive server management.

### Web-Based Management (Recommended)

The DADM Dashboard provides a comprehensive System Management interface with real-time monitoring and control:

1. **Access the Dashboard**: http://localhost:3000 (after starting the React UI)
2. **Navigate to System Management**: View real-time status of all services
3. **Use Control Buttons**: Start, stop, and restart services directly from the web interface

**Features:**
- Real-time service status monitoring
- PM2 process information (memory usage, uptime, etc.)
- Docker container status
- One-click start/stop/restart controls
- Live log viewing

### Command-Line Management

When the backend is down or for terminal-based workflows, use the standalone `manage-backend.sh` script:

```bash
# Navigate to the UI directory
cd ui/

# Start both backend API server and analysis daemon
./manage-backend.sh start

# Check status of all services
./manage-backend.sh status

# Stop all services
./manage-backend.sh stop

# Restart all services
./manage-backend.sh restart

# View backend logs
./manage-backend.sh logs

# Open PM2 monitoring dashboard
./manage-backend.sh monitor

# Show help with all available commands
./manage-backend.sh help
```

**The `manage-backend.sh` script provides:**
- **Robust error handling**: Checks for PM2 availability and service states
- **Colored output**: Clear visual feedback for operations
- **Comprehensive status**: Shows both PM2 process info and health checks
- **Safe operations**: Prevents duplicate starts and graceful shutdowns
- **Service dependencies**: Automatically manages both backend and daemon together
- **Health verification**: Tests actual API endpoints after start operations
- **Log aggregation**: Views logs from both services simultaneously

**Script features:**
- Works independently of the web UI
- No dependency on the React application being running
- Provides detailed error messages and troubleshooting hints
- Supports both individual service management and bulk operations
- Integrates with PM2 for process management and monitoring

### The `manage-backend.sh` Script

The standalone `manage-backend.sh` script is a comprehensive backend management tool designed to work independently of the web UI. This script is particularly useful when:

- The React UI is not running or is experiencing issues
- You prefer terminal-based server management
- You need to manage services in automated scripts or CI/CD pipelines
- The backend is completely down and the web interface is inaccessible

**Key capabilities:**

```bash
# Script location: ui/manage-backend.sh

# Available commands:
./manage-backend.sh start     # Start both backend and analysis daemon
./manage-backend.sh stop      # Stop all services gracefully
./manage-backend.sh restart   # Restart services (stop + start)
./manage-backend.sh status    # Show detailed service status
./manage-backend.sh logs      # View logs from both services
./manage-backend.sh monitor   # Open PM2 monitoring interface
./manage-backend.sh help      # Show all available commands
```

**Advanced features:**

- **Health verification**: After starting services, the script tests actual API endpoints to ensure they're responding correctly
- **Dependency management**: Automatically handles the relationship between the backend API server and analysis daemon
- **Error recovery**: Provides specific troubleshooting steps when operations fail
- **Process safety**: Prevents duplicate service starts and ensures clean shutdowns
- **Status aggregation**: Combines PM2 process information with service health checks
- **Colored output**: Uses colors to clearly indicate success, warnings, and errors

**Example output:**

```bash
$ ./manage-backend.sh status
🔍 Checking PM2 status...
┌─────────────────────┬──────┬─────────────┬──────────┬─────────┬──────────┐
│ App name           │ id   │ mode        │ pid      │ status  │ restart  │
├─────────────────────┼──────┼─────────────┼──────────┼─────────┼──────────┤
│ dadm-backend       │ 0    │ fork        │ 1234     │ online  │ 0        │
│ dadm-analysis-...  │ 1    │ fork        │ 5678     │ online  │ 0        │
└─────────────────────┴──────┴─────────────┴──────────┴─────────┴──────────┘

✅ Backend API Server: Running (Health check passed)
✅ Analysis Daemon: Running

🚀 All services are operational!
```

### NPM Scripts

Alternative commands using npm (from the `ui/` directory):

```bash
# Start services using PM2
npm run backend:start

# Check service status
npm run backend:status

# Stop backend API server
npm run backend:stop

# Restart backend API server
npm run backend:restart

# View backend logs
npm run backend:logs

# Open PM2 monitoring interface
npm run backend:monitor
```

### Service Architecture

DADM runs two main backend services:

1. **`dadm-backend`**: Node.js API server (port 8000)
   - Serves REST endpoints for the React UI
   - Handles Thread Context Viewer data
   - Manages system status and controls
   - Automatically starts the analysis daemon

2. **`dadm-analysis-daemon`**: Python analysis processor
   - Processes BPMN workflow tasks
   - Handles OpenAI Assistant interactions
   - Manages decision analysis workflows
   - Persists analysis data

### Troubleshooting Server Issues

**When the UI buttons don't work:**
1. The backend is likely down
2. Use the standalone script: `cd ui && ./manage-backend.sh start`
3. Check service health: `./manage-backend.sh status`
4. Refresh the System Management page in the UI

**Common Issues:**

- **Port 8000 in use**: 
  ```bash
  # Stop existing processes
  ./manage-backend.sh stop
  # Or check what's using the port
  lsof -i :8000
  ```

- **PM2 not found**: 
  ```bash
  # Install PM2 globally
  npm install -g pm2
  # Verify installation
  pm2 --version
  ```

- **Permission errors**: 
  ```bash
  # Make script executable
  chmod +x ui/manage-backend.sh
  ```

- **Services fail to start**:
  ```bash
  # Check detailed logs
  ./manage-backend.sh logs
  # View PM2 error logs
  pm2 logs --err
  ```

**Diagnostic Commands:**

```bash
# Quick health check
curl http://localhost:8000/api/health

# Detailed system status
curl http://localhost:8000/api/system/status

# View PM2 status
pm2 status

# Check if ports are in use
netstat -tulpn | grep :8000

# View comprehensive service status
cd ui && ./manage-backend.sh status
```

### Starting the Complete System

To start the entire DADM system in the correct order:

```bash
# 1. Start Docker services (PostgreSQL, Camunda, Neo4j, etc.)
docker-compose -f docker/docker-compose.yml up -d

# 2. Wait for services to be ready (optional but recommended)
sleep 30

# 3. Start backend services using the management script
cd ui && ./manage-backend.sh start

# 4. Verify backend services are running
./manage-backend.sh status

# 5. Start the React UI (in a new terminal)
cd ui && npm start
```

**Alternative startup using npm scripts:**
```bash
# Steps 1 and 2 same as above
docker-compose -f docker/docker-compose.yml up -d

# Start backend with npm
cd ui && npm run backend:start

# Start React UI
npm start
```

**The system will be available at:**
- **React UI**: http://localhost:3000
- **Backend API**: http://localhost:8000  
- **Camunda**: http://localhost:8080/camunda
- **System Management**: http://localhost:3000 (navigate to System Management tab)

**Verification steps:**
```bash
# Check Docker containers
docker ps

# Check backend services
cd ui && ./manage-backend.sh status

# Test API health
curl http://localhost:8000/api/health

# Test system status
curl http://localhost:8000/api/system/status
```

### Server Management Summary

DADM provides **three complementary approaches** to server management:

1. **Web Dashboard** (Recommended): Full-featured UI with real-time monitoring, one-click controls, and live log viewing
2. **Standalone Script** (`manage-backend.sh`): Terminal-based management independent of the web UI, perfect for troubleshooting and automation
3. **NPM Scripts**: Traditional npm commands for developers familiar with Node.js workflows

**When to use each approach:**
- **Web Dashboard**: Day-to-day operations, monitoring, and when you want visual feedback
- **Standalone Script**: When the UI is down, for automated scripts, or when you prefer terminal workflows
- **NPM Scripts**: For development workflows and integration with Node.js build processes

All approaches use PM2 for robust process management and provide health verification to ensure services are truly operational.

## Log Files

DADM organizes log files in a dedicated `logs` directory with the following structure:

- `logs/services/` - Logs from service components (OpenAI service, Echo service, etc.)
- `logs/monitors/` - Logs from monitoring scripts (service monitor, assistant monitor, etc.)
- `logs/processes/` - Logs from process execution and workflow activities

To clean up existing log files in the top-level directory:

```bash
# On Windows
scripts\cleanup_logs.bat

# On Linux/macOS
./scripts/cleanup_logs.sh
```

The log directory structure is created automatically when needed by scripts, but you can also create it manually:

```bash
python scripts/setup_logs_directory.py
```

## Project Structure

```
├── camunda_models/    # BPMN process models
├── config/            # Configuration files
├── data/              # Sample data and templates
├── docs/              # Documentation
├── scripts/           # Helper scripts for deployment and maintenance
├── src/               # Main application source code
└── tests/             # Test files
```

### Key Components

- **src/app.py**: Main application entry point
- **src/openai_assistant.py**: OpenAI integration
- **scripts/deploy_bpmn.py**: BPMN deployment utility
- **scripts/fix_bpmn_ttl.py**: BPMN model fixer
- **docker-compose.yaml**: Container definitions for services
- **config/*.py**: Configuration for various services
- **setup.py**: Package installation configuration

## Documentation

Detailed documentation is available in the `docs/` directory:
- [Documentation Index](docs/index.md) - List of all available guides.

- [BPMN Validation & Deployment](docs/BPMN_VALIDATION_DEPLOYMENT.md)
- [BPMN TTL Fix](docs/bpmn_ttl_fix.md)
- [Camunda Docker Configuration](docs/camunda_docker_fix.md)
- [OpenAI Integration](docs/openai_integration.md)
- [Service Architecture](docs/service_architecture.md)
- [System Specification](docs/specification.md)

For details on the available scripts, see the [scripts documentation](scripts/README.md).

## Development

### Running Tests

```powershell
# Run all tests
python -m unittest discover -s tests

# Run a specific test file
python -m unittest tests/test_app.py
```

### Adding New Features

1. Create a feature branch:
   ```powershell
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and add tests

3. Run tests to verify your changes:
   ```powershell
   python -m unittest discover -s tests
   ```

4. Submit a merge request

## Installation Verification

After installation, you can verify that everything is set up correctly:

### Environment Verification

```bash
python scripts/verify_environment.py
```

The verification script checks:
1. Python version
2. Core packages installation
3. Dependency packages installation
4. Critical files existence
5. Provides a summary and usage instructions

## License

This project is proprietary and confidential.

## Acknowledgements

- [Camunda Platform](https://camunda.com/)
- [OpenAI](https://openai.com/)
- [Neo4j](https://neo4j.com/)
- [Qdrant](https://qdrant.tech/)

## Support

For support with DADM, please contact the project maintainer or submit issues via the organizational GitLab repository.

## Contributing

This project follows a standard GitLab workflow:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests
5. Submit a merge request

Please ensure your code follows the project's coding standards and passes all tests.

## Authors

- John DeHart - Project Lead and Main Developer

## Project Status

Active development - May 2025

# DADM - Decision Analysis with BPMN, OpenAI, and Neo4j

A flexible framework for integrating BPMN process models with OpenAI and knowledge graphs for decision analysis and automation.

## Command Line Interface

DADM provides a command-line interface that allows you to:

### Process Management
- Start BPMN processes
- Monitor tasks
- List all available processes

### Model Deployment
- Deploy BPMN models to Camunda server
- List available models
- Deploy specific or all models

### Docker Management
- Control Docker containers via the `docker` command
- Start services with `dadm docker up`
- Stop services with `dadm docker down`
- Pass any Docker Compose arguments directly

For more information on specific commands:
- Docker commands: See `docs/docker_command.md`
- Deployment commands: See `docs/deploy_command.md`

## Examples

```bash
# Start a process
dadm --start-process "Decision Analysis Process"

# Deploy a BPMN model
dadm deploy model my_process

# List available BPMN models
dadm deploy list

# Start docker containers
dadm docker up -d

# Stop docker containers
dadm docker down

# Analysis data management
dadm analysis daemon              # Start background analysis processing
dadm analysis status              # Show analysis system status
dadm analysis list --limit 5      # List recent analysis runs
dadm analysis list --detailed     # Show detailed analysis information
dadm analysis list --process-id <id>  # Filter by process instance
dadm analysis list --service <name>   # Filter by service name
dadm analysis list --tags <tag1> <tag2>  # Filter by tags
dadm analysis list --process-id <id> --get-openai-url  # Get OpenAI Playground URL
dadm analysis process --once      # Process pending tasks once
```

For complete documentation, see the `docs` folder.
