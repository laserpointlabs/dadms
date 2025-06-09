"""
Assistant Monitor for DADM

This script monitors the OpenAI assistant ID to ensure consistency between
the stored ID and the service's active ID.
"""
import os
import sys
import time
import json
import logging
import requests
from pathlib import Path
from datetime import datetime

# Set up log directory
project_root = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
logs_dir = os.path.join(project_root, "logs", "monitors")
Path(logs_dir).mkdir(parents=True, exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(logs_dir, "assistant_monitor.log")),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("assistant_monitor")