#!/bin/bash

# DADMS MCP Memory Backup Script
# Backs up Neo4j memory database with timestamps

set -e

BACKUP_DIR="./backups/mcp-memory"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="mcp-memory-backup-${TIMESTAMP}.cypher"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting MCP memory backup..."

# Check if Neo4j memory container is running
if ! podman ps | grep -q "neo4j-memory"; then
    echo "❌ Error: neo4j-memory container is not running"
    echo "   Start it with: cd dadms-infrastructure && podman-compose up -d neo4j-memory"
    exit 1
fi

# Create backup directory inside container (in the import directory where APOC can write)
podman exec neo4j-memory mkdir -p /var/lib/neo4j/import

# Export all data from Neo4j memory instance
podman exec neo4j-memory cypher-shell -u neo4j -p memorypassword \
    "CALL apoc.export.cypher.all('backup.cypher', {})" || {
    echo "❌ Failed to create backup"
    exit 1
}

# Copy backup file from container
podman cp neo4j-memory:/var/lib/neo4j/import/backup.cypher "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress the backup
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

echo "✅ Memory backup completed: ${BACKUP_DIR}/${BACKUP_FILE}.gz"
echo "📊 Backup size: $(du -h "${BACKUP_DIR}/${BACKUP_FILE}.gz" | cut -f1)"

# Keep only last 7 backups
echo "🧹 Cleaning old backups (keeping last 7)..."
cd "$BACKUP_DIR"
ls -t mcp-memory-backup-*.cypher.gz 2>/dev/null | tail -n +8 | xargs -r rm
echo "📁 Total backups: $(ls -1 mcp-memory-backup-*.cypher.gz 2>/dev/null | wc -l)"

echo "🎉 MCP memory backup process completed successfully!"