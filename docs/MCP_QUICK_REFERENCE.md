# MCP Quick Reference Card

## 🚀 Daily Operations

### Start/Stop Services
```bash
# Start all DADMS infrastructure (including MCP memory)
./dadms-servers.sh start

# Stop all services
./dadms-servers.sh stop

# Check status
./dadms-servers.sh status
```

### MCP Memory Management
```bash
# Check memory server status and stats
./dadms-servers.sh memory

# Backup memory data
./dadms-servers.sh backup

# Restore latest backup
./dadms-servers.sh restore latest
```

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `.cursor/mcp.json` | MCP server configuration for Cursor |
| `dadms-infrastructure/docker-compose.yml` | Infrastructure services including Neo4j memory |
| `backup-memory.sh` | Memory backup script |
| `restore-memory.sh` | Memory restore script |

## 🌐 Service Endpoints

| Service | URL | Credentials |
|---------|-----|-------------|
| **Neo4j Main** | http://localhost:7474 | neo4j/testpassword |
| **Neo4j Memory** | http://localhost:7475 | neo4j/memorypassword |
| **DADMS Services** | Various ports 3001-3021 | See port allocation |

## 🔗 MCP Connections

| Server | Connection | Purpose |
|--------|------------|---------|
| **neo4j-cypher** | neo4j+s://demo.neo4jlabs.com | Read-only demo database |
| **neo4j-memory** | neo4j://localhost:7688 | Dedicated AI memory storage |
| **huggingface-mcp** | API-based | Hugging Face Hub access |

## 💾 Backup Locations

```
./backups/mcp-memory/
├── mcp-memory-backup-20240731_211224.cypher.gz
├── mcp-memory-backup-20240730_140530.cypher.gz
└── ... (up to 7 backups kept automatically)
```

## ⚠️ Environment Variables

```bash
# Required for Hugging Face MCP server
export HF_TOKEN="your_huggingface_token_here"

# Verify
echo $HF_TOKEN
```

## 🔍 Troubleshooting Commands

```bash
# Check if Neo4j memory is running
podman ps | grep neo4j-memory

# View memory server logs
podman logs neo4j-memory

# Test memory connection
podman exec neo4j-memory cypher-shell -u neo4j -p memorypassword "RETURN 'Connected!'"

# List available backups
ls -la ./backups/mcp-memory/

# Check MCP tools in Cursor
# Look for MCP panel in Cursor UI after restart
```

## 📁 File Locations

| Type | Location | Files |
|------|----------|-------|
| **Scripts** | `./scripts/` | `backup-memory.sh`, `restore-memory.sh` |
| **Documentation** | `./docs/` | All `.md` files |
| **Configuration** | `./` | `.cursor/mcp.json`, `dadms-servers.sh` |
| **Infrastructure** | `./dadms-infrastructure/` | `docker-compose.yml` |

## 🛠️ Common Tasks

### Add New MCP Server
1. Edit `.cursor/mcp.json`
2. Add server configuration
3. Restart Cursor
4. Verify tools appear

### Recover Lost Memory
1. `./dadms-servers.sh restore latest`
2. Confirm data replacement
3. Restart MCP client if needed

### Clean Start
1. `./dadms-servers.sh stop`
2. `podman volume rm neo4j-memory-data` (⚠️ destroys data)
3. `./dadms-servers.sh start`

## 📊 Memory Statistics

```bash
# View memory database contents
./dadms-servers.sh memory

# Direct database query
podman exec neo4j-memory cypher-shell -u neo4j -p memorypassword \
  "MATCH (n) RETURN labels(n)[0] as Type, count(n) as Count"
```

## 🎯 Port Reference

| Port | Service | Type |
|------|---------|------|
| 7474 | Neo4j Main HTTP | DADMS operational |
| 7475 | Neo4j Memory HTTP | MCP memory |
| 7687 | Neo4j Main Bolt | DADMS operational |
| 7688 | Neo4j Memory Bolt | MCP memory |

---
*For detailed documentation, see: [MCP Memory Architecture Guide](docs/MCP_Memory_Architecture_Guide.md)*