#!/bin/bash

# DADMS MCP Memory Restore Script
# Restores Neo4j memory database from backup

set -e

BACKUP_DIR="./backups/mcp-memory"

echo "🔄 Starting MCP memory restore..."

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Error: Backup directory not found: $BACKUP_DIR"
    exit 1
fi

# List available backups
echo "📁 Available backups:"
ls -la "$BACKUP_DIR"/mcp-memory-backup-*.cypher.gz 2>/dev/null | nl

# Get backup file to restore
if [ -z "$1" ]; then
    echo "📝 Usage: $0 <backup-file-name>"
    echo "   Example: $0 mcp-memory-backup-20240101_120000.cypher.gz"
    echo ""
    echo "💡 Or use 'latest' to restore the most recent backup:"
    echo "   Example: $0 latest"
    exit 1
fi

if [ "$1" = "latest" ]; then
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/mcp-memory-backup-*.cypher.gz 2>/dev/null | head -1)
    if [ -z "$BACKUP_FILE" ]; then
        echo "❌ No backup files found"
        exit 1
    fi
    echo "📂 Using latest backup: $(basename "$BACKUP_FILE")"
else
    BACKUP_FILE="$BACKUP_DIR/$1"
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "❌ Error: Backup file not found: $BACKUP_FILE"
        exit 1
    fi
fi

# Check if Neo4j memory container is running
if ! podman ps | grep -q "neo4j-memory"; then
    echo "❌ Error: neo4j-memory container is not running"
    echo "   Start it with: cd dadms-infrastructure && podman-compose up -d neo4j-memory"
    exit 1
fi

echo "⚠️  WARNING: This will REPLACE all current memory data!"
read -p "   Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Clear existing data
echo "🧹 Clearing existing memory data..."
podman exec neo4j-memory cypher-shell -u neo4j -p memorypassword \
    "MATCH (n) DETACH DELETE n" || {
    echo "❌ Failed to clear existing data"
    exit 1
}

# Extract backup file to temp location
TEMP_FILE="/tmp/restore_$(basename "$BACKUP_FILE" .gz)"
gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"

# Copy backup to container
podman cp "$TEMP_FILE" neo4j-memory:/backups/restore.cypher

# Restore data
echo "📥 Restoring memory data from backup..."
podman exec neo4j-memory cypher-shell -u neo4j -p memorypassword \
    --file /backups/restore.cypher || {
    echo "❌ Failed to restore backup"
    exit 1
}

# Cleanup
rm -f "$TEMP_FILE"

echo "✅ Memory restore completed successfully!"
echo "📊 Restored from: $(basename "$BACKUP_FILE")"