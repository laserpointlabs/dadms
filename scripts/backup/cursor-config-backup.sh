#!/bin/bash

# DADMS Cursor Configuration Backup Script
# Backs up all Cursor-related configuration and development settings

set -e

BACKUP_DIR="./backups/cursor-config"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="cursor-config-backup-${TIMESTAMP}"

echo "🧠 DADMS Cursor Configuration Backup"
echo "===================================="
echo ""

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo "📁 Creating backup: ${BACKUP_NAME}"
echo ""

# Backup Cursor configuration files
echo "🔧 Backing up Cursor configuration..."

# .cursor directory
if [ -d ".cursor" ]; then
    echo "   📂 .cursor/ directory"
    tar -czf "${BACKUP_DIR}/${BACKUP_NAME}-cursor-rules.tar.gz" .cursor/
fi

# .cursorrules file
if [ -f ".cursorrules" ]; then
    echo "   📄 .cursorrules file"
    cp .cursorrules "${BACKUP_DIR}/${BACKUP_NAME}-cursorrules.txt"
fi

# Cursor settings (if exists)
if [ -d ".vscode" ]; then
    echo "   ⚙️  .vscode/ settings"
    tar -czf "${BACKUP_DIR}/${BACKUP_NAME}-vscode-settings.tar.gz" .vscode/
fi

# Development scripts
echo "🔧 Backing up development scripts..."
if [ -d "scripts" ]; then
    echo "   📂 scripts/ directory"
    tar -czf "${BACKUP_DIR}/${BACKUP_NAME}-scripts.tar.gz" scripts/
fi

# Documentation
echo "📚 Backing up documentation..."
if [ -d "docs" ]; then
    echo "   📂 docs/ directory"
    tar -czf "${BACKUP_DIR}/${BACKUP_NAME}-docs.tar.gz" docs/
fi

# Release notes
echo "📋 Backing up release notes..."
if ls RELEASE_NOTES_*.md 1> /dev/null 2>&1; then
    echo "   📄 Release notes"
    tar -czf "${BACKUP_DIR}/${BACKUP_NAME}-release-notes.tar.gz" RELEASE_NOTES_*.md
fi

# Git configuration and workflow
echo "🔧 Backing up Git configuration..."
if [ -f ".gitignore" ]; then
    echo "   📄 .gitignore"
    cp .gitignore "${BACKUP_DIR}/${BACKUP_NAME}-gitignore.txt"
fi

# Package configuration
echo "📦 Backing up package configuration..."
if [ -f "package.json" ]; then
    echo "   📄 package.json"
    cp package.json "${BACKUP_DIR}/${BACKUP_NAME}-package.json"
fi

# Docker configuration
echo "🐳 Backing up Docker configuration..."
if [ -d "dadms-infrastructure" ]; then
    echo "   📂 dadms-infrastructure/ directory"
    tar -czf "${BACKUP_DIR}/${BACKUP_NAME}-docker-config.tar.gz" dadms-infrastructure/
fi

# Create backup manifest
echo "📋 Creating backup manifest..."
cat > "${BACKUP_DIR}/${BACKUP_NAME}-manifest.txt" << EOF
DADMS Cursor Configuration Backup Manifest
=========================================

Backup Date: $(date)
Backup Name: ${BACKUP_NAME}
Backup Location: ${BACKUP_DIR}

Files Backed Up:
- .cursor/ directory (Cursor rules and configuration)
- .cursorrules file (Global Cursor rules)
- .vscode/ directory (VS Code/Cursor settings)
- scripts/ directory (Development scripts)
- docs/ directory (Documentation)
- RELEASE_NOTES_*.md files (Release documentation)
- .gitignore (Git ignore rules)
- package.json (Package configuration)
- dadms-infrastructure/ (Docker configuration)

Backup Files:
$(ls -la "${BACKUP_DIR}/${BACKUP_NAME}"*)

Restore Instructions:
1. Extract backup files to project root
2. Restore Cursor configuration: tar -xzf ${BACKUP_NAME}-cursor-rules.tar.gz
3. Restore scripts: tar -xzf ${BACKUP_NAME}-scripts.tar.gz
4. Restore docs: tar -xzf ${BACKUP_NAME}-docs.tar.gz
5. Restore Docker config: tar -xzf ${BACKUP_NAME}-docker-config.tar.gz
6. Restore release notes: tar -xzf ${BACKUP_NAME}-release-notes.tar.gz

Memory Backup Status:
$(ls -la backups/mcp-memory/mcp-memory-backup-*.cypher.gz 2>/dev/null | tail -1 || echo "No memory backups found")

EOF

echo ""
echo "✅ Backup completed successfully!"
echo "📁 Backup location: ${BACKUP_DIR}"
echo "📋 Manifest: ${BACKUP_DIR}/${BACKUP_NAME}-manifest.txt"
echo ""

# Show backup contents
echo "📊 Backup contents:"
ls -la "${BACKUP_DIR}/${BACKUP_NAME}"*
echo ""

# Cleanup old backups (keep last 5)
echo "🧹 Cleaning old backups (keeping last 5)..."
cd "${BACKUP_DIR}"
ls -t cursor-config-backup-*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f
ls -t cursor-config-backup-*.txt 2>/dev/null | tail -n +6 | xargs -r rm -f
cd - > /dev/null

echo "📁 Total backups: $(ls ${BACKUP_DIR}/cursor-config-backup-* 2>/dev/null | wc -l)"
echo ""
echo "🎉 Cursor configuration backup process completed successfully!" 