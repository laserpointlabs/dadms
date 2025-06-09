#!/bin/bash
# View logs from all DADM services and components

# Determine project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$PROJECT_ROOT/logs"

usage() {
    echo "Usage: $0 [options]"
    echo
    echo "Options:"
    echo "  -t, --type TYPE     View logs for a specific type (services, monitors, processes)"
    echo "  -n, --name NAME     View a specific log file by name (e.g., service_monitor)"
    echo "  -f, --follow        Follow the log file(s) (like tail -f)"
    echo "  -l, --lines LINES   Number of lines to show (default: 10)"
    echo "  -a, --all           Show all lines, not just the most recent"
    echo "  -h, --help          Display this help message"
    echo
    echo "Examples:"
    echo "  $0                           # List all available log files"
    echo "  $0 --type services           # List service log files"
    echo "  $0 --name service_monitor    # Show service_monitor.log"
    echo "  $0 --name service_monitor -f # Follow service_monitor.log"
    echo
}

list_log_files() {
    local type="$1"
    local target_dir=""
    
    if [ -n "$type" ]; then
        target_dir="$LOGS_DIR/$type"
        if [ ! -d "$target_dir" ]; then
            echo "Error: Log type directory '$type' not found"
            return 1
        fi
    else
        target_dir="$LOGS_DIR"
    fi
    
    echo "Available log files:"
    
    # Find log files in the target directory and subdirectories
    find "$target_dir" -type f -name "*.log" | sort | while read -r log_file; do
        # Get relative path from logs dir
        local rel_path="${log_file#$LOGS_DIR/}"
        # Get file size in human-readable format
        local size=$(du -h "$log_file" | cut -f1)
        # Get last modified time
        local mod_time=$(stat -c %y "$log_file" 2>/dev/null || stat -f "%Sm" "$log_file" 2>/dev/null)
        
        echo "  $rel_path ($size, last modified: $mod_time)"
    done
}

view_log_file() {
    local name="$1"
    local follow="$2"
    local lines="$3"
    local all="$4"
    
    # Find the log file
    log_file=$(find "$LOGS_DIR" -type f -name "*${name}*.log" | head -n 1)
    
    if [ -z "$log_file" ]; then
        echo "Error: No log file found matching '$name'"
        echo "Available log files:"
        list_log_files
        return 1
    fi
    
    echo "Viewing log file: $log_file"
    echo "----------------------------------------"
    
    # View the log file
    if [ "$follow" = "true" ]; then
        if [ "$all" = "true" ]; then
            tail -n +1 -f "$log_file"
        else
            tail -n "$lines" -f "$log_file"
        fi
    else
        if [ "$all" = "true" ]; then
            cat "$log_file"
        else
            tail -n "$lines" "$log_file"
        fi
    fi
}

# Parse command line arguments
TYPE=""
NAME=""
FOLLOW="false"
LINES="10"
ALL="false"

while [[ $# -gt 0 ]]; do
    case "$1" in
        -t|--type)
            TYPE="$2"
            shift 2
            ;;
        -n|--name)
            NAME="$2"
            shift 2
            ;;
        -f|--follow)
            FOLLOW="true"
            shift
            ;;
        -l|--lines)
            LINES="$2"
            shift 2
            ;;
        -a|--all)
            ALL="true"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Ensure logs directory exists
if [ ! -d "$LOGS_DIR" ]; then
    echo "Logs directory not found. Creating logs directory structure..."
    python "$SCRIPT_DIR/setup_logs_directory.py"
fi

# If a specific log name is provided, view that log
if [ -n "$NAME" ]; then
    view_log_file "$NAME" "$FOLLOW" "$LINES" "$ALL"
else
    # Otherwise, list available logs
    list_log_files "$TYPE"
fi