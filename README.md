# DADM - Decision Analysis and Decision Management

DADM is an integrated platform that combines Business Process Management (BPM), Artificial Intelligence, and Graph Database technologies to provide robust decision analysis and decision management capabilities.

## Overview

DADM (Decision Analysis and Decision Management) provides an end-to-end solution for modeling, executing, and analyzing decision processes. By leveraging Camunda for process execution, OpenAI for AI-assisted decision making, and Neo4j for knowledge graph relationships, DADM enables sophisticated decision workflows.

### Key Features

- **BPMN-Driven Workflows**: Create and deploy decision process models using the industry-standard BPMN notation
- **AI-Augmented Decision Support**: Leverage OpenAI's capabilities to analyze complex decision scenarios with conversation persistence across process tasks
- **Thread Persistence Management**: Maintain conversation continuity within business processes for coherent multi-step decision analysis
- **Knowledge Graph Integration**: Store and query relationships between decision factors using Neo4j with enhanced hierarchical structures and descriptive relationship names
- **Vector Database Support**: Semantic search and retrieval using Qdrant vector database
- **High-Performance Orchestration**: Optimized service orchestration with caching and prefetching capabilities
- **Containerized Deployment**: Simple deployment with Docker and docker-compose
- **Extensible Architecture**: Modular design allows for easy integration with additional tools and services

## Recent Changes

- **June 16, 2025**: Version 0.10.0 Release - DADM Prompt Service with comprehensive RAG integration. Features FastAPI-based prompt template management with support for .md, .txt, and .csv files from both local and remote sources (GitHub, web URLs). Includes intelligent content processing, caching, variable injection, and Docker integration. Consul service discovery enabled for seamless stack integration.
- **June 11, 2025**: Version 0.9.0 Release - Major thread persistence implementation enabling conversation continuity across business process tasks, OpenAI Playground URL generation for debugging, and enhanced development workflow with live code mounting. Added comprehensive analysis data management commands and improved Camunda startup reliability.
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
