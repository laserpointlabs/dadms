#!/usr/bin/env python3
"""
BPMN Element Ordering Fix Script

This script fixes XML element ordering issues in BPMN files according to the BPMN 2.0 schema.
The main issue is that extensionElements are placed in the wrong order, causing schema validation errors.

According to BPMN 2.0 schema:
- For start events: incoming/outgoing flows should come before extensionElements
- For service tasks: incoming/outgoing flows should come before extensionElements  
- For user tasks: incoming/outgoing flows should come before extensionElements
- For end events: incoming/outgoing flows should come before extensionElements

Usage:
    python fix_bpmn_ordering.py [--dry-run]
"""

import os
import glob
import re
import sys
import argparse
from pathlib import Path
import xml.etree.ElementTree as ET
from colorama import init, Fore, Style

# Initialize colorama for colored terminal output
init()

def find_bpmn_files():
    """Find all BPMN files in the camunda_models directory."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)  # Go up one level to the project root
    models_dir = os.path.join(project_root, 'camunda_models')
    return glob.glob(os.path.join(models_dir, '*.bpmn'))

def fix_element_ordering(file_path, dry_run=False):
    """Fix XML element ordering in a BPMN file."""
    print(f"{Fore.CYAN}Processing {os.path.basename(file_path)}...{Style.RESET_ALL}")
    
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    original_content = content
    changes_made = False
    
    # Define patterns to fix element ordering
    # According to BPMN schema, the correct order for most elements is:
    # 1. extensionElements (if present)
    # 2. incoming flows  
    # 3. outgoing flows
    # 4. other specific elements
    
    fixes = [
        # Fix service tasks: move extensionElements before incoming/outgoing
        {
            'pattern': r'(<bpmn:serviceTask[^>]*>)(\s*<bpmn:incoming>.*?</bpmn:incoming>)(\s*<bpmn:outgoing>.*?</bpmn:outgoing>)(\s*<bpmn:extensionElements>.*?</bpmn:extensionElements>)',
            'replacement': r'\1\4\2\3',
            'description': 'Moving extensionElements before flows in service task'
        },
        
        # Fix service tasks: move extensionElements before outgoing (no incoming)
        {
            'pattern': r'(<bpmn:serviceTask[^>]*>)(\s*<bpmn:outgoing>.*?</bpmn:outgoing>)(\s*<bpmn:extensionElements>.*?</bpmn:extensionElements>)',
            'replacement': r'\1\3\2',
            'description': 'Moving extensionElements before outgoing in service task'
        },
        
        # Fix service tasks: move extensionElements before incoming (no outgoing)
        {
            'pattern': r'(<bpmn:serviceTask[^>]*>)(\s*<bpmn:incoming>.*?</bpmn:incoming>)(\s*<bpmn:extensionElements>.*?</bpmn:extensionElements>)',
            'replacement': r'\1\3\2',
            'description': 'Moving extensionElements before incoming in service task'
        },
        
        # Fix user tasks: move extensionElements before incoming/outgoing
        {
            'pattern': r'(<bpmn:userTask[^>]*>)(\s*<bpmn:incoming>.*?</bpmn:incoming>)(\s*<bpmn:outgoing>.*?</bpmn:outgoing>)(\s*<bpmn:extensionElements>.*?</bpmn:extensionElements>)',
            'replacement': r'\1\4\2\3',
            'description': 'Moving extensionElements before flows in user task'
        },
        
        # Fix user tasks: move extensionElements before outgoing (no incoming)
        {
            'pattern': r'(<bpmn:userTask[^>]*>)(\s*<bpmn:outgoing>.*?</bpmn:outgoing>)(\s*<bpmn:extensionElements>.*?</bpmn:extensionElements>)',
            'replacement': r'\1\3\2',
            'description': 'Moving extensionElements before outgoing in user task'
        },
        
        # Fix start events: move extensionElements before outgoing
        {
            'pattern': r'(<bpmn:startEvent[^>]*>)(\s*<bpmn:outgoing>.*?</bpmn:outgoing>)(\s*<bpmn:extensionElements>.*?</bpmn:extensionElements>)',
            'replacement': r'\1\3\2',
            'description': 'Moving extensionElements before outgoing in start event'
        },
        
        # Fix end events: move extensionElements before incoming
        {
            'pattern': r'(<bpmn:endEvent[^>]*>)(\s*<bpmn:incoming>.*?</bpmn:incoming>)(\s*<bpmn:extensionElements>.*?</bpmn:extensionElements>)',
            'replacement': r'\1\3\2',
            'description': 'Moving extensionElements before incoming in end event'
        }
    ]
    
    # Apply fixes
    for fix in fixes:
        matches = re.findall(fix['pattern'], content, re.DOTALL)
        if matches:
            print(f"{Fore.YELLOW}  → {fix['description']}{Style.RESET_ALL}")
            content = re.sub(fix['pattern'], fix['replacement'], content, flags=re.DOTALL)
            changes_made = True
    
    if changes_made:
        if not dry_run:
            # Create backup
            backup_path = f"{file_path}.backup"
            with open(backup_path, 'w', encoding='utf-8') as backup_file:
                backup_file.write(original_content)
            print(f"{Fore.GREEN}  ✓ Created backup: {backup_path}{Style.RESET_ALL}")
            
            # Write fixed content
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(content)
            print(f"{Fore.GREEN}  ✓ Fixed element ordering in {os.path.basename(file_path)}{Style.RESET_ALL}")
        else:
            print(f"{Fore.YELLOW}  → Would fix element ordering in {os.path.basename(file_path)} (dry run){Style.RESET_ALL}")
        return True
    else:
        print(f"{Fore.GREEN}  ✓ No ordering issues found in {os.path.basename(file_path)}{Style.RESET_ALL}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Fix BPMN element ordering issues')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Show what would be changed without making actual changes')
    args = parser.parse_args()
    
    print(f"{Fore.CYAN}🔧 BPMN Element Ordering Fixer{Style.RESET_ALL}")
    print(f"{Fore.CYAN}================================{Style.RESET_ALL}")
    
    if args.dry_run:
        print(f"{Fore.YELLOW}Running in DRY RUN mode - no files will be modified{Style.RESET_ALL}")
        print()
    
    bpmn_files = find_bpmn_files()
    
    if not bpmn_files:
        print(f"{Fore.RED}No BPMN files found in camunda_models directory{Style.RESET_ALL}")
        return 1
    
    print(f"Found {len(bpmn_files)} BPMN files to process:")
    for file_path in bpmn_files:
        print(f"  - {os.path.basename(file_path)}")
    print()
    
    total_fixed = 0
    for file_path in bpmn_files:
        if fix_element_ordering(file_path, dry_run=args.dry_run):
            total_fixed += 1
        print()
    
    print(f"{Fore.CYAN}Summary:{Style.RESET_ALL}")
    print(f"  Files processed: {len(bpmn_files)}")
    print(f"  Files {'that would be ' if args.dry_run else ''}fixed: {total_fixed}")
    
    if args.dry_run:
        print(f"\n{Fore.YELLOW}To apply these fixes, run without --dry-run{Style.RESET_ALL}")
    elif total_fixed > 0:
        print(f"\n{Fore.GREEN}✓ BPMN element ordering has been fixed!{Style.RESET_ALL}")
        print(f"{Fore.GREEN}Backup files created with .backup extension{Style.RESET_ALL}")
    else:
        print(f"\n{Fore.GREEN}✓ All BPMN files already have correct element ordering{Style.RESET_ALL}")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
