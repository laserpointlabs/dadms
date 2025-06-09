"""
Script to clean up top-level log files and move them to the logs directory

This script finds log files in the top-level directory and moves them to the
appropriate subdirectory in the logs directory.
"""
import os
import sys
import shutil
from pathlib import Path
from datetime import datetime

# Get the project root directory
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Define the logs directory and its subdirectories
logs_dir = os.path.join(project_root, "logs")
service_logs = os.path.join(logs_dir, "services")
monitor_logs = os.path.join(logs_dir, "monitors")
process_logs = os.path.join(logs_dir, "processes")

# Create logs directory structure if it doesn't exist
Path(logs_dir).mkdir(exist_ok=True)
Path(service_logs).mkdir(exist_ok=True)
Path(monitor_logs).mkdir(exist_ok=True)
Path(process_logs).mkdir(exist_ok=True)

# Define log file patterns and their target directories
log_patterns = {
    "service_": service_logs,
    "monitor": monitor_logs,
    "assistant_monitor": monitor_logs,
    "process_": process_logs,
    "camunda_": process_logs,
}

# Find and move log files
moved_files = 0
for file in os.listdir(project_root):
    # Skip if not a file
    file_path = os.path.join(project_root, file)
    if not os.path.isfile(file_path):
        continue
        
    # Skip if not a log file
    if not file.endswith(".log") and not file.endswith(".log.1"):
        continue
    
    # Determine the target directory based on the file name
    target_dir = None
    for pattern, directory in log_patterns.items():
        if pattern in file.lower():
            target_dir = directory
            break
    
    # If no specific pattern matches, put it in the main logs directory
    if target_dir is None:
        target_dir = logs_dir
    
    # Create a timestamp for backup if file already exists in target directory
    target_file = os.path.join(target_dir, file)
    if os.path.exists(target_file):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base, ext = os.path.splitext(file)
        if ext == '.1':  # Handle .log.1 files
            base, first_ext = os.path.splitext(base)
            target_file = os.path.join(target_dir, f"{base}_{timestamp}{first_ext}{ext}")
        else:
            target_file = os.path.join(target_dir, f"{base}_{timestamp}{ext}")
    
    # Move the file
    try:
        shutil.move(file_path, target_file)
        print(f"Moved: {file} → {target_file}")
        moved_files += 1
    except Exception as e:
        print(f"Error moving {file}: {e}")

print(f"\nSummary: Moved {moved_files} log files to the logs directory structure")
print(f"Log files are now organized in {logs_dir} with appropriate subdirectories")