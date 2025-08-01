#!/bin/bash
echo "🔍 Checking for DADMS MCP Memory..."
echo "📍 Expected location: $(pwd)/dadms-project-memory.json"
echo ""

if [ -f "dadms-project-memory.json" ]; then
    echo "✅ Memory file found!"
    echo "�� File size: $(wc -c < dadms-project-memory.json) bytes"
    echo "🕒 Last modified: $(stat -f "%Sm" dadms-project-memory.json 2>/dev/null || stat -c "%y" dadms-project-memory.json)"
    echo ""
    echo "📋 Memory Contents:"
    echo "=================="
    if command -v jq >/dev/null 2>&1; then
        cat dadms-project-memory.json | jq .
    else
        cat dadms-project-memory.json
    fi
else
    echo "❌ Memory file not created yet"
    echo ""
    echo "💡 To create memory:"
    echo "1. Restart Cursor to load MCP servers"
    echo "2. Ask AI to remember something about DADMS"
    echo "3. Run this script again to see the memory"
fi
