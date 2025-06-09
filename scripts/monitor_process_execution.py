#!/usr/bin/env python3
"""
Process Execution Monitor

This script monitors the execution of BPMN processes in Camunda, focusing on external tasks and their processing status.
It's useful for debugging and analyzing process execution flow.
"""

import sys
import os
import json
import time
import argparse
import requests
from datetime import datetime
from tabulate import tabulate

# Add the project root to the Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from config import camunda_config

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Monitor process execution in Camunda')
    parser.add_argument('-p', '--process-instance', help='Process instance ID to monitor')
    parser.add_argument('-i', '--interval', type=int, default=5, help='Polling interval in seconds (default: 5)')
    parser.add_argument('-c', '--count', type=int, default=0, help='Number of poll iterations (0 for continuous)')
    parser.add_argument('-v', '--verbose', action='store_true', help='Show detailed information')
    return parser.parse_args()

def get_process_instances(process_definition_id=None):
    """Get all active process instances, optionally filtered by process definition ID"""
    base_url = camunda_config.CAMUNDA_ENGINE_URL
    if not base_url.endswith('/'):
        base_url += '/'
    
    url = f"{base_url}process-instance"
    if process_definition_id:
        url += f"?processDefinitionId={process_definition_id}"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error getting process instances: {str(e)}")
    
    return []

def get_external_tasks(process_instance_id=None):
    """Get all active external tasks, optionally filtered by process instance ID"""
    base_url = camunda_config.CAMUNDA_ENGINE_URL
    if not base_url.endswith('/'):
        base_url += '/'
    
    url = f"{base_url}external-task"
    if process_instance_id:
        url += f"?processInstanceId={process_instance_id}"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error getting external tasks: {str(e)}")
    
    return []

def get_activity_instances(process_instance_id):
    """Get activity instances for a process instance"""
    base_url = camunda_config.CAMUNDA_ENGINE_URL
    if not base_url.endswith('/'):
        base_url += '/'
    
    url = f"{base_url}process-instance/{process_instance_id}/activity-instances"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error getting activity instances: {str(e)}")
    
    return {}

def format_process_instance_info(process_instance):
    """Format process instance information for display"""
    return {
        "ID": process_instance.get("id"),
        "Process Definition ID": process_instance.get("definitionId"),
        "Business Key": process_instance.get("businessKey") or "(none)",
        "Ended": "Yes" if process_instance.get("ended") else "No",
        "Suspended": "Yes" if process_instance.get("suspended") else "No"
    }

def format_external_task_info(task):
    """Format external task information for display"""
    lock_expires = task.get("lockExpirationTime")
    if lock_expires:
        lock_time = datetime.strptime(lock_expires, "%Y-%m-%dT%H:%M:%S.%f%z")
        now = datetime.now().astimezone()
        locked = lock_time > now
    else:
        locked = False
    
    return {
        "ID": task.get("id"),
        "Topic": task.get("topicName"),
        "Activity": task.get("activityId"),
        "Worker": task.get("workerId") or "(none)",
        "Locked": "Yes" if locked else "No",
        "Retries": task.get("retries") or "N/A"
    }

def monitor_execution(process_instance_id=None, interval=5, count=0, verbose=False):
    """Monitor process execution"""
    iteration = 0
    
    while count == 0 or iteration < count:
        os.system('cls' if os.name == 'nt' else 'clear')
        print(f"\n{'=' * 80}")
        print(f"PROCESS EXECUTION MONITOR - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'=' * 80}")
        
        # Get process instances
        if process_instance_id:
            process_instances = [pi for pi in get_process_instances() if pi.get("id") == process_instance_id]
        else:
            process_instances = get_process_instances()
        
        # Get external tasks
        external_tasks = get_external_tasks(process_instance_id)
        
        # Display process instances
        if process_instances:
            pi_data = [format_process_instance_info(pi) for pi in process_instances]
            print("\nActive Process Instances:")
            print(tabulate(pi_data, headers="keys", tablefmt="grid"))
        else:
            print("\nNo active process instances found.")
        
        # Display external tasks
        if external_tasks:
            et_data = [format_external_task_info(task) for task in external_tasks]
            print("\nActive External Tasks:")
            print(tabulate(et_data, headers="keys", tablefmt="grid"))
        else:
            print("\nNo active external tasks found.")
        
        # Display detailed activity information if requested
        if verbose and process_instance_id:
            activity_instances = get_activity_instances(process_instance_id)
            if activity_instances:
                print("\nDetailed Activity Instances:")
                print(json.dumps(activity_instances, indent=2))
        
        # Check if we should continue
        if count == 0 or iteration < count - 1:
            print(f"\nRefreshing in {interval} seconds... (Press Ctrl+C to exit)")
            try:
                time.sleep(interval)
            except KeyboardInterrupt:
                print("\nMonitoring stopped by user.")
                break
        
        iteration += 1

def main():
    """Main function"""
    args = parse_arguments()
    
    print(f"Connecting to Camunda engine at: {camunda_config.CAMUNDA_ENGINE_URL}")
    print(f"Monitoring process execution...")
    
    try:
        monitor_execution(
            process_instance_id=args.process_instance,
            interval=args.interval,
            count=args.count,
            verbose=args.verbose
        )
    except KeyboardInterrupt:
        print("\nMonitoring stopped by user.")
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
