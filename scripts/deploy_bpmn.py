#!/usr/bin/env python3
"""
Camunda BPMN Model Deployment Script

This script deploys BPMN models from the camunda_models folder to a Camunda server.
It supports deploying a single model or all models in the folder.

Usage:
    python deploy_bpmn.py -m model_name.bpmn -s http://localhost:8080
    python deploy_bpmn.py --all -s http://localhost:8080
    python deploy_bpmn.py --list
    python deploy_bpmn.py --deploy model_name.bpmn -s http://localhost:8080
"""

import os
import sys
import argparse
import glob
from pathlib import Path
import requests
from colorama import init, Fore, Style

# Initialize colorama for colored terminal output
init()

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Deploy BPMN models to Camunda server')
    
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('-m', '--model', help='Name of the BPMN model to deploy')
    group.add_argument('-a', '--all', action='store_true', help='Deploy all BPMN models in the camunda_models folder')
    group.add_argument('-l', '--list', action='store_true', help='List all available BPMN models in the camunda_models folder')
    group.add_argument('-d', '--deploy', help='Deploy a BPMN model specified by its full filename')
    
    parser.add_argument('-s', '--server', default='http://localhost:8080', 
                        help='Camunda server URL (default: http://localhost:8080)')
    
    return parser.parse_args()

def get_model_path(model_name):
    """Get the full path of a model file."""
    # If the model name doesn't end with .bpmn, add it
    if not model_name.endswith('.bpmn'):
        model_name += '.bpmn'
    
    # Get the absolute path to the camunda_models folder
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)  # Go up one level to the project root
    models_dir = os.path.join(project_root, 'camunda_models')
    model_path = os.path.join(models_dir, model_name)
    
    return model_path

def get_all_models():
    """Get all BPMN models in the camunda_models folder."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)  # Go up one level to the project root
    models_dir = os.path.join(project_root, 'camunda_models')
    return glob.glob(os.path.join(models_dir, '*.bpmn'))

def deploy_model(model_path, server_url):
    """Deploy a BPMN model to Camunda server."""
    model_name = os.path.basename(model_path)
    deployment_name = Path(model_name).stem  # Get the filename without extension
    
    print(f"{Fore.CYAN}Deploying {model_name} to {server_url}...{Style.RESET_ALL}")
    
    # Check if the model file exists
    if not os.path.exists(model_path):
        print(f"{Fore.RED}Error: Model file not found: {model_path}{Style.RESET_ALL}")
        return False
    
    # Validate the BPMN file before deployment
    try:
        # Import the validator module (only when needed)
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from validate_bpmn import validate_bpmn_file
        
        print(f"{Fore.CYAN}Validating {model_name} before deployment...{Style.RESET_ALL}")
        if not validate_bpmn_file(model_path):
            print(f"{Fore.YELLOW}Warning: BPMN validation failed. Proceeding with deployment anyway.{Style.RESET_ALL}")
    except ImportError:
        print(f"{Fore.YELLOW}Warning: BPMN validator not available. Skipping validation.{Style.RESET_ALL}")
    
    # Prepare the API endpoint URL
    api_url = f"{server_url}/engine-rest/deployment/create"
    
    # Prepare the multipart form data
    with open(model_path, 'rb') as model_file:
        files = {
            'deployment-name': (None, deployment_name),
            'deploy-changed-only': (None, 'true'),
            'data': (model_name, model_file, 'text/xml')
        }
        
        try:
            # Send the POST request to deploy the model
            response = requests.post(api_url, files=files)
            
            if response.status_code == 200:
                result = response.json()
                print(f"{Fore.GREEN}Successfully deployed {model_name} (ID: {result.get('id')}){Style.RESET_ALL}")
                
                # Print deployed process definitions
                if 'deployedProcessDefinitions' in result and result['deployedProcessDefinitions']:
                    print(f"{Fore.CYAN}Deployed process definitions:{Style.RESET_ALL}")
                    for process_def_id, process_def in result['deployedProcessDefinitions'].items():
                        print(f"  - {process_def.get('name')} (Key: {process_def.get('key')}, Version: {process_def.get('version')}, ID: {process_def_id})")
                
                return True
            else:
                print(f"{Fore.RED}Error deploying {model_name}: {response.status_code} {response.text}{Style.RESET_ALL}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"{Fore.RED}Error connecting to Camunda server: {e}{Style.RESET_ALL}")
            return False

def main():
    """Main function to handle model deployment."""
    args = parse_arguments()
    
    # Handle the --list option
    if args.list:
        model_paths = get_all_models()
        if not model_paths:
            print(f"{Fore.YELLOW}No BPMN models found in the camunda_models folder.{Style.RESET_ALL}")
            return
            
        print(f"{Fore.CYAN}Available BPMN models in the camunda_models folder:{Style.RESET_ALL}")
        for i, model_path in enumerate(model_paths, 1):
            model_name = os.path.basename(model_path)
            print(f"  {i}. {model_name}")
        return
    
    # Ensure server URL is formatted correctly
    server_url = args.server
    if not server_url.startswith('http'):
        server_url = f"http://{server_url}"
    
    # Remove trailing slash if present
    server_url = server_url.rstrip('/')
    
    # Check if server is reachable
    try:
        requests.head(server_url, timeout=5)
    except requests.exceptions.RequestException:
        print(f"{Fore.RED}Error: Cannot connect to Camunda server at {server_url}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Make sure the server is running and the URL is correct.{Style.RESET_ALL}")
        return
    
    success_count = 0
    failure_count = 0
    
    if args.all:
        # Deploy all models
        model_paths = get_all_models()
        
        if not model_paths:
            print(f"{Fore.YELLOW}No BPMN models found in the camunda_models folder.{Style.RESET_ALL}")
            return
        
        print(f"{Fore.CYAN}Found {len(model_paths)} BPMN models to deploy.{Style.RESET_ALL}")
        
        for model_path in model_paths:            
            if deploy_model(model_path, server_url):
                success_count += 1
            else:
                failure_count += 1
                
    elif args.deploy:
        # Deploy a model specified by its full filename
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        models_dir = os.path.join(project_root, 'camunda_models')
        model_path = os.path.join(models_dir, args.deploy)
        if not os.path.exists(model_path):
            print(f"{Fore.RED}Error: Model file not found: {args.deploy}{Style.RESET_ALL}")
            return
            
        if deploy_model(model_path, server_url):
            success_count += 1
        else:
            failure_count += 1
    else:
        # Deploy a single model by name
        model_path = get_model_path(args.model)
        
        if deploy_model(model_path, server_url):
            success_count += 1
        else:
            failure_count += 1
      # Print summary
    print(f"\n{Fore.CYAN}Deployment Summary:{Style.RESET_ALL}")
    print(f"  - Successfully deployed: {Fore.GREEN}{success_count}{Style.RESET_ALL}")
    
    if failure_count > 0:
        print(f"  - Failed deployments: {Fore.RED}{failure_count}{Style.RESET_ALL}")

if __name__ == "__main__":
    main()
