#!/bin/bash
# Camunda Startup Script with PostgreSQL Schema Migration
# This script waits for Camunda to initialize, then applies the VARCHAR fix

set -e

echo "=== DADM Camunda Container Startup ==="
echo "Waiting for PostgreSQL to be ready..."

# Wait for PostgreSQL to be available
/usr/local/bin/wait-for-it.sh dadm-postgres:5432 --timeout=60 --strict -- echo "PostgreSQL is ready"

echo "Starting Camunda Platform..."

# Set required environment variables for Camunda
export CATALINA_HOME="${CATALINA_HOME:-/camunda}"
export DB_DRIVER="${DB_DRIVER:-org.postgresql.Driver}"
export DB_URL="${DB_URL:-jdbc:postgresql://dadm-postgres:5432/camunda_db}"
export DB_USERNAME="${DB_USERNAME:-dadm_user}"
export DB_PASSWORD="${DB_PASSWORD:-dadm_password}"
export DEBUG="${DEBUG:-false}"
export JMX_PROMETHEUS="${JMX_PROMETHEUS:-false}"

# Start Camunda in the background using the proper startup script
/camunda/camunda.sh &
CAMUNDA_PID=$!

echo "Camunda started with PID: $CAMUNDA_PID"
echo "Waiting for Camunda to initialize database schema..."

# Wait for Camunda to create its tables (check for a core table)
attempts=0
max_attempts=60
while [ $attempts -lt $max_attempts ]; do
    if PGPASSWORD="$DB_PASSWORD" psql -h "$PGHOST" -U "$DB_USERNAME" -d "$PGDATABASE" -c "SELECT 1 FROM act_re_deployment LIMIT 1;" >/dev/null 2>&1; then
        echo "Camunda database schema detected!"
        break
    fi
    echo "Waiting for Camunda schema... attempt $((attempts + 1))/$max_attempts"
    sleep 5
    attempts=$((attempts + 1))
done

if [ $attempts -eq $max_attempts ]; then
    echo "WARNING: Timeout waiting for Camunda schema creation"
else
    echo "Applying VARCHAR(4000) to TEXT migration..."
    
    # Apply the schema migration
    if PGPASSWORD="$DB_PASSWORD" psql -h "$PGHOST" -U "$DB_USERNAME" -d "$PGDATABASE" -f /docker-entrypoint-initdb.d/01-fix-varchar-limits.sql; then
        echo "✅ Successfully applied VARCHAR(4000) to TEXT migration!"
    else
        echo "⚠️  Migration script encountered errors, but continuing..."
    fi
fi

echo "Camunda startup complete. Container will continue running..."

# Keep container running by waiting for Camunda process
wait $CAMUNDA_PID
