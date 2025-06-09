#!/usr/bin/env python
"""
Environment Variable Verification Script for DADM

This script checks that all required environment variables are set correctly 
for the DADM system, with a focus on OpenAI service and Consul integration.
"""
import os
import sys
import json
import requests
from typing import Dict, Any, List, Tuple

def print_section(title: str):
    """Print a section title with formatting"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

from typing import Optional

def check_env_var(var_name: str, required: bool = False, default: Optional[str] = None) -> Tuple[bool, Any]:
    """Check if an environment variable is set"""
    value = os.environ.get(var_name)
    
    if value is None:
        if required:
            print(f"❌ Required variable {var_name} is NOT set!")
            return False, None
        else:
            print(f"ℹ️ Optional variable {var_name} is not set (default: {default or 'None'})")
            return True, default
    else:
        print(f"✅ {var_name} = {value}")
        return True, value

def check_openai_variables():
    """Check OpenAI-related environment variables"""
    print_section("OpenAI Service Environment Variables")
    
    required_vars = ["OPENAI_API_KEY"]
    optional_vars = {
        "ASSISTANT_NAME": "DADM Decision Analysis Assistant",
        "ASSISTANT_MODEL": "gpt-4o",
        "OPENAI_ASSISTANT_ID": None,
        "PORT": "5000"
    }
    
    all_required_set = True
    for var in required_vars:
        is_set, _ = check_env_var(var, required=True)
        if not is_set:
            all_required_set = False
    
    for var, default in optional_vars.items():
        check_env_var(var, required=False, default=default)
    
    return all_required_set

def check_consul_variables():
    """Check Consul-related environment variables"""
    print_section("Consul Service Registry Environment Variables")
    
    consul_vars = {
        "USE_CONSUL": "true",
        "CONSUL_HTTP_ADDR": "localhost:8500",
        "SERVICE_HOST": "localhost",
        "SERVICE_TYPE": "assistant",
        "DOCKER_CONTAINER": "false"
    }
    
    for var, default in consul_vars.items():
        check_env_var(var, required=False, default=default)
    
    # Try to connect to Consul if USE_CONSUL is true
    use_consul = os.environ.get("USE_CONSUL", "true").lower() == "true"
    if use_consul:
        print("\nTesting connection to Consul:")
        try:
            consul_url = os.environ.get("CONSUL_HTTP_ADDR", "localhost:8500")
            if not consul_url.startswith("http"):
                consul_url = f"http://{consul_url}"
                if not ":" in consul_url:
                    consul_url = f"{consul_url}:8500"
            
            response = requests.get(f"{consul_url}/v1/status/leader", timeout=2)
            if response.status_code == 200:
                print(f"✅ Successfully connected to Consul at {consul_url}")
                leader = response.text.strip().replace('"', '')
                print(f"   Leader: {leader}")
                return True
            else:
                print(f"❌ Could not connect to Consul: status code {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Could not connect to Consul: {e}")
            return False
    else:
        print("\nConsul integration is disabled (USE_CONSUL=false)")
        return True

def main():
    print("DADM Environment Variable Verification Tool")
    print("==========================================")
    
    # Get runtime environment
    in_docker = os.environ.get("DOCKER_CONTAINER", "false").lower() == "true"
    print(f"\nRuntime Environment: {'Docker Container' if in_docker else 'Local Machine'}")
    
    # Check variables by category
    openai_ok = check_openai_variables()
    consul_ok = check_consul_variables()
    
    # Print summary
    print_section("Summary")
    if openai_ok and consul_ok:
        print("✅ All required environment variables are properly set!")
        sys.exit(0)
    else:
        print("❌ Some required environment variables are missing!")
        print("   Please set them before starting the services.")
        sys.exit(1)

if __name__ == "__main__":
    main()
