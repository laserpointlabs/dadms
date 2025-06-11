# DADM Analysis Command

The `dadm analysis` command provides tools for managing analysis data storage and background processing in DADM.

## Overview

The analysis system automatically captures data from DADM workflows and stores it in a SQLite database with background processing to vector stores (Qdrant) and graph databases (Neo4j). This enables advanced querying, semantic search, and relationship analysis.

## Usage

```
dadm analysis <subcommand> [options]
```

## Subcommands

### `daemon` - Start Analysis Processing Daemon

Starts a background daemon that continuously processes stored analysis data into vector stores and graph databases.

```bash
dadm analysis daemon [options]
```

**Options:**
- `--interval SECONDS` - Processing interval in seconds (default: 30)
- `--batch-size NUMBER` - Number of tasks to process per batch (default: 10)
- `--no-vector-store` - Disable vector store processing
- `--no-graph-db` - Disable graph database processing
- `--storage-dir PATH` - Custom storage directory for analysis data
- `--detach` - **Run daemon in background and release terminal**
- `--log-file PATH` - Log file for background daemon (default: logs/analysis_daemon.log)

**Examples:**
```bash
# Start daemon in foreground (blocks terminal)
dadm analysis daemon

# Start daemon in background (releases terminal)
dadm analysis daemon --detach

# Start in background with custom settings
dadm analysis daemon --detach --interval 60 --batch-size 20

# Start with only vector store processing
dadm analysis daemon --detach --no-graph-db

# Start with custom storage directory and log file
dadm analysis daemon --detach --storage-dir ./my_analysis_data --log-file ./my_daemon.log
```

**Background Mode Benefits:**
- **Terminal Freedom**: The `--detach` flag allows you to start the daemon and continue working
- **Persistent Processing**: Daemon continues running even if you close the terminal
- **Log Monitoring**: All daemon activity is logged to a file for monitoring
- **Process Management**: Use `stop`, `restart`, and `status` commands to manage the daemon

### `stop` - Stop Background Analysis Daemon

Stops a running background analysis daemon.

```bash
dadm analysis stop [options]
```

**Options:**
- `--storage-dir PATH` - Custom storage directory for analysis data

**Examples:**
```bash
# Stop the background daemon
dadm analysis stop
```

### `restart` - Restart Background Analysis Daemon

Restarts the background analysis daemon using the previous configuration.

```bash
dadm analysis restart [options]
```

**Options:**
- `--storage-dir PATH` - Custom storage directory for analysis data

**Examples:**
```bash
# Restart daemon with previous settings
dadm analysis restart
```

### `status` - Show Analysis System Status

Displays the current status of the analysis storage system including statistics and backend health.

```bash
dadm analysis status [options]
```

**Options:**
- `--storage-dir PATH` - Custom storage directory for analysis data

**Example Output:**
```
Analysis System Status

Storage Statistics:
  Total analyses: 15
  Processing task status: {'completed': 12, 'pending': 3}
  Vector store enabled: True
  Graph database enabled: True
```

### `process` - Process Pending Analysis Tasks

Manually process pending analysis tasks. Useful for one-time processing or testing.

```bash
dadm analysis process [options]
```

**Options:**
- `--once` - Process once and exit (required for manual processing)
- `--limit NUMBER` - Number of tasks to process (default: 10)
- `--processor-type TYPE` - Specific processor type to run (choices: vector_store, graph_db)
- `--storage-dir PATH` - Custom storage directory for analysis data

**Examples:**
```bash
# Process up to 10 pending tasks once
dadm analysis process --once

# Process only vector store tasks
dadm analysis process --once --processor-type vector_store

# Process up to 5 tasks
dadm analysis process --once --limit 5
```

## Integration with DADM Workflows

The analysis system integrates seamlessly with existing DADM commands:

1. **Automatic Capture**: When you run `dadm -s 'OpenAI Decision Tester'`, analysis data is automatically captured
2. **Background Processing**: If the daemon is running, data is processed to backends automatically
3. **No Workflow Changes**: Existing DADM workflows require no modifications

## Workflow Example

### Background Daemon Workflow (Recommended)
```bash
# 1. Start the analysis daemon in background
dadm analysis daemon --detach

# 2. Verify it's running
dadm analysis status

# 3. Run your DADM workflow (daemon processes automatically)
dadm -s 'OpenAI Decision Tester'

# 4. Check the analysis status (shows new data)
dadm analysis status

# 5. Continue working - the daemon processes data in background
# Stop daemon when done
dadm analysis stop
```

### Foreground Daemon Workflow
```bash
# 1. Start the analysis daemon (blocks terminal)
dadm analysis daemon

# 2. In another terminal, run your DADM workflow
dadm -s 'OpenAI Decision Tester'

# 3. Check analysis status in another terminal
dadm analysis status

# 4. Stop daemon with Ctrl+C in daemon terminal
```

## CLI Tools Integration

The analysis system also provides standalone CLI tools for advanced operations:

```bash
# View stored analyses
python scripts/analysis_cli.py list

# Extract OpenAI threads
python scripts/extract_openai_threads.py

# Continue OpenAI conversations
python scripts/interact_openai_thread.py --process-id <id> --message "Question"
```

## Storage Locations

By default, analysis data is stored in:
- **SQLite Database**: `test_data/analysis_storage/analysis_data.db`
- **Vector Store**: Qdrant (via Docker container)
- **Graph Database**: Neo4j (via Docker container)

You can customize the storage directory using the `--storage-dir` option.

## Troubleshooting

### Daemon Won't Start
1. Check that Docker containers are running: `dadm docker ps`
2. Verify Qdrant and Neo4j are accessible
3. Check storage directory permissions

### No Data Being Processed
1. Verify daemon is running with correct backends enabled
2. Check for pending tasks: `dadm analysis status`
3. Try manual processing: `dadm analysis process --once`

### Performance Issues
1. Adjust processing interval: `--interval 60`
2. Reduce batch size: `--batch-size 5`
3. Disable one backend if not needed: `--no-graph-db` or `--no-vector-store`

## See Also

- [Analysis Data Management Documentation](../docs/analysis_data_management.md)
- [DADM Analysis Integration Summary](../DADM_ANALYSIS_INTEGRATION_COMPLETE.md)
- [Docker Commands](docker_command.md)
- [Deploy Commands](deploy_command.md)
