#!/bin/bash
# Monitor Service Control Script
# This script helps start and stop the DADM service monitor

usage() {
    echo "Usage: ./monitor.sh [start|stop|status] [options]"
    echo ""
    echo "Commands:"
    echo "  start       Start the monitor service"
    echo "  stop        Stop the monitor service"
    echo "  status      Check if the monitor service is running"
    echo ""
    echo "Options (for start):"
    echo "  --interval=N    Check interval in seconds (default: 60)"
    echo "  --service=X/Y   Monitor specific service type/name (can be used multiple times)"
    echo ""
    echo "Examples:"
    echo "  ./monitor.sh start"
    echo "  ./monitor.sh start --interval=30"
    echo "  ./monitor.sh start --service=assistant/openai --service=test/echo"
    echo "  ./monitor.sh stop"
    echo "  ./monitor.sh status"
}

start_monitor() {
    interval=60
    services=""
    
    # Parse options
    for arg in "$@"; do
        if [[ $arg == --interval=* ]]; then
            interval="${arg#*=}"
        elif [[ $arg == --service=* ]]; then
            if [ -z "$services" ]; then
                services="${arg#*=}"
            else
                services="$services ${arg#*=}"
            fi
        else
            echo "Unknown option: $arg"
        fi
    done
    
    echo "Starting DADM service monitor..."
    
    # Ensure logs directory exists
    logs_dir="$(dirname "$(dirname "$0")")/logs/monitors"
    mkdir -p "$logs_dir"
    
    if [ -n "$services" ]; then
        echo "Starting monitor for specific services: $services"
        nohup python scripts/service_monitor.py --interval "$interval" --services $services > /dev/null 2>&1 &
    else
        echo "Starting monitor with $interval second interval for all services"
        nohup python scripts/service_monitor.py --interval "$interval" > /dev/null 2>&1 &
    fi
    
    echo "Monitor service started in background (PID: $!). Check $logs_dir/service_monitor.log for activity."
}

stop_monitor() {
    echo "Stopping DADM service monitor..."
    pids=$(pgrep -f "python.*service_monitor.py" || echo "")
    
    if [ -z "$pids" ]; then
        echo "No monitor service processes found."
    else
        for pid in $pids; do
            echo "Stopping process $pid"
            kill "$pid" 2>/dev/null
        done
        echo "Monitor service stopped."
    fi
}

check_status() {
    echo "Checking monitor service status..."
    pids=$(pgrep -f "python.*service_monitor.py" || echo "")
    
    if [ -z "$pids" ]; then
        echo "Monitor service is not running."
    else
        for pid in $pids; do
            echo "Monitor service is running (PID: $pid)"
        done
    fi
}

# Main command parsing
case "$1" in
    start)
        shift
        start_monitor "$@"
        ;;
    stop)
        stop_monitor
        ;;
    status)
        check_status
        ;;
    *)
        usage
        ;;
esac