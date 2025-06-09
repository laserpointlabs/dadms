#!/usr/bin/env python3
"""
BPMN History TTL Fixer

This script adds the historyTimeToLive attribute to all BPMN process definitions
in the camunda_models directory. This is required by Camunda for history cleanup.

Usage:
    python fix_bpmn_ttl.py
"""

import os
import glob
import re
import sys
from colorama import init, Fore, Style

# Initialize colorama for colored terminal output
init()

def find_bpmn_files():
    """Find all BPMN files in the camunda_models directory."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)  # Go up one level to the project root
    models_dir = os.path.join(project_root, 'camunda_models')
    return glob.glob(os.path.join(models_dir, '*.bpmn'))

def add_history_ttl(file_path, ttl_days=30):
    """Add historyTimeToLive attribute to the process element in a BPMN file."""
    print(f"{Fore.CYAN}Processing {os.path.basename(file_path)}...{Style.RESET_ALL}")
    
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Check if historyTimeToLive is already set
    if 'historyTimeToLive' in content:
        print(f"{Fore.YELLOW}historyTimeToLive already exists in {os.path.basename(file_path)}{Style.RESET_ALL}")
        return False
    
    # Pattern to match the bpmn:process element and add the historyTimeToLive attribute
    pattern = r'(<bpmn:process\s+id="[^"]+"\s+name="[^"]+"\s+isExecutable="[^"]+")(\s*>)'
    replacement = r'\1 camunda:historyTimeToLive="' + str(ttl_days) + r'"\2'
    
    # Apply the replacement
    updated_content = re.sub(pattern, replacement, content)
    
    # Check if the content changed (i.e., if the pattern was found and replaced)
    if updated_content == content:
        # Try an alternative pattern without the name attribute (some BPMN files might not have it)
        alt_pattern = r'(<bpmn:process\s+id="[^"]+"\s+isExecutable="[^"]+")(\s*>)'
        updated_content = re.sub(alt_pattern, replacement, content)
        
        # If still no change, try a more generic pattern
        if updated_content == content:
            generic_pattern = r'(<bpmn:process\s+[^>]+)(\s*>)'
            updated_content = re.sub(generic_pattern, r'\1 camunda:historyTimeToLive="' + str(ttl_days) + r'"\2', content)
            
            # If still no change, the pattern wasn't found
            if updated_content == content:
                print(f"{Fore.RED}Could not find bpmn:process element in {os.path.basename(file_path)}{Style.RESET_ALL}")
                return False
    
    # Write the updated content back to the file
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(updated_content)
    
    print(f"{Fore.GREEN}Added historyTimeToLive={ttl_days} to {os.path.basename(file_path)}{Style.RESET_ALL}")
    return True

def main():
    """Main function to add historyTimeToLive to all BPMN files."""
    bpmn_files = find_bpmn_files()
    
    if not bpmn_files:
        print(f"{Fore.YELLOW}No BPMN files found in the camunda_models directory.{Style.RESET_ALL}")
        return
    
    print(f"{Fore.CYAN}Found {len(bpmn_files)} BPMN files to process.{Style.RESET_ALL}")
    
    success_count = 0
    failure_count = 0
    skip_count = 0
    
    for file_path in bpmn_files:
        result = add_history_ttl(file_path)
        if result is True:
            success_count += 1
        elif result is False:
            skip_count += 1
        else:
            failure_count += 1
    
    # Print summary
    print(f"\n{Fore.CYAN}Processing Summary:{Style.RESET_ALL}")
    print(f"  - Successfully updated: {Fore.GREEN}{success_count}{Style.RESET_ALL}")
    print(f"  - Skipped (already had TTL): {Fore.YELLOW}{skip_count}{Style.RESET_ALL}")
    
    if failure_count > 0:
        print(f"  - Failed updates: {Fore.RED}{failure_count}{Style.RESET_ALL}")
    
    print(f"\n{Fore.CYAN}Next Steps:{Style.RESET_ALL}")
    print(f"Now you can deploy your BPMN models using:")
    print(f"{Fore.WHITE}python scripts/deploy_bpmn.py -m <model_name> -s http://localhost:8080{Style.RESET_ALL}")
    print(f"or deploy all models at once:")
    print(f"{Fore.WHITE}python scripts/deploy_bpmn.py -a -s http://localhost:8080{Style.RESET_ALL}")

if __name__ == "__main__":
    main()
