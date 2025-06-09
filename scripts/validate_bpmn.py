"""
BPMN Validator Script

This script validates BPMN files for common issues before deployment
to Camunda, helping identify problems early.
"""
import os
import sys
import argparse
import xml.etree.ElementTree as ET
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("bpmn_validator")

# Get the project root
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Define BPMN namespaces
NAMESPACES = {
    'bpmn': 'http://www.omg.org/spec/BPMN/20100524/MODEL',
    'camunda': 'http://camunda.org/schema/1.0/bpmn'
}

def validate_service_tasks(bpmn_path):
    """Validate that service tasks have proper implementation attributes"""
    issues = []
    warnings = []
    
    try:
        # Parse the BPMN file
        tree = ET.parse(bpmn_path)
        root = tree.getroot()
        
        # Register namespaces for XPath
        for prefix, uri in NAMESPACES.items():
            ET.register_namespace(prefix, uri)
        
        # Find all service tasks
        service_tasks = root.findall('.//{%s}serviceTask' % NAMESPACES['bpmn'])
        
        for service_task in service_tasks:
            task_id = service_task.get('id', 'unknown')
            task_name = service_task.get('name', task_id)
            
            # Check for required implementation attributes
            has_class = service_task.get('class') is not None
            has_expression = service_task.get('expression') is not None
            has_delegate_expression = service_task.get('delegateExpression') is not None
            
            camunda_type = service_task.get('{%s}type' % NAMESPACES['camunda'])
            has_type = camunda_type is not None
            
            # For external tasks, check for topic
            if camunda_type == 'external':
                topic = service_task.get('{%s}topic' % NAMESPACES['camunda'])
                if topic is None:
                    issues.append(f"Service task '{task_name}' has type='external' but no 'camunda:topic' attribute")
            
            # Check if any implementation attribute is present
            if not any([has_class, has_expression, has_delegate_expression, has_type]):
                issues.append(f"Service task '{task_name}' is missing an implementation attribute (class, delegateExpression, expression, or type)")
            
            # Check for DADM service properties
            # Find all properties under this service task
            properties_elem = service_task.find('.//{%s}properties' % NAMESPACES['camunda'])
            if properties_elem is not None:
                properties = properties_elem.findall('.//{%s}property' % NAMESPACES['camunda'])
                
                # Check for service.type and service.name
                has_service_type = False
                has_service_name = False
                
                for prop in properties:
                    prop_name = prop.get('name', '')
                    if prop_name == 'service.type':
                        has_service_type = True
                    elif prop_name == 'service.name':
                        has_service_name = True
                
                if not has_service_type and not has_service_name:
                    warnings.append(f"Service task '{task_name}' does not have DADM service properties (service.type, service.name)")
                elif not has_service_type:
                    warnings.append(f"Service task '{task_name}' is missing 'service.type' property")
                elif not has_service_name:
                    warnings.append(f"Service task '{task_name}' is missing 'service.name' property")
    
    except Exception as e:
        issues.append(f"Error parsing BPMN file: {str(e)}")
    
    return issues, warnings

def validate_bpmn_file(bpmn_path):
    """Validate a single BPMN file"""
    logger.info(f"Validating {os.path.basename(bpmn_path)}...")
    
    issues = []
    warnings = []
    
    # Validate service tasks
    service_task_issues, service_task_warnings = validate_service_tasks(bpmn_path)
    issues.extend(service_task_issues)
    warnings.extend(service_task_warnings)
    
    # Add more validation rules here as needed
    
    # Report results
    if not issues and not warnings:
        logger.info(f"✓ {os.path.basename(bpmn_path)} is valid")
        return True
    
    if issues:
        logger.error(f"✗ {os.path.basename(bpmn_path)} has {len(issues)} issues:")
        for issue in issues:
            logger.error(f"  - {issue}")
    
    if warnings:
        logger.warning(f"⚠ {os.path.basename(bpmn_path)} has {len(warnings)} warnings:")
        for warning in warnings:
            logger.warning(f"  - {warning}")
    
    return len(issues) == 0

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Validate BPMN files for Camunda deployment")
    parser.add_argument("-m", "--model", help="Path to specific BPMN file to validate")
    parser.add_argument("-a", "--all", action="store_true", help="Validate all BPMN models in the models directory")
    parser.add_argument("-d", "--directory", default=os.path.join(project_root, "camunda_models"),
                       help="Directory containing BPMN models")
    args = parser.parse_args()
    
    # Track validation results
    valid_count = 0
    invalid_count = 0
    
    if args.model:
        # Validate a specific model
        bpmn_path = args.model
        if not os.path.exists(bpmn_path):
            logger.error(f"BPMN file not found: {bpmn_path}")
            return 1
        
        if validate_bpmn_file(bpmn_path):
            valid_count += 1
        else:
            invalid_count += 1
    
    elif args.all:
        # Validate all models in the models directory
        models_dir = args.directory
        if not os.path.isdir(models_dir):
            logger.error(f"Models directory not found: {models_dir}")
            return 1
        
        bpmn_files = list(Path(models_dir).glob("*.bpmn"))
        
        if not bpmn_files:
            logger.warning(f"No BPMN files found in {models_dir}")
            return 0
        
        logger.info(f"Found {len(bpmn_files)} BPMN files to validate.")
        
        for bpmn_path in bpmn_files:
            if validate_bpmn_file(bpmn_path):
                valid_count += 1
            else:
                invalid_count += 1
    
    else:
        parser.print_help()
        return 0
    
    # Print summary
    logger.info("\n=== Validation Summary ===")
    logger.info(f"Valid BPMN files: {valid_count}")
    logger.info(f"Invalid BPMN files: {invalid_count}")
    
    return 1 if invalid_count > 0 else 0

if __name__ == "__main__":
    sys.exit(main())