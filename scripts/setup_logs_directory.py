"""
Create and organize the logs directory structure

This script ensures the logs directory exists and has the proper structure
"""
import os
import sys
from pathlib import Path

# Get the project root directory
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Define the logs directory
logs_dir = os.path.join(project_root, "logs")

# Create logs directory if it doesn't exist
Path(logs_dir).mkdir(exist_ok=True)

# Create subdirectories for different types of logs
service_logs = os.path.join(logs_dir, "services")
Path(service_logs).mkdir(exist_ok=True)

monitor_logs = os.path.join(logs_dir, "monitors")
Path(monitor_logs).mkdir(exist_ok=True)

process_logs = os.path.join(logs_dir, "processes")
Path(process_logs).mkdir(exist_ok=True)

# Create a .gitignore file to avoid committing logs
gitignore_path = os.path.join(logs_dir, ".gitignore")
if not os.path.exists(gitignore_path):
    with open(gitignore_path, 'w') as f:
        f.write("# Ignore all files in logs directory\n")
        f.write("*\n")
        f.write("# Except this .gitignore file\n")
        f.write("!.gitignore\n")
        f.write("# And except subdirectories\n")
        f.write("!*/\n")
        
print(f"Created logs directory structure at {logs_dir}")
print("Subdirectories:")
print(f"- {service_logs}")
print(f"- {monitor_logs}")
print(f"- {process_logs}")
print(f"Added .gitignore to prevent committing log files")