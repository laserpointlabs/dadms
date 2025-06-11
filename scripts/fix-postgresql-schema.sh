#!/bin/bash
# Manual PostgreSQL Schema Migration for DADM
# Run this script to fix VARCHAR(4000) limitations manually

echo "=== DADM PostgreSQL Schema Migration ==="
echo "This script will convert VARCHAR(4000) columns to TEXT in the Camunda database"

# Check if PostgreSQL container is running
if ! docker ps | grep -q dadm-postgres; then
    echo "❌ PostgreSQL container (dadm-postgres) is not running!"
    echo "Please start your DADM containers first with: docker-compose up -d"
    exit 1
fi

echo "✅ PostgreSQL container is running"

# Apply the migration
echo "Applying VARCHAR(4000) to TEXT migration..."

if docker exec dadm-postgres psql -U camunda -d camunda -f /docker-entrypoint-initdb.d/01-fix-varchar-limits.sql; then
    echo "✅ Migration completed successfully!"
    
    echo ""
    echo "=== Verification ==="
    echo "Checking current column types..."
    docker exec dadm-postgres psql -U camunda -d camunda -c "
        SELECT 
            table_name,
            column_name,
            data_type,
            character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'act_%'
        AND (column_name LIKE '%text%' OR column_name = 'description_')
        ORDER BY table_name, column_name;"
    
    echo ""
    echo "✅ DADM PostgreSQL schema migration completed!"
    echo "You can now process large AI responses without VARCHAR(4000) limitations."
    
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
