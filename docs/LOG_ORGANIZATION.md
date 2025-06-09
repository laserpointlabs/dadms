# Log File Organization

This document explains how log files are organized in the DADM system.

## Log Directory Structure

DADM organizes logs in a structured manner to maintain a clean project directory and make it easier to find specific logs.

```
logs/
├── services/       # Logs from service components
├── monitors/       # Logs from monitoring scripts
└── processes/      # Logs from process execution
```

### Services Logs

The `logs/services/` directory contains logs from the various service components:

- `assistant_id_manager.log` - Logs from the AssistantIDManager component
- `openai_service.log` - Logs from the OpenAI service
- `echo_service.log` - Logs from the Echo test service
- `service_status_*.json` - Service status check reports

### Monitors Logs

The `logs/monitors/` directory contains logs from monitoring scripts:

- `service_monitor.log` - Logs from the service monitoring daemon
- `assistant_monitor.log` - Logs from the assistant ID monitoring script

### Processes Logs

The `logs/processes/` directory contains logs related to process execution:

- `process_execution_*.log` - Logs from specific process executions
- `camunda_*.log` - Logs related to Camunda BPM operations

## Log File Cleanup

The project includes scripts to help organize and clean up log files:

1. `scripts/setup_logs_directory.py` - Creates the log directory structure
2. `scripts/cleanup_logs.py` - Moves top-level log files to the appropriate subdirectories

You can run these cleanup scripts using the provided shortcuts:

```bash
# On Windows
scripts\cleanup_logs.bat

# On Linux/macOS
./scripts/cleanup_logs.sh
```

## Log Configuration

All DADM components are configured to write their logs to the appropriate subdirectory. For example:

```python
# Set up log directory
project_root = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
logs_dir = os.path.join(project_root, "logs", "services")
Path(logs_dir).mkdir(parents=True, exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(logs_dir, "component_name.log")),
        logging.StreamHandler()
    ]
)
```

## Log Retention

By default, DADM does not automatically delete old log files. If you need to implement log rotation or retention policies, consider:

1. Using the Python `logging.handlers.RotatingFileHandler` to limit log file sizes
2. Setting up a cron job or scheduled task to periodically clean up old log files
3. Implementing a custom log retention script

Example configuration with rotating file handler:

```python
from logging.handlers import RotatingFileHandler

# Configure logging with rotation
log_file = os.path.join(logs_dir, "component_name.log")
handlers = [
    RotatingFileHandler(
        log_file,
        maxBytes=10*1024*1024,  # 10 MB
        backupCount=5           # Keep 5 backup files
    ),
    logging.StreamHandler()
]

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=handlers
)
```

## Git Integration

The log directory structure is preserved in git, but the log files themselves are excluded. This is configured in the `.gitignore` file:

```
# Ignore log files
*.log
*.log.*

# But don't ignore the logs directory structure itself
!/logs/
/logs/*
!/logs/.gitkeep
!/logs/*/
/logs/*/*
!/logs/*/.gitkeep
```

This ensures that the directory structure is maintained when cloning the repository, but no log files are committed to the repository.