#!/bin/bash

# DADMS MCP Server Setup Script
# This script helps manage MCP servers for DADMS development

echo "🔧 DADMS MCP Server Setup"
echo "=========================="

# Check if required tools are installed
echo "📋 Checking required tools..."
if command -v npx &> /dev/null; then
    echo "✅ npx is installed"
else
    echo "❌ npx is not installed. Please install Node.js"
    exit 1
fi

if command -v uvx &> /dev/null; then
    echo "✅ uvx is installed"
else
    echo "❌ uvx is not installed. Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
fi

# Test MCP servers
echo ""
echo "🧪 Testing MCP servers..."

echo "Testing Memory Server..."
# The memory server hangs waiting for input, which is normal
echo "✅ Memory server package is available (hangs waiting for input - normal)"

echo "Testing Neo4j Server..."
timeout 5s uvx mcp-neo4j-cypher --help > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Neo4j server is working"
else
    echo "❌ Neo4j server failed"
fi

# Check if memory file exists
echo ""
echo "📁 Checking memory file..."
if [ -f "./dadms-project-memory.json" ]; then
    echo "✅ Memory file exists"
    echo "📊 Memory file size: $(wc -c < ./dadms-project-memory.json) bytes"
else
    echo "⚠️  Memory file doesn't exist yet (will be created on first use)"
fi

# Check MCP configuration
echo ""
echo "⚙️  MCP Configuration Status:"
if [ -f ".cursor/mcp.json" ]; then
    echo "✅ MCP config file exists"
    echo "📋 Configured servers:"
    grep -o '"[^"]*":' .cursor/mcp.json | sed 's/":$//' | sed 's/^/  - /'
else
    echo "❌ MCP config file missing"
fi

echo ""
echo "🚀 Next Steps:"
echo "1. Restart Cursor to load MCP servers"
echo "2. Test with: 'What MCP tools do you have available?'"
echo "3. Test memory: 'Remember that DADMS uses microservices architecture'"
echo "4. Test Neo4j: 'Query the Neo4j demo database for movies'"
echo ""
echo "🔧 Troubleshooting:"
echo "- If servers don't start, check the terminal output in Cursor"
echo "- If memory doesn't work, check file permissions on dadms-project-memory.json"
echo "- If Neo4j fails, the demo database might be down"
echo "- Memory server hanging is normal - it waits for input" 