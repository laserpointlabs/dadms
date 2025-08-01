# DADMS MCP Memory Quick Setup Guide

## Prerequisites

- Cursor IDE installed
- Docker/Podman available
- Node.js and npm/uvx for MCP server management

## 1. Infrastructure Setup

### Start DADMS Infrastructure
```bash
./dadms-start.sh start
```

This will start:
- Neo4j Main Database (port 7687)
- **Neo4j Memory Database (port 7688)**
- Other DADMS services

### Verify Memory Database
```bash
./dadms-start.sh memory
```

Expected output:
```
✅ Neo4j Memory Server: Running
🌐 Web Interface: http://localhost:7475
🔌 Bolt Connection: neo4j://localhost:7688
👤 Credentials: neo4j/memorypassword
📊 Memory Database Stats: [node count]
```

## 2. MCP Server Configuration

### Configure Cursor MCP (`.cursor/mcp.json`)
```json
{
  "$schema": "https://json.schemastore.org/mcp.json",
  "description": "DADMS Development MCP Server Configuration with Seamless Memory",
  "mcpServers": {
    "neo4j-memory": {
      "command": "uvx",
      "args": [
        "mcp-neo4j-memory",
        "--db-url", "neo4j://localhost:7688",
        "--username", "neo4j",
        "--password", "memorypassword"
      ]
    },
    "neo4j-cypher": {
      "command": "uvx", 
      "args": [
        "mcp-neo4j-cypher",
        "--db-url", "neo4j+s://demo.neo4jlabs.com",
        "--username", "recommendations",
        "--password", "recommendations"
      ]
    },
    "huggingface-mcp": {
      "command": "uvx",
      "args": [
        "--from", "git+https://github.com/shreyaskarnik/huggingface-mcp-server.git",
        "huggingface"
      ],
      "env": {
        "HF_TOKEN": "${HF_TOKEN}"
      }
    }
  }
}
```

### Install MCP Servers
```bash
# Install required MCP servers
uvx install mcp-neo4j-memory
uvx install mcp-neo4j-cypher
```

## 3. Cursor Rules Setup

The following files should exist in `.cursor/rules/`:

### `dadms-memory-agent.mdc` (Always Applied)
```yaml
---
description: 
globs: 
alwaysApply: true
---

# DADMS Seamless Memory Management
[Content handles automatic memory operations]
```

### `dadms-memory-queries.mdc` (Agent Requested)
```yaml
---
description: Advanced memory search and management capabilities for DADMS project. Use when user asks about previous decisions or needs project context.
globs: 
alwaysApply: false
---

# DADMS Memory Query & Management
[Content handles memory searches and queries]
```

### `dadms-development-memory.mdc` (Auto Attached)
```yaml
---
description: 
globs: dadms-services/**/*.js, dadms-services/**/*.ts, dadms-ui/**/*.tsx, dadms-ui/**/*.ts, dadms-infrastructure/**/*.yml, .cursor/**/*.mdc
alwaysApply: false
---

# DADMS Development Context Memory
[Content provides file-specific memory context]
```

## 4. Verification Steps

### Test MCP Connection
1. Open Cursor IDE
2. Start a new chat
3. Look for MCP server indicators in the UI
4. The memory tools should be automatically available

### Test Memory Operations
```bash
# In Cursor chat:
"What do we know about DADMS infrastructure?"
# Should search memory and return stored information

# After implementing something:
"Remember that we use port 3001 for the user service"
# Should automatically store this information
```

### Verify Rules Are Active
In Cursor Agent sidebar, you should see active rules:
- ✅ dadms-memory-agent (Always)
- ✅ dadms-memory-queries (when triggered)
- ✅ dadms-development-memory (when editing files)

## 5. Common Commands

### Memory Management
```bash
# Check memory status
./dadms-start.sh memory

# Create backup
./dadms-start.sh backup

# Restore from backup
./dadms-start.sh restore

# View system status
./dadms-start.sh status
```

### Infrastructure Management
```bash
# Start all services
./dadms-start.sh start

# Stop all services  
./dadms-start.sh stop

# Restart services
./dadms-start.sh restart

# View logs
./dadms-start.sh logs
```

## 6. Troubleshooting

### Memory Server Not Available
```bash
# Check if containers are running
./dadms-start.sh status

# Restart infrastructure
./dadms-start.sh restart

# Check specific memory service
podman logs neo4j-memory
```

### Cursor Not Seeing MCP Servers
1. Restart Cursor IDE
2. Check `.cursor/mcp.json` syntax
3. Verify MCP servers are installed: `uvx list`
4. Check Cursor settings → MCP

### Memory Tools Not Working
1. Verify Neo4j Memory is running on port 7688
2. Test connection: `./dadms-start.sh memory`
3. Check MCP server logs in Cursor
4. Restart MCP servers

## 7. Expected Behavior

### Automatic Memory Storage
- AI stores decisions without being asked
- Architecture choices are remembered
- Problem solutions are preserved
- Integration patterns are captured

### Context-Aware Development
- Opening DADMS files auto-loads relevant context
- Previous decisions inform new implementations
- Consistent patterns across development sessions

### Persistent Knowledge
- Memory survives Cursor restarts
- Information builds over time
- Cross-references between related concepts

## 8. Success Indicators

✅ Memory database shows increasing node count  
✅ Backup files are created automatically  
✅ AI references previous decisions naturally  
✅ Context loading happens automatically when opening files  
✅ Memory searches return relevant historical information  

---

**🎉 Your DADMS MCP Memory System is now ready for seamless AI-assisted development!**

For detailed information, see `MCP_Memory_System_Guide.md` in this directory.