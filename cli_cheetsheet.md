# DADM CLI Cheat Sheet

## Quick Reference for DADM Command Line Tools

This document provides a comprehensive reference for all DADM command-line tools and their usage.

---

## 📋 Table of Contents

1. [Main DADM Application (`dadm`)](#main-dadm-application-dadm)
2. [Analysis CLI Tool (`analysis_cli.py`)](#analysis-cli-tool-analysis_clipy)
3. [Standalone Scripts](#standalone-scripts)
4. [Docker Management](#docker-management)
5. [Common Workflows](#common-workflows)
6. [Environment Setup](#environment-setup)

---

## 🚀 Main DADM Application (`dadm`)

The primary entry point for DADM operations. Provides process management, deployment, and analysis data management.

### Basic Process Operations

```bash
# Start a specific process
dadm --start-process "Process Name" 
dadm -s "OpenAI Decision Tester"

# Start process with variables
dadm -s "Process Name" --variables '{"key": "value"}'
dadm -s "Process Name" -v '{"decision_topic": "investment"}'

# Monitor tasks without starting a process
dadm --monitor-only
dadm -m

# Set custom timeout (default: 600 seconds)
dadm -s "Process Name" --timeout 300
dadm -s "Process Name" -t 300

# List available processes on Camunda server
dadm --list
dadm -l
```

### Deploy Subcommand

Deploy BPMN models and services to Camunda and Consul.

```bash
# List available BPMN models
dadm deploy list

# Deploy a specific BPMN model
dadm deploy model my_process
dadm deploy model my_process.bpmn
dadm deploy model my_process -s http://camunda-server:8080

# Deploy all BPMN models
dadm deploy all
dadm deploy all -s http://camunda-server:8080

# Deploy services to Consul
dadm deploy services
dadm deploy services --consul-url http://consul-server:8500
dadm deploy services --list-only
dadm deploy services --no-browser
```

### Analysis Subcommand

Manage analysis data storage and background processing.

#### Analysis Daemon Management

```bash
# Start analysis daemon in foreground (blocks terminal)
dadm analysis daemon

# Start analysis daemon in background (releases terminal)
dadm analysis daemon --detach

# Start with custom settings
dadm analysis daemon --detach --interval 60 --batch-size 20
dadm analysis daemon --no-vector-store
dadm analysis daemon --no-graph-db
dadm analysis daemon --storage-dir ./my_analysis_data
dadm analysis daemon --log-file ./my_daemon.log

# Stop background daemon
dadm analysis stop

# Restart daemon with previous settings
dadm analysis restart

# Check daemon and system status
dadm analysis status
```

#### Analysis Data Management

```bash
# List recent analysis runs (default: 10)
dadm analysis list
dadm analysis list --limit 20

# Filter analyses by criteria
dadm analysis list --thread-id thread_abc123
dadm analysis list --session-id session_456
dadm analysis list --process-id proc_789
dadm analysis list --service openai_assistant
dadm analysis list --tags openai decision
dadm analysis list --detailed

# Generate OpenAI Playground URL
dadm analysis list --process-id proc_123 --get-openai-url

# Process pending analysis tasks manually
dadm analysis process --once
dadm analysis process --once --limit 5
dadm analysis process --once --processor-type vector_store
dadm analysis process --once --processor-type graph_db
```

### Docker Subcommand

Execute Docker Compose commands using the project's docker-compose.yml.

```bash
# Start all services
dadm docker up
dadm docker up -d
dadm docker up -d --build

# Stop all services
dadm docker down
dadm docker down -v

# View running containers
dadm docker ps

# View logs
dadm docker logs
dadm docker logs neo4j
dadm docker logs -f qdrant

# Restart services
dadm docker restart
```

---

## 🔍 Analysis CLI Tool (`analysis_cli.py`)

Standalone CLI for direct analysis data management and querying.

### Basic Usage

```bash
# Show help
python scripts/analysis_cli.py --help

# Use custom storage directory
python scripts/analysis_cli.py --storage-dir ./my_data <command>
```

### List and Search Operations

```bash
# List all analyses (default limit: 100)
python scripts/analysis_cli.py list

# Filter analyses
python scripts/analysis_cli.py list --thread-id thread_123
python scripts/analysis_cli.py list --session-id session_456
python scripts/analysis_cli.py list --task-name "Decision"
python scripts/analysis_cli.py list --tags openai decision
python scripts/analysis_cli.py list --status completed
python scripts/analysis_cli.py list --limit 50

# Show detailed analysis information
python scripts/analysis_cli.py show analysis_id_123
```

### Thread Operations

```bash
# Show thread conversation (default limit: 50)
python scripts/analysis_cli.py thread thread_abc123

# Show with details and custom limit
python scripts/analysis_cli.py thread thread_abc123 --limit 100 --verbose
```

### Processing Operations

```bash
# Process pending analyses
python scripts/analysis_cli.py process
python scripts/analysis_cli.py process --processor-type vector_store
python scripts/analysis_cli.py process --processor-type graph_db
python scripts/analysis_cli.py process --limit 20

# Reprocess specific analysis
python scripts/analysis_cli.py reprocess analysis_id_123
python scripts/analysis_cli.py reprocess analysis_id_123 --processors vector_store
python scripts/analysis_cli.py reprocess analysis_id_123 --processors vector_store graph_db
```

### Status and Export

```bash
# Show overall processing status
python scripts/analysis_cli.py status

# Show status for specific analysis
python scripts/analysis_cli.py status --analysis-id analysis_123

# Export analyses to JSON
python scripts/analysis_cli.py export output.json
python scripts/analysis_cli.py export filtered_data.json --thread-id thread_123
python scripts/analysis_cli.py export data.json --tags openai --limit 1000
```

---

## 🛠️ Standalone Scripts

### Assistant Management

```bash
# List all OpenAI assistants
python scripts/manage_assistant.py list

# Create new assistant
python scripts/manage_assistant.py create

# Update existing assistant
python scripts/manage_assistant.py update
python scripts/manage_assistant.py update --id asst_123

# Test assistant
python scripts/manage_assistant.py test
python scripts/manage_assistant.py test --id asst_123

# Save assistant ID
python scripts/manage_assistant.py save --id asst_123 --name "My Assistant"
```

### OpenAI Thread Operations

```bash
# Extract OpenAI thread information
python scripts/extract_openai_threads.py

# Interact with OpenAI thread
python scripts/interact_openai_thread.py --process-id proc_123 --message "Continue analysis"
python scripts/interact_openai_thread.py --assistant_id assistant_123 --thread-id thread_123 --message "Question"
```

### BPMN Deployment

```bash
# Deploy BPMN models (alternative to dadm deploy)
dadm-deploy-bpmn
dadm-deploy-bpmn --server http://camunda-server:8080

# Fix BPMN TTL issues
dadm-fix-bpmn-ttl
```

### Service Management

```bash
# Check service status
python scripts/check_service_status.py
python scripts/check_service_status.py --verbose
python scripts/check_service_status.py --service assistant/openai
python scripts/check_service_status.py --output status_report.json

# Start services
python scripts/start_services.py

# Monitor service health
python scripts/monitor_service_health.py

# Register database services
python scripts/register_db_services.py
```

### Data Management

```bash
# Check stored data
python scripts/check_stored_data.py

# Clear Neo4j database
python scripts/clear_neo4j.py

# Reset all databases
python scripts/reset_databases.py

# Query Neo4j data
python scripts/query_neo4j_data.py

# Rebuild vector store
python scripts/rebuild_vector_store.py
```

### Environment and Testing

```bash
# Verify environment setup
python scripts/verify_environment.py

# Verify system status
python scripts/verify_system_status.py

# Run comprehensive tests
python scripts/test_end_to_end.py

# Test orchestrator integration
python scripts/test_orchestrators.py

# Test OpenAI integration
python scripts/test_openai_decision_process.py
```

---

## 🐳 Docker Management

### Using DADM Docker Commands

```bash
# Start all services in background
dadm docker up -d

# Start with build
dadm docker up -d --build

# Stop all services
dadm docker down

# Stop and remove volumes
dadm docker down -v

# View running containers
dadm docker ps

# View all containers
dadm docker ps -a

# View service logs
dadm docker logs neo4j
dadm docker logs qdrant
dadm docker logs camunda

# Follow logs
dadm docker logs -f <service_name>

# Restart specific service
dadm docker restart neo4j
```

### Direct Docker Compose

```bash
# Navigate to docker directory first
cd docker

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs
docker-compose logs -f neo4j
```

---

## 🔄 Common Workflows

### 1. Complete DADM Workflow with Analysis

```bash
# Start analysis daemon in background
dadm analysis daemon --detach

# Verify daemon is running
dadm analysis status

# Run your DADM process (analysis captured automatically)
dadm -s "OpenAI Decision Tester"

# Review captured analysis data
dadm analysis list --limit 5 --detailed

# Generate OpenAI URL for continuing conversation
dadm analysis list --process-id <process_id> --get-openai-url

# Stop daemon when done
dadm analysis stop
```

### 2. Development and Testing Setup

```bash
# Start Docker services
dadm docker up -d

# Verify services are running
python scripts/verify_system_status.py

# Deploy BPMN models
dadm deploy all

# Run tests
python scripts/test_end_to_end.py

# Monitor service health
python scripts/monitor_service_health.py
```

### 3. Data Analysis and Export

```bash
# Start analysis daemon for background processing
dadm analysis daemon --detach

# List recent analyses
python scripts/analysis_cli.py list --limit 50

# Show thread conversations
python scripts/analysis_cli.py thread <thread_id> --verbose

# Export data for analysis
python scripts/analysis_cli.py export analysis_data.json --limit 1000

# Check processing status
python scripts/analysis_cli.py status
```

### 4. Service Management Workflow

```bash
# Check service status
python scripts/check_service_status.py --verbose

# Deploy services to Consul
dadm deploy services

# Start Docker services
dadm docker up -d

# Monitor health
python scripts/monitor_service_health.py

# Verify integration
python scripts/verify_system_status.py
```

---

## 🌍 Environment Setup

### Installation and Setup

```bash
# Install DADM package
pip install -e .

# Install with user flag
pip install -e . --user

# Setup environment (Linux/Mac)
./setup_codex.sh

# Verify installation
dadm --help
dadm-deploy-bpmn --help

# Check Python path includes DADM
python -c "import src; import scripts; import config; print('✅ All modules imported!')"
```

### Environment Variables

Key environment variables for DADM:

```bash
# OpenAI Configuration
export OPENAI_API_KEY="your-api-key"

# Camunda Configuration
export CAMUNDA_URL="http://localhost:8080"

# Database URLs
export NEO4J_URL="bolt://localhost:7687"
export QDRANT_URL="http://localhost:6333"

# Service Discovery
export CONSUL_URL="http://localhost:8500"
```

### Configuration Files

Important configuration files:

- `config/openai_config.py` - OpenAI API settings
- `config/camunda_config.py` - Camunda server settings
- `config/service_registry.py` - Service discovery configuration
- `config/analysis_config.py` - Analysis data management settings

---

## 📚 Quick Reference Tables

### Main Command Summary

| Command | Purpose | Example |
|---------|---------|---------|
| `dadm -s "Process Name"` | Start process | `dadm -s "OpenAI Decision Tester"` |
| `dadm analysis daemon --detach` | Start analysis daemon | Background processing |
| `dadm analysis list` | List analyses | `dadm analysis list --limit 10` |
| `dadm deploy all` | Deploy BPMN models | Deploy to Camunda |
| `dadm docker up -d` | Start Docker services | Background startup |

### Analysis CLI Summary

| Command | Purpose | Example |
|---------|---------|---------|
| `python scripts/analysis_cli.py list` | List analyses | Direct DB query |
| `python scripts/analysis_cli.py thread <id>` | Show thread | Conversation view |
| `python scripts/analysis_cli.py export <file>` | Export data | JSON export |
| `python scripts/analysis_cli.py status` | Show status | Processing status |

### Key Scripts Summary

| Script | Purpose | Usage |
|--------|---------|-------|
| `manage_assistant.py` | OpenAI assistant management | `python scripts/manage_assistant.py list` |
| `extract_openai_threads.py` | Thread extraction | `python scripts/extract_openai_threads.py` |
| `check_service_status.py` | Service health check | `python scripts/check_service_status.py` |
| `verify_system_status.py` | Full system check | `python scripts/verify_system_status.py` |

---

## 🆘 Troubleshooting

### Common Issues

1. **Command not found**: Ensure DADM is installed and in PATH
   ```bash
   pip install -e . --user
   export PATH=$PATH:$HOME/.local/bin
   ```

2. **Analysis daemon won't start**: Check Docker services
   ```bash
   dadm docker ps
   dadm analysis status
   ```

3. **No analysis data**: Verify daemon is running and configured
   ```bash
   dadm analysis status
   dadm analysis daemon --detach
   ```

4. **OpenAI integration issues**: Check API key and assistant setup
   ```bash
   python scripts/manage_assistant.py test
   ```

### Getting Help

- Use `--help` with any command for detailed usage
- Check `docs/` directory for comprehensive documentation
- Review `README.md` for setup instructions
- Check logs in `logs/` directory for troubleshooting

---

*This cheat sheet covers DADM v0.9.0. For the latest updates, check the project documentation and changelog.*
