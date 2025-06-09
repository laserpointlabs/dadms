#!/usr/bin/env python3
"""
Unified Assistant ID Manager

This comprehensive script handles all assistant ID management:
- Verifies existing assistant IDs
- Recovers from invalid or missing IDs
- Synchronizes IDs across all components
- Updates necessary configuration files

This script consolidates functionality from multiple assistant ID tools
into a single, reliable solution.

Usage:
    python sync_assistant_id_unified.py [--force] [--verbose] [--repair] [--check-only]
"""

import os
import sys
import json
import requests
import argparse
import logging
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("assistant_id_sync")

# Add the project root to the Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)
    logger.info(f"Added {project_root} to Python path")

# Path to the data directory
data_dir = os.path.join(project_root, "data")
Path(data_dir).mkdir(parents=True, exist_ok=True)

# Path to the assistant ID file
assistant_id_file = os.path.join(data_dir, "assistant_id.json")

# Service endpoint
OPENAI_SERVICE_URL = os.environ.get("OPENAI_SERVICE_URL", "http://localhost:5000")

# Error constants to check for
ERROR_ID_PATTERN = "No assistant found with id"

def get_stored_assistant_id():
    """Get the assistant ID stored on disk, if any"""
    if os.path.exists(assistant_id_file):
        try:
            with open(assistant_id_file, 'r') as f:
                data = json.load(f)
                assistant_id = data.get("assistant_id")
                logger.info(f"Found stored assistant ID: {assistant_id}")
                return assistant_id
        except Exception as e:
            logger.error(f"Error reading assistant ID file: {e}")
    else:
        logger.warning(f"Assistant ID file not found at {assistant_id_file}")
    return None

def get_service_assistant_id():
    """Get the assistant ID from the service, if any"""
    try:
        logger.info(f"Checking service status at {OPENAI_SERVICE_URL}")
        response = requests.get(f"{OPENAI_SERVICE_URL}/status")
        if response.status_code == 200:
            data = response.json()
            assistant_id = data.get("assistant_id")
            logger.info(f"Service using assistant ID: {assistant_id}")
            return assistant_id
        else:
            logger.warning(f"Service status returned {response.status_code}: {response.text}")
    except Exception as e:
        logger.error(f"Error accessing service: {e}")
    return None

def get_registry_assistant_id():
    """Get the assistant ID from the service registry"""
    try:
        from config.service_registry import SERVICE_REGISTRY
        registry_id = SERVICE_REGISTRY["assistant"]["openai"].get("assistant_id")
        logger.info(f"Registry contains assistant ID: {registry_id}")
        return registry_id
    except Exception as e:
        logger.error(f"Error accessing service registry: {e}")
    return None

def save_assistant_id(assistant_id, name="DADM Decision Analysis Assistant"):
    """
    Save the assistant ID to disk and update all components
    
    Args:
        assistant_id: The assistant ID to save
        name: The name of the assistant
        
    Returns:
        bool: Whether the operation was successful
    """
    if not assistant_id:
        logger.error("Cannot save empty assistant ID")
        return False
        
    success = True
    
    # 1. Save to file
    file_success = _save_to_file(assistant_id, name)
    success = success and file_success
    
    # 2. Update service registry
    registry_success = _update_service_registry(assistant_id)
    success = success and registry_success
    
    # 3. Set environment variable
    os.environ["OPENAI_ASSISTANT_ID"] = assistant_id
    logger.info(f"Set OPENAI_ASSISTANT_ID environment variable to: {assistant_id}")
    
    return success

def _save_to_file(assistant_id, name):
    """Save the assistant ID to the data file"""
    data = {
        "assistant_id": assistant_id,
        "name": name,
        "last_used": datetime.now().isoformat()
    }
    
    try:
        with open(assistant_id_file, 'w') as f:
            json.dump(data, f, indent=2)
        logger.info(f"Saved assistant ID {assistant_id} to {assistant_id_file}")
        return True
    except Exception as e:
        logger.error(f"Error saving assistant ID to file: {e}")
        return False

def _update_service_registry(assistant_id):
    """Update the assistant ID in the service registry"""
    try:
        from config.service_registry import update_assistant_id
        result = update_assistant_id(assistant_id)
        if result:
            logger.info(f"Updated service registry with assistant ID: {assistant_id}")
        else:
            logger.warning("Failed to update service registry")
        return result
    except Exception as e:
        logger.error(f"Error updating service registry: {e}")
        return False

def get_direct_assistant_id(assistant_name="DADM Decision Analysis Assistant"):
    """
    Connect directly to OpenAI API to get the correct assistant ID
    
    Args:
        assistant_name: The name of the assistant to find
        
    Returns:
        str or None: The assistant ID if found, otherwise None
    """
    try:
        # Import OpenAI package and config
        from config import openai_config
        from openai import OpenAI
        
        # Check for API key
        if not openai_config.OPENAI_API_KEY:
            logger.error("OPENAI_API_KEY environment variable is not set")
            return None
        
        assistant_name_to_use = assistant_name or openai_config.ASSISTANT_NAME
        
        # Initialize OpenAI client
        client = OpenAI(api_key=openai_config.OPENAI_API_KEY)
        
        logger.info(f"Connecting to OpenAI API to find assistant: '{assistant_name_to_use}'")
        
        # List assistants and find the one with the matching name
        assistants = client.beta.assistants.list(
            order="desc",
            limit=100
        )
        
        # Check if assistants were found
        if not assistants.data:
            logger.warning("No assistants found in the OpenAI account")
            return None
            
        logger.info(f"Found {len(assistants.data)} assistants")
        
        # Look for our assistant by name
        for assistant in assistants.data:
            if assistant.name == assistant_name_to_use:
                logger.info(f"Found assistant '{assistant_name_to_use}' with ID: {assistant.id}")
                return assistant.id
                
        logger.warning(f"No assistant found with name '{assistant_name_to_use}'")
        logger.info("Available assistants:")
        for idx, assistant in enumerate(assistants.data):
            logger.info(f"  {idx+1}. '{assistant.name}' (ID: {assistant.id})")
            
        return None
        
    except Exception as e:
        logger.error(f"Error getting assistant ID from OpenAI API: {e}")
        return None

def verify_assistant_id(assistant_id, assistant_name=None):
    """
    Verify that an assistant ID is valid by checking with the OpenAI API
    
    Args:
        assistant_id: The assistant ID to verify
        assistant_name: Optional expected name of the assistant
        
    Returns:
        bool: Whether the assistant ID is valid
    """
    if not assistant_id:
        logger.warning("Cannot verify empty assistant ID")
        return False
        
    try:
        # Import OpenAI package and config
        from config import openai_config
        from openai import OpenAI
        
        # Check for API key
        if not openai_config.OPENAI_API_KEY:
            logger.error("OPENAI_API_KEY environment variable is not set")
            return False
            
        # Initialize OpenAI client
        client = OpenAI(api_key=openai_config.OPENAI_API_KEY)
        
        logger.info(f"Verifying assistant ID: {assistant_id}")
        
        # Try to retrieve the assistant
        assistant = client.beta.assistants.retrieve(assistant_id)
        
        if assistant_name and assistant.name != assistant_name:
            logger.warning(f"Assistant name mismatch: Found '{assistant.name}', expected '{assistant_name}'")
            return False
            
        logger.info(f"Assistant ID {assistant_id} is valid (name: '{assistant.name}')")
        return True
        
    except Exception as e:
        logger.error(f"Error verifying assistant ID: {e}")
        return False

def repair_assistant_id(assistant_name=None):
    """
    Attempt to repair the assistant ID by finding the correct one and updating all components
    
    Args:
        assistant_name: Name of the assistant to look for
        
    Returns:
        str or None: The repaired assistant ID, or None if repair failed
    """
    from config import openai_config
    
    # Use provided name or get from config
    name_to_use = assistant_name or openai_config.ASSISTANT_NAME
    
    logger.info(f"Attempting to repair assistant ID for '{name_to_use}'")
    
    # Get the ID directly from OpenAI
    direct_id = get_direct_assistant_id(name_to_use)
    
    if not direct_id:
        logger.error(f"Could not find assistant with name '{name_to_use}' in OpenAI account")
        return None
        
    # Save and update all components
    if save_assistant_id(direct_id, name_to_use):
        logger.info(f"Successfully repaired assistant ID: {direct_id}")
        return direct_id
    else:
        logger.error("Failed to save repaired assistant ID")
        return None

def synchronize_assistant_ids(force_direct=False, repair_if_needed=False):
    """
    Synchronize assistant IDs across all components
    
    Args:
        force_direct: Whether to force checking directly with OpenAI API
        repair_if_needed: Whether to attempt repair if inconsistencies are found
        
    Returns:
        tuple: (success, assistant_id)
    """
    from config import openai_config
    
    # Get IDs from different sources
    stored_id = get_stored_assistant_id()
    registry_id = get_registry_assistant_id()
    service_id = get_service_assistant_id()
    
    # Only get direct ID if forced or others are inconsistent
    direct_id = None
    if force_direct or (stored_id != registry_id or registry_id != service_id or stored_id != service_id):
        logger.info("Getting assistant ID directly from OpenAI API")
        direct_id = get_direct_assistant_id(openai_config.ASSISTANT_NAME)
    
    # Log the IDs found
    logger.info(f"Found assistant IDs:")
    logger.info(f"  - Stored ID:    {stored_id or 'Not found'}")
    logger.info(f"  - Registry ID:  {registry_id or 'Not found'}")
    logger.info(f"  - Service ID:   {service_id or 'Not found'}")
    if direct_id:
        logger.info(f"  - OpenAI ID:    {direct_id}")
    
    # Determine the canonical ID
    canonical_id = direct_id or stored_id or registry_id or service_id
    
    # If we don't have any valid ID
    if not canonical_id:
        if repair_if_needed:
            logger.warning("No valid assistant ID found. Attempting repair...")
            return repair_assistant_id(openai_config.ASSISTANT_NAME) is not None, None
        else:
            logger.error("No valid assistant ID found and repair not requested")
            return False, None
    
    # Verify the canonical ID if we didn't get it directly from OpenAI
    if not direct_id and not verify_assistant_id(canonical_id, openai_config.ASSISTANT_NAME):
        if repair_if_needed:
            logger.warning(f"Assistant ID {canonical_id} is invalid. Attempting repair...")
            return repair_assistant_id(openai_config.ASSISTANT_NAME) is not None, None
        else:
            logger.error(f"Assistant ID {canonical_id} is invalid and repair not requested")
            return False, canonical_id
    
    # Synchronize all components to use the canonical ID
    needs_update = False
    
    if not stored_id or stored_id != canonical_id:
        logger.info(f"Updating stored assistant ID to {canonical_id}")
        needs_update = True
    
    if not registry_id or registry_id != canonical_id:
        logger.info(f"Updating registry assistant ID to {canonical_id}")
        needs_update = True
    
    if needs_update:
        if save_assistant_id(canonical_id, openai_config.ASSISTANT_NAME):
            logger.info("Successfully synchronized all assistant IDs")
            return True, canonical_id
        else:
            logger.error("Failed to synchronize assistant IDs")
            return False, canonical_id
    else:
        logger.info("All assistant IDs are already synchronized")
        return True, canonical_id

def main():
    """Main entry point for the script"""
    parser = argparse.ArgumentParser(description="Unified Assistant ID Manager")
    parser.add_argument("--force", "-f", action="store_true", help="Force direct OpenAI check")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose output")
    parser.add_argument("--repair", "-r", action="store_true", help="Attempt to repair if inconsistencies found")
    parser.add_argument("--check-only", "-c", action="store_true", help="Only check, don't update")
    args = parser.parse_args()
    
    # Set log level based on verbosity
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
        logger.debug("Verbose logging enabled")
    
    print("=" * 80)
    print(" Unified Assistant ID Manager")
    print("=" * 80)
    
    if args.check_only:
        # Just check and report
        stored_id = get_stored_assistant_id()
        registry_id = get_registry_assistant_id()
        service_id = get_service_assistant_id()
        
        print("\nAssistant ID Status:")
        print(f"  - Stored ID:    {stored_id or 'Not found'}")
        print(f"  - Registry ID:  {registry_id or 'Not found'}")
        print(f"  - Service ID:   {service_id or 'Not found'}")
        
        # Check for inconsistencies
        if stored_id == registry_id == service_id and stored_id is not None:
            print("\n✅ All assistant IDs are consistent")
        else:
            print("\n⚠️ Inconsistent assistant IDs detected")
            
        # Verify the stored ID if present
        if stored_id and verify_assistant_id(stored_id):
            print(f"\n✅ Stored assistant ID is valid")
        elif stored_id:
            print(f"\n❌ Stored assistant ID is invalid")
            
    else:
        # Perform synchronization
        success, assistant_id = synchronize_assistant_ids(
            force_direct=args.force, 
            repair_if_needed=args.repair
        )
        
        if success:
            print(f"\n✅ Success: All components now use assistant ID: {assistant_id}")
        else:
            print(f"\n❌ Failed to synchronize assistant ID")
            if assistant_id:
                print(f"   Current assistant ID: {assistant_id}")
            
    print("\nDone.")

if __name__ == "__main__":
    main()
