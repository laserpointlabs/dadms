"""
Script to enhance the deploy_bpmn.py script with validation

This script adds BPMN validation capabilities to the deploy_bpmn.py script
"""
import os
import sys

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import the validation functionality from validate_bpmn.py
from scripts.validate_bpmn import validate_bpmn_file

def validate_before_deployment(bpmn_path, skip_validation=False):
    """Validate a BPMN file before deployment"""
    if skip_validation:
        return True
        
    print(f"Validating {os.path.basename(bpmn_path)} before deployment...")
    return validate_bpmn_file(bpmn_path)