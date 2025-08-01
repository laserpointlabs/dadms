# MCP Memory Architecture Guide

## Overview

This guide documents the dedicated MCP (Model Context Protocol) memory architecture implemented for DADMS. We've separated AI memory from operational data to ensure clean architecture, data integrity, and robust backup capabilities.

## Architecture

### Before: Mixed Concerns ❌
```
DADMS Services ──┐
                 ├─→ Neo4j :7687 (Mixed Data)
MCP Memory ──────┘   • DADMS operational data
                     • AI conversations & learning
                     • Process/task relationships
```

### After: Clean Separation ✅
```
DADMS Services ────→ Neo4j Main :7687
                     • Process/task data
                     • Operational data

MCP Client ────────→ Neo4j Memory :7688
                     • AI conversations
                     • Learning data
                     • Context memory
```

## Infrastructure Components

### Neo4j Memory Server
- **Container**: `neo4j-memory`
- **Image**: `neo4j:5.13`
- **HTTP Interface**: `http://localhost:7475`
- **Bolt Connection**: `neo4j://localhost:7688`
- **Credentials**: `neo4j/memorypassword`
- **Features**:
  - APOC plugin enabled for backup/restore
  - Dedicated data volume: `neo4j-memory-data`
  - Backup volume: `neo4j-memory-backups`

### MCP Server Configuration
The `.cursor/mcp.json` configuration includes:

```json
{
    "neo4j-memory": {
        "command": "uvx",
        "args": [
            "mcp-neo4j-memory",
            "--db-url",
            "neo4j://localhost:7688",
            "--username", "neo4j",
            "--password", "memorypassword"
        ]
    },
    "huggingface-mcp": {
        "command": "uvx",
        "args": [
            "--from",
            "git+https://github.com/shreyaskarnik/huggingface-mcp-server.git",
            "huggingface"
        ],
        "env": {
            "HF_TOKEN": "${HF_TOKEN}"
        }
    }
}
```

## Setup Instructions

### 1. Start the Infrastructure

```bash
# Start all services including the new Neo4j memory instance
cd dadms-infrastructure
podman-compose up -d

# Or start just the memory server
podman-compose up -d neo4j-memory
```

### 2. Verify Memory Server

```bash
# Check server status and connection info
./dadms-servers.sh memory
```

Expected output:
```
🧠 MCP Memory Information
========================

✅ Neo4j Memory Server: Running
🌐 Web Interface: http://localhost:7475
🔌 Bolt Connection: neo4j://localhost:7688
👤 Credentials: neo4j/memorypassword
```

### 3. Configure MCP Client

The MCP configuration is already set up in `.cursor/mcp.json`. To use:

1. **Set Environment Variables** (for Hugging Face):
   ```bash
   export HF_TOKEN="your_huggingface_token_here"
   ```

2. **Restart Cursor** to load the new MCP server configuration

3. **Verify Tools**: Check that MCP tools appear in Cursor's MCP panel

## Memory Backup System

### Automated Backup Script

**Location**: `./scripts/backup-memory.sh`

**Features**:
- Creates timestamped backups
- Compresses backup files
- Maintains backup rotation (keeps last 7)
- Full error handling and status reporting

**Usage**:
```bash
# Manual backup
./scripts/backup-memory.sh

# Via management script
./dadms-servers.sh backup
```

**Backup Location**: `./backups/mcp-memory/mcp-memory-backup-YYYYMMDD_HHMMSS.cypher.gz`

### Restore System

**Location**: `./scripts/restore-memory.sh`

**Features**:
- Lists available backups
- Supports "latest" option
- Safety confirmation required
- Complete data replacement workflow

**Usage**:
```bash
# Restore latest backup
./scripts/restore-memory.sh latest

# Restore specific backup
./scripts/restore-memory.sh mcp-memory-backup-20240731_211224.cypher.gz

# Via management script
./dadms-servers.sh restore latest
```

### Backup Process Details

1. **Export**: Uses APOC `export.cypher.all()` to export all data
2. **Copy**: Extracts backup file from container
3. **Compress**: Gzips the backup for storage efficiency
4. **Rotate**: Automatically removes old backups (keeps 7)

## Management Commands

### Enhanced dadms-servers.sh

New memory management commands added:

```bash
# Infrastructure commands
./dadms-servers.sh status    # Show all service status
./dadms-servers.sh start     # Start all services
./dadms-servers.sh stop      # Stop all services
./dadms-servers.sh restart   # Restart all services
./dadms-servers.sh logs      # Show service logs

# Memory management commands
./dadms-servers.sh memory    # Show memory info and stats
./dadms-servers.sh backup    # Backup memory data
./dadms-servers.sh restore   # Restore memory data
```

### Memory Information Command

The `memory` command provides:
- Server status and connection details
- Database statistics (node counts by type)
- Available backup files with timestamps and sizes

Example output:
```
🧠 MCP Memory Information
========================

✅ Neo4j Memory Server: Running
🌐 Web Interface: http://localhost:7475
🔌 Bolt Connection: neo4j://localhost:7688
👤 Credentials: neo4j/memorypassword

📊 Memory Database Stats:
   Memory: 45 nodes
   Entity: 12 nodes

🗂️ Available Backups:
   mcp-memory-backup-20240731_211224.cypher.gz (1.2K) - Jul 31 21:12
   mcp-memory-backup-20240730_140530.cypher.gz (856 bytes) - Jul 30 14:05
```

## Security Considerations

### Access Control
- **Memory Server**: Separate credentials (`neo4j/memorypassword`)
- **Network Isolation**: Different ports (7688 vs 7687)
- **Volume Separation**: Dedicated data volumes

### Backup Security
- **Local Storage**: Backups stored in `./backups/mcp-memory/`
- **Compression**: Reduces storage footprint
- **Rotation**: Automatic cleanup prevents disk space issues

### Environment Variables
- **HF_TOKEN**: Stored as environment variable, not in config files
- **Credentials**: Hard-coded for development, should be externalized for production

## Troubleshooting

### Common Issues

**1. Neo4j Memory Server Not Starting**
```bash
# Check logs
podman logs neo4j-memory

# Restart the service
cd dadms-infrastructure
podman-compose restart neo4j-memory
```

**2. MCP Connection Issues**
```bash
# Verify server is running
./dadms-servers.sh memory

# Check MCP configuration
cat .cursor/mcp.json

# Restart Cursor to reload config
```

**3. Backup Failures**
```bash
# Ensure APOC is enabled
podman exec neo4j-memory cypher-shell -u neo4j -p memorypassword "RETURN apoc.version()"

# Check import directory permissions
podman exec neo4j-memory ls -la /var/lib/neo4j/import/
```

**4. Port Conflicts**
If ports 7475 or 7688 are in use:
```bash
# Check what's using the ports
sudo netstat -tulpn | grep 7475
sudo netstat -tulpn | grep 7688

# Modify docker-compose.yml to use different ports
```

### Service Health Checks

The memory server includes health checks:
```yaml
healthcheck:
  test: ["CMD", "cypher-shell", "-u", "neo4j", "-p", "memorypassword", "RETURN 1"]
  interval: 30s
  timeout: 20s
  retries: 3
```

## Performance Considerations

### Memory Usage
- **Separate Instances**: Each Neo4j instance has its own memory allocation
- **Volume Storage**: Persistent storage ensures data survives container restarts
- **Backup Size**: Compressed backups are typically small for memory data

### Network Performance
- **Local Connections**: Both instances run on localhost
- **Port Separation**: Eliminates connection conflicts
- **Dedicated Resources**: Each instance has isolated resources

## Future Enhancements

### Planned Improvements
1. **Automated Backup Scheduling**: Cron job for regular backups
2. **Remote Backup Storage**: S3 or similar for off-site backups
3. **Monitoring Integration**: Prometheus metrics for memory server
4. **Security Hardening**: External credential management
5. **Backup Encryption**: Encrypted backup files for sensitive data

### Scaling Considerations
- **Multiple Memory Instances**: For different AI agents or contexts
- **Backup Retention Policies**: Configurable retention periods
- **Performance Monitoring**: Memory and storage usage tracking

## Related Documentation

- [MCP Integration Specification](./specifications/MCP_Integration_Specification.md)
- [MCP Implementation Guide](./specifications/MCP_Implementation_Guide.md)
- [MCP for Dummies](./MCP_For_Dummies.md)
- [DADMS Backend Implementation Guide](./BACKEND_IMPLEMENTATION_GUIDE.md)