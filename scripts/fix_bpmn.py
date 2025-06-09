"""
BPMN Fixer Script

This script automatically fixes common issues in BPMN files, particularly
for service tasks that are missing required implementation attributes.
"""
import os
import sys
import argparse
import xml.etree.ElementTree as ET
from pathlib import Path
import logging
import re

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("bpmn_fixer")

# Get the project root
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Define BPMN namespaces
NAMESPACES = {
    'bpmn': 'http://www.omg.org/spec/BPMN/20100524/MODEL',
    'camunda': 'http://camunda.org/schema/1.0/bpmn'
}

def fix_service_tasks(bpmn_path, backup=True):
    """Fix service tasks that are missing implementation attributes"""
    
    # Create a backup if requested
    if backup:
        backup_path = f"{bpmn_path}.bak"
        logger.info(f"Creating backup at {backup_path}")
        import shutil
        shutil.copy2(bpmn_path, backup_path)
    
    try:
        # Parse the BPMN file
        tree = ET.parse(bpmn_path)
        root = tree.getroot()
        
        # Register namespaces for XPath
        for prefix, uri in NAMESPACES.items():
            ET.register_namespace(prefix, uri)
        
        changes_made = False
        
        # Find all service tasks
        service_tasks = root.findall('.//{%s}serviceTask' % NAMESPACES['bpmn'])
        
        for service_task in service_tasks:
            task_id = service_task.get('id', 'unknown')
            task_name = service_task.get('name', task_id)
            
            # Check for required implementation attributes
            has_class = service_task.get('class') is not None
            has_expression = service_task.get('expression') is not None
            has_delegate_expression = service_task.get('delegateExpression') is not None
            has_type = service_task.get('{%s}type' % NAMESPACES['camunda']) is not None
            
            # If no implementation attribute exists, add external task type and topic
            if not any([has_class, has_expression, has_delegate_expression, has_type]):
                logger.info(f"Adding 'external' implementation type to service task '{task_name}'")
                
                # Set the task type to external
                service_task.set('{%s}type' % NAMESPACES['camunda'], 'external')
                
                # Generate a topic name based on task ID
                topic_name = re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', task_id).lower()
                if not topic_name.endswith('_task') and not topic_name.endswith('task'):
                    topic_name += '_task'
                
                service_task.set('{%s}topic' % NAMESPACES['camunda'], topic_name)
                logger.info(f"Set topic for service task '{task_name}' to '{topic_name}'")
                
                changes_made = True
        
        if changes_made:
            # Save the modified BPMN file
            tree.write(bpmn_path, encoding='utf-8', xml_declaration=True)
            logger.info(f"Fixed service tasks in {bpmn_path}")
            return True
        else:
            logger.info(f"No changes needed for {bpmn_path}")
            return False
    
    except Exception as e:
        logger.error(f"Error fixing BPMN file: {str(e)}")
        return False

def fix_bpmn_file(bpmn_path, backup=True):
    """Fix a single BPMN file"""
    logger.info(f"Fixing {os.path.basename(bpmn_path)}...")
    
    changes_made = False
    
    # Fix service tasks
    if fix_service_tasks(bpmn_path, backup):
        changes_made = True
    
    # Add more fixes here as needed
    
    return changes_made

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Fix common issues in BPMN files")
    parser.add_argument("-m", "--model", help="Path to specific BPMN file to fix")
    parser.add_argument("-a", "--all", action="store_true", help="Fix all BPMN models in the models directory")
    parser.add_argument("-d", "--directory", default=os.path.join(project_root, "camunda_models"),
                       help="Directory containing BPMN models")
    parser.add_argument("--no-backup", action="store_true", help="Don't create backup files")
    args = parser.parse_args()
    
    # Track results
    fixed_count = 0
    skipped_count = 0
    error_count = 0
    
    if args.model:
        # Fix a specific model
        bpmn_path = args.model
        if not os.path.exists(bpmn_path):
            logger.error(f"BPMN file not found: {bpmn_path}")
            return 1
        
        if fix_bpmn_file(bpmn_path, not args.no_backup):
            fixed_count += 1
        else:
            skipped_count += 1
    
    elif args.all:
        # Fix all models in the models directory
        models_dir = args.directory
        if not os.path.isdir(models_dir):
            logger.error(f"Models directory not found: {models_dir}")
            return 1
        
        bpmn_files = list(Path(models_dir).glob("*.bpmn"))
        
        if not bpmn_files:
            logger.warning(f"No BPMN files found in {models_dir}")
            return 0
        
        logger.info(f"Found {len(bpmn_files)} BPMN files to fix.")
        
        for bpmn_path in bpmn_files:
            try:
                if fix_bpmn_file(bpmn_path, not args.no_backup):
                    fixed_count += 1
                else:
                    skipped_count += 1
            except Exception as e:
                logger.error(f"Error processing {bpmn_path}: {e}")
                error_count += 1
    
    else:
        parser.print_help()
        return 0
    
    # Print summary
    logger.info("\n=== Fix Summary ===")
    logger.info(f"BPMN files fixed: {fixed_count}")
    logger.info(f"BPMN files unchanged: {skipped_count}")
    if error_count > 0:
        logger.error(f"Errors encountered: {error_count}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())