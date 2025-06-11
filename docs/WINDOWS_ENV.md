# DADM Project Environment Configuration
# This file contains environment-specific settings for the DADM project

# Operating System: Windows
# Shell: PowerShell
# Python: Available via 'python' command

# Common PowerShell commands for this project:
# - Start services: docker-compose up -d
# - Stop services: docker-compose down
# - View logs: Get-Content logs\app_startup.log -Tail 10 -Wait
# - Run Python scripts: python .\scripts\script_name.py
# - Check processes: Get-Process | Where-Object {$_.ProcessName -like "*docker*"}

# Docker commands:
# - List containers: docker ps
# - View container logs: docker logs container_name
# - Execute in container: docker exec -it container_name powershell

# Service URLs (when running locally):
CAMUNDA_URL="http://localhost:8080"
OPENAI_SERVICE_URL="http://localhost:5001"
CONSUL_URL="http://localhost:8500"

# File paths use Windows backslash format:
# Example: c:\Users\JohnDeHart\Documents\dadm\src\app.py
