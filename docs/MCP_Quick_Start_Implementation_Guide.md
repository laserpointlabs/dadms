# MCP Quick Start Implementation Guide for DADMS Development Acceleration

## 🎯 **Immediate Setup for Graph Memory & Programming Assistance**

This guide provides **copy-paste instructions** to immediately set up critical MCP servers for DADMS development acceleration, focusing on **graph database memory**, **programming assistance**, and **rapid development cycles**.

## ⚡ **Critical MCP Servers for DADMS**

### **Priority 1: Strong Memory & Graph Database** 🧠

#### **Neo4j Memory MCP Server**
- **Purpose**: Persistent graph-based memory for AI agents
- **DADMS Integration**: Enhances Context Manager Service (Port 3020)
- **Storage**: Local JSON file or your Neo4j instance

#### **Neo4j Cypher MCP Server** 
- **Purpose**: Direct graph database access and queries
- **DADMS Integration**: Connects to Knowledge Service (Port 3003)
- **Capability**: AI agents can query decision context graphs

### **Priority 2: Programming Assistance** 🛠️

#### **GitHub MCP Server**
- **Purpose**: Repository management and development automation
- **DADMS Integration**: Works with EventManager Service (Port 3004)
- **Capability**: AI can manage code, issues, and workflows

#### **Memory Bank MCP Server**
- **Purpose**: Structured project documentation and context preservation
- **DADMS Integration**: Maintains knowledge across all services
- **Capability**: AI remembers project patterns and decisions

## 🚀 **One-Command Setup for DADMS**

### **Step 1: Install Required Tools**

```bash
# Install uv package manager (includes uvx)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Add to PATH permanently
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
export PATH="$HOME/.local/bin:$PATH"
```

### **Step 2: Create MCP Configuration**

```bash
# Navigate to DADMS project
cd /path/to/dadms

# Create Cursor MCP configuration
mkdir -p .cursor && cat > .cursor/mcp.json << 'EOF'
{
  "mcpServers": {
    "dadms-memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE_PATH": "./dadms-project-memory.json"
      }
    },
    "neo4j-demo": {
      "command": "uvx",
      "args": ["mcp-neo4j-cypher",
               "--db-url", "neo4j+s://demo.neo4jlabs.com",
               "--user", "recommendations",
               "--password", "recommendations"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
EOF

echo "✅ MCP configured for DADMS! Restart Cursor to activate."
```

## 🎯 **VS Code Alternative Setup**

### **Global Configuration**
```bash
# Create VS Code MCP settings
mkdir -p ~/.vscode && cat > ~/.vscode/settings.json << 'EOF'
{
  "mcp": {
    "servers": {
      "dadms-memory": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-memory"],
        "env": {
          "MEMORY_FILE_PATH": "./dadms-memory.json"
        }
      },
      "neo4j-demo": {
        "command": "uvx",
        "args": ["mcp-neo4j-cypher",
                 "--db-url", "neo4j+s://demo.neo4jlabs.com",
                 "--user", "recommendations",
                 "--password", "recommendations"]
      }
    }
  }
}
EOF
```

## 🔧 **Advanced Configuration Options**

### **Your Own Neo4j Instance**

```json
{
  "mcpServers": {
    "dadms-neo4j": {
      "command": "uvx",
      "args": ["mcp-neo4j-cypher",
               "--db-url", "neo4j://localhost:7687",
               "--user", "neo4j",
               "--password", "your-password"]
    }
  }
}
```

### **Neo4j Aura Cloud Instance**

```json
{
  "mcpServers": {
    "dadms-aura": {
      "command": "uvx",
      "args": ["mcp-neo4j-cypher",
               "--db-url", "neo4j+s://your-instance.databases.neo4j.io",
               "--user", "neo4j",
               "--password", "your-aura-password"]
    }
  }
}
```

### **Memory Bank for Project Context**

```json
{
  "mcpServers": {
    "memory-bank": {
      "command": "uvx",
      "args": ["--from", "git+https://github.com/ipospelov/mcp-memory-bank", "mcp_memory_bank"]
    }
  }
}
```

## ⚡ **Immediate Testing Instructions**

### **Step 1: Restart Your Editor**
- **Cursor**: Close and reopen Cursor
- **VS Code**: Reload window (Ctrl+Shift+P → "Developer: Reload Window")

### **Step 2: Test MCP Connection**
Ask your AI assistant:
```
"What MCP tools do you have available?"
```

### **Step 3: Test Memory**
```
"Remember that DADMS 2.0 is a microservices decision intelligence platform with these key services:
- Project Service (Port 3001)
- LLM Service (Port 3002) 
- Knowledge Service (Port 3003)
- EventManager Service (Port 3004)
- Context Manager Service (Port 3020)

The platform uses BPMN workflow orchestration and graph-based knowledge management."
```

### **Step 4: Test Graph Database**
```
"Query the Neo4j demo database and show me what movies Quentin Tarantino directed."
```

### **Step 5: Test Memory Persistence**
In a new chat session, ask:
```
"What do you remember about DADMS 2.0?"
```

## 🎯 **DADMS-Specific Integration Benefits**

### **For Development Acceleration:**
1. **Project Memory**: AI remembers DADMS architecture patterns
2. **Code Context**: AI understands service relationships and ports
3. **Decision History**: AI tracks design decisions and rationale
4. **Pattern Recognition**: AI learns from DADMS development patterns

### **For Strong Memory:**
1. **Graph-Based Storage**: Knowledge stored in structured relationships
2. **Context Preservation**: Project context persists across sessions
3. **Service Integration**: Memory integrates with DADMS services
4. **Team Knowledge**: Shared understanding across development team

### **For Programming Assistance:**
1. **Repository Management**: AI can create branches, PRs, issues
2. **Code Generation**: AI generates DADMS service code patterns
3. **Documentation**: AI maintains and updates project documentation
4. **Workflow Automation**: AI manages development workflows

## 🚀 **Next Steps: Advanced Setup**

### **Production Neo4j Setup**
```bash
# Run local Neo4j for production use
docker run -d \
  --name dadms-neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/dadms-password \
  -v dadms-neo4j-data:/data \
  neo4j:latest
```

### **Code Knowledge Server**
```bash
# Install code knowledge for repository analysis
git clone https://github.com/davidvc/code-knowledge-tool
cd code-knowledge-tool
python -m venv venv
source venv/bin/activate
pip install -e ".[dev]"

# Requires Ollama for embeddings
curl https://ollama.ai/install.sh | sh
ollama serve
```

### **Aider AI Coding Assistant**
```bash
# Install Aider for AI-powered coding
git clone https://github.com/disler/aider-mcp-server.git
cd aider-mcp-server
uv sync
# Configure API keys in .env file
```

## 🔧 **Troubleshooting**

### **MCP Servers Not Loading**
1. Check Cursor/VS Code has been restarted
2. Verify JSON syntax in mcp.json
3. Check terminal for error messages
4. Ensure uvx is in PATH: `which uvx`

### **Neo4j Connection Issues**
1. Test with demo database first
2. Verify credentials for your instance
3. Check network connectivity
4. Ensure Neo4j instance is running

### **Memory Not Persisting**
1. Check file permissions on memory file
2. Verify file path in configuration
3. Ensure memory server is starting correctly
4. Check for JSON parsing errors

## 📊 **Monitoring Setup Success**

### **Files Created:**
- ✅ `.cursor/mcp.json` - MCP configuration
- ✅ `./dadms-project-memory.json` - AI memory storage
- ✅ `~/.bashrc` updated with uvx PATH

### **Servers Available:**
- ✅ Memory Server - Local persistent memory
- ✅ Neo4j Server - Graph database access  
- ✅ GitHub Server - Repository management

### **Integration Points:**
- ✅ Context Manager Service (Port 3020) ← Memory
- ✅ Knowledge Service (Port 3003) ← Neo4j
- ✅ EventManager Service (Port 3004) ← GitHub

## 🎯 **Success Indicators**

1. **AI shows available tools** when asked
2. **AI remembers project information** across sessions
3. **AI can query Neo4j database** and return results
4. **Memory file is created** in project directory
5. **No error messages** in terminal/editor

**Your DADMS development is now accelerated with AI agents that have strong memory and powerful tools!**

## 🔗 **Related Documentation**

- [MCP Integration Specification](specifications/MCP_Integration_Specification.md) - Complete technical architecture
- [Important MCP Servers for DADMS](research/Important_MCP_Servers_for_DADMS.md) - Strategic server analysis
- [MCP for Dummies](MCP_For_Dummies.md) - Beginner-friendly explanation
- [Implementation Guide](specifications/MCP_Implementation_Guide.md) - Detailed code examples

---

*This quick start guide gets you immediately productive with MCP servers for DADMS development. For advanced configurations and custom server development, see the complete implementation documentation.*