# Analysis Storage Configuration

This directory contains the analysis data storage and daemon configuration files for the DADM Analysis Data Management system.

## Files

### `analysis_daemon.config`
JSON configuration file that stores daemon settings for background processing. This file is automatically created and managed by the `dadm analysis` commands.

### Configuration Options

The `analysis_daemon.config` file supports the following options:

```json
{
  "interval": 30,                    // Processing interval in seconds (default: 30)
  "batch_size": 10,                  // Number of tasks to process per batch (default: 10)
  "no_vector_store": false,          // Disable vector store processing (default: false)
  "no_graph_db": false,              // Disable graph database processing (default: false)
  "storage_dir": null,               // Custom storage directory path (default: null for default location)
  "log_file": null,                  // Custom log file path (default: null for "logs/analysis_daemon.log")
  "started_at": 1749645710.2291672   // Unix timestamp when daemon was started (automatically set)
}
```

### Configuration Details

#### Core Processing Settings
- **`interval`**: How often (in seconds) the daemon checks for and processes pending analysis tasks
  - Range: 5-3600 seconds
  - Recommended: 15-60 seconds for active usage, 300+ for background monitoring

- **`batch_size`**: Maximum number of analysis tasks to process in a single batch
  - Range: 1-100 tasks
  - Recommended: 5-20 for balanced performance

#### Backend Control
- **`no_vector_store`**: When `true`, disables processing to Qdrant vector store
  - Use when: Vector search functionality not needed
  - Impact: Semantic search capabilities will be unavailable

- **`no_graph_db`**: When `true`, disables processing to Neo4j graph database
  - Use when: Relationship analysis not needed
  - Impact: Graph-based queries and relationship exploration unavailable

#### Storage and Logging
- **`storage_dir`**: Override default storage location
  - Default: `data/analysis_storage/`
  - Use when: Custom data organization or multiple instances needed

- **`log_file`**: Override default log file location
  - Default: `logs/analysis_daemon.log`
  - Use when: Custom logging setup or log rotation needed

- **`started_at`**: Timestamp tracking when daemon was started
  - Automatically managed by daemon
  - Used for uptime calculations in status display

## Usage Examples

### Starting Daemon with Custom Configuration
```bash
# Default settings
dadm analysis daemon --detach

# Custom interval and batch size
dadm analysis daemon --detach --interval 60 --batch-size 20

# Disable specific backends
dadm analysis daemon --detach --no-vector-store
dadm analysis daemon --detach --no-graph-db

# Custom storage and logging
dadm analysis daemon --detach --storage-dir ./custom_storage --log-file ./custom.log
```

### Daemon Management
```bash
# Check current configuration and status
dadm analysis status

# Stop daemon (preserves configuration for restart)
dadm analysis stop

# Restart with saved configuration
dadm analysis restart
```

## Configuration Persistence

The daemon configuration is automatically:
- **Saved** when starting the daemon with `--detach`
- **Restored** when using `dadm analysis restart`
- **Updated** with new settings when restarting with different parameters

## Performance Tuning

### High-Volume Processing
For environments with frequent analysis generation:
```json
{
  "interval": 10,
  "batch_size": 25,
  "no_vector_store": false,
  "no_graph_db": false
}
```

### Resource-Constrained Environments
For systems with limited resources:
```json
{
  "interval": 120,
  "batch_size": 5,
  "no_vector_store": true,
  "no_graph_db": false
}
```

### Development/Testing
For development and testing scenarios:
```json
{
  "interval": 5,
  "batch_size": 1,
  "no_vector_store": false,
  "no_graph_db": false
}
```

## Troubleshooting

### Common Configuration Issues

1. **Daemon won't start**
   - Check if `analysis_daemon.config` is valid JSON
   - Ensure storage directory is writable
   - Verify log file directory exists

2. **Poor performance**
   - Reduce `batch_size` if experiencing timeouts
   - Increase `interval` if system resources are constrained
   - Disable unused backends (`no_vector_store` or `no_graph_db`)

3. **Configuration not persisting**
   - Ensure daemon is started with `--detach` flag
   - Check file permissions on storage directory
   - Verify no conflicting daemon instances running

### Manual Configuration Editing

⚠️ **Warning**: Manual editing of `analysis_daemon.config` should be done only when the daemon is stopped.

1. Stop the daemon: `dadm analysis stop`
2. Edit the configuration file with valid JSON
3. Restart the daemon: `dadm analysis restart`

## Related Files

- **`analysis_data.db`**: SQLite database containing analysis data
- **`.daemon_pid`**: Process ID file for running daemon (automatically managed)
- **`../logs/analysis_daemon.log`**: Default daemon log file location

## Security Considerations

- Configuration file contains no sensitive information
- All paths should be within accessible directories
- Log files may contain analysis content - secure appropriately
- Database files contain analysis data - apply appropriate access controls
