#!/bin/bash

# DADM Database Rebuild Tool
# ==========================
# 
# This script provides a convenient wrapper around the database_rebuild.py tool
# for common database operations.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Function to print colored output
print_status() {
    local message="$1"
    local type="${2:-info}"
    
    case $type in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "info")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        *)
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Function to show usage
show_usage() {
    echo "DADM Database Rebuild Tool"
    echo "=========================="
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  rebuild [env]     - Rebuild database from scratch (default: dev)"
    echo "  backup [env]      - Create database backup (default: dev)"
    echo "  restore [file]    - Restore database from backup file"
    echo "  seed [env]        - Create seed data (default: dev)"
    echo "  verify [env]      - Verify database health (default: dev)"
    echo "  help              - Show this help message"
    echo ""
    echo "Environments:"
    echo "  dev               - Development environment (default)"
    echo "  staging           - Staging environment"
    echo "  prod              - Production environment"
    echo ""
    echo "Examples:"
    echo "  $0 rebuild                    # Rebuild dev database"
    echo "  $0 rebuild prod               # Rebuild production database"
    echo "  $0 backup dev                 # Backup dev database"
    echo "  $0 restore backup.sql         # Restore from backup file"
    echo "  $0 verify prod                # Verify production database"
    echo ""
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_status "Docker is not running. Please start Docker first." "error"
        exit 1
    fi
}

# Function to check if PostgreSQL container is running
check_postgres_container() {
    local env="${1:-dev}"
    local container_name="dadm-postgres"
    
    if [ "$env" = "staging" ]; then
        container_name="dadm-postgres-staging"
    elif [ "$env" = "prod" ]; then
        container_name="dadm-postgres-prod"
    fi
    
    if ! docker ps --format "table {{.Names}}" | grep -q "^$container_name$"; then
        print_status "PostgreSQL container '$container_name' is not running." "error"
        print_status "Please start the container first or adjust the environment." "info"
        exit 1
    fi
}

# Function to run the Python rebuild tool
run_rebuild_tool() {
    local action="$1"
    local env="${2:-dev}"
    local extra_args=("${@:3}")
    
    cd "$PROJECT_ROOT"
    
    # Check if Python script exists
    if [ ! -f "scripts/database_rebuild.py" ]; then
        print_status "Database rebuild script not found!" "error"
        exit 1
    fi
    
    # Run the Python script
    python3 "scripts/database_rebuild.py" --action "$action" --environment "$env" "${extra_args[@]}"
}

# Function to create a quick backup before dangerous operations
create_safety_backup() {
    local env="$1"
    
    print_status "Creating safety backup before operation..." "info"
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="backups/database/safety_backup_${env}_${timestamp}.sql"
    
    mkdir -p "backups/database"
    
    run_rebuild_tool "backup" "$env" --output "$backup_file"
    
    print_status "Safety backup created: $backup_file" "success"
}

# Function to show database status
show_database_status() {
    local env="${1:-dev}"
    
    print_status "Database Status for Environment: $env" "info"
    echo "======================================"
    
    run_rebuild_tool "verify" "$env"
}

# Main script logic
main() {
    local command="${1:-help}"
    
    case $command in
        "rebuild")
            local env="${2:-dev}"
            
            print_status "Starting database rebuild for environment: $env" "info"
            
            # Confirm for production
            if [ "$env" = "prod" ]; then
                echo -e "${YELLOW}⚠️  WARNING: You are about to rebuild the PRODUCTION database!${NC}"
                echo -n "Are you sure you want to continue? (yes/no): "
                read -r confirm
                if [ "$confirm" != "yes" ]; then
                    print_status "Operation cancelled." "info"
                    exit 0
                fi
            fi
            
            check_docker
            check_postgres_container "$env"
            
            # Create safety backup for non-dev environments
            if [ "$env" != "dev" ]; then
                create_safety_backup "$env"
            fi
            
            run_rebuild_tool "rebuild" "$env"
            ;;
            
        "backup")
            local env="${2:-dev}"
            
            print_status "Creating backup for environment: $env" "info"
            
            check_docker
            check_postgres_container "$env"
            
            run_rebuild_tool "backup" "$env"
            ;;
            
        "restore")
            local backup_file="$2"
            local env="${3:-dev}"
            
            if [ -z "$backup_file" ]; then
                print_status "Backup file is required for restore operation." "error"
                echo "Usage: $0 restore <backup_file> [environment]"
                exit 1
            fi
            
            if [ ! -f "$backup_file" ]; then
                print_status "Backup file not found: $backup_file" "error"
                exit 1
            fi
            
            print_status "Restoring database from: $backup_file" "info"
            
            # Confirm for production
            if [ "$env" = "prod" ]; then
                echo -e "${YELLOW}⚠️  WARNING: You are about to restore the PRODUCTION database!${NC}"
                echo -n "Are you sure you want to continue? (yes/no): "
                read -r confirm
                if [ "$confirm" != "yes" ]; then
                    print_status "Operation cancelled." "info"
                    exit 0
                fi
            fi
            
            check_docker
            check_postgres_container "$env"
            
            run_rebuild_tool "restore" "$env" --input "$backup_file"
            ;;
            
        "seed")
            local env="${2:-dev}"
            
            print_status "Creating seed data for environment: $env" "info"
            
            check_docker
            check_postgres_container "$env"
            
            run_rebuild_tool "seed" "$env"
            ;;
            
        "verify")
            local env="${2:-dev}"
            
            check_docker
            check_postgres_container "$env"
            
            show_database_status "$env"
            ;;
            
        "status")
            local env="${2:-dev}"
            show_database_status "$env"
            ;;
            
        "help"|"--help"|"-h")
            show_usage
            ;;
            
        *)
            print_status "Unknown command: $command" "error"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 