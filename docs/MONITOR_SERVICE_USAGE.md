# Monitor Service Usage Guide

This guide explains how to use the DADM service monitor to ensure your services remain available.

## What is the Monitor Service?

The monitor service is a background process that periodically checks if the DADM services (OpenAI service, Echo service, etc.) are running properly. If it detects that a service is down or unresponsive, it will automatically attempt to restart it.

## Running the Monitor Service

### Option 1: Using Docker Compose

The simplest way to run the monitor service is as part of the full DADM stack:

```bash
# Start all services including the monitor
docker-compose -f docker/docker-compose.yml up -d
```

This starts the monitor service in a container that checks other services every 60 seconds.

### Option 2: Running Directly

You can run the monitor service directly using Python:

```bash
# Basic usage with default settings (60-second interval)
python scripts/service_monitor.py

# Custom check interval (e.g., check every 30 seconds)
python scripts/service_monitor.py --interval 30

# Monitor only specific services
python scripts/service_monitor.py --services assistant/openai test/echo
```

### Option 3: Running in the Background

To run the monitor in the background while you work with DADM:

#### On Linux/macOS:
```bash
# Start in background
python scripts/service_monitor.py &

# Or with nohup to keep it running after terminal closes
nohup python scripts/service_monitor.py > monitor.log 2>&1 &
```

#### On Windows:
```cmd
# Start in a new window
start python scripts\service_monitor.py
```

## Command-Line Options

The monitor service supports the following options:

| Option | Description |
|--------|-------------|
| `--interval` or `-i` | Check interval in seconds (default: 60) |
| `--services` or `-s` | Specific services to monitor (format: type/name) |

Example:
```bash
python scripts/service_monitor.py --interval 45 --services assistant/openai
```

## Monitoring the Monitor

The monitor service logs its activities to:
- Console output
- `logs/monitors/service_monitor.log` file

You can check the log file to see what the monitor is doing:

```bash
# View the log file
cat logs/monitors/service_monitor.log

# Or follow the log in real-time
tail -f logs/monitors/service_monitor.log
```

## Using with quick_start Scripts

The `quick_start.bat` (Windows) and `quick_start.sh` (Linux/macOS) scripts automatically start the monitor service as part of their workflow.

## Stopping the Monitor

To stop the monitor service:

### Docker version:
```bash
docker-compose -f docker/docker-compose.yml stop service-monitor
```

### Direct version:
Find the process ID and kill it:
```bash
# Find the PID
ps aux | grep service_monitor.py

# Kill the process
kill <PID>
```

On Windows, you can use Task Manager to end the Python process.

## Troubleshooting

If the monitor service isn't working properly:

1. Check the log file at `service_monitor.log`
2. Verify the services it's attempting to monitor are correctly registered in `config/service_registry.py`
3. Ensure Docker environment variables are properly configured (if using Docker)
4. See [SERVICE_TROUBLESHOOTING.md](SERVICE_TROUBLESHOOTING.md) for more help

For Docker-specific environment variable issues, see [DOCKER_ENVIRONMENT_VARS.md](DOCKER_ENVIRONMENT_VARS.md).