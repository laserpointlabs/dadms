#!/usr/bin/env python3
"""
Prompt Template Validator

Simple CLI script to validate prompt template format in prompts.json
"""
import os
import json
import sys
from datetime import datetime
from typing import Dict, Any

def validate_prompt_template(prompt_id: str, prompt_data: Dict[str, Any]) -> bool:
    """
    Validate a single prompt template
    
    Args:
        prompt_id: The prompt ID
        prompt_data: The prompt data dictionary
        
    Returns:
        bool: True if valid, False otherwise
    """
    required_fields = ['id', 'description', 'template']
    optional_fields = ['tags', 'rag_sources', 'version', 'created_at', 'updated_at', 'metadata']
    
    errors = []
    
    # Check required fields
    for field in required_fields:
        if field not in prompt_data:
            errors.append(f"Missing required field: {field}")
        elif not prompt_data[field]:
            errors.append(f"Empty required field: {field}")
    
    # Validate ID consistency
    if 'id' in prompt_data and prompt_data['id'] != prompt_id:
        errors.append(f"ID mismatch: key='{prompt_id}', id field='{prompt_data['id']}'")
    
    # Validate field types
    if 'tags' in prompt_data and not isinstance(prompt_data['tags'], list):
        errors.append("Field 'tags' must be a list")
    
    if 'rag_sources' in prompt_data and not isinstance(prompt_data['rag_sources'], list):
        errors.append("Field 'rag_sources' must be a list")
    
    if 'metadata' in prompt_data and not isinstance(prompt_data['metadata'], dict):
        errors.append("Field 'metadata' must be a dictionary")
    
    # Validate timestamps if present
    for timestamp_field in ['created_at', 'updated_at']:
        if timestamp_field in prompt_data:
            try:
                datetime.fromisoformat(prompt_data[timestamp_field].replace('Z', '+00:00'))
            except ValueError:
                errors.append(f"Invalid timestamp format in '{timestamp_field}'")
    
    if errors:
        print(f"❌ Validation failed for prompt '{prompt_id}':")
        for error in errors:
            print(f"   - {error}")
        return False
    else:
        print(f"✅ Prompt '{prompt_id}' is valid")
        return True

def validate_prompts_file(file_path: str) -> bool:
    """
    Validate the entire prompts.json file
    
    Args:
        file_path: Path to the prompts.json file
        
    Returns:
        bool: True if all prompts are valid, False otherwise
    """
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False
    
    try:
        with open(file_path, 'r') as f:
            prompts_data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON format: {e}")
        return False
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False
    
    if not isinstance(prompts_data, dict):
        print("❌ Root element must be a dictionary")
        return False
    
    if not prompts_data:
        print("⚠️ No prompts found in file")
        return True
    
    print(f"Validating {len(prompts_data)} prompts...")
    print("-" * 50)
    
    all_valid = True
    for prompt_id, prompt_data in prompts_data.items():
        is_valid = validate_prompt_template(prompt_id, prompt_data)
        if not is_valid:
            all_valid = False
        print()
    
    print("-" * 50)
    if all_valid:
        print(f"✅ All {len(prompts_data)} prompts are valid!")
    else:
        print(f"❌ Some prompts failed validation")
    
    return all_valid

def main():
    """Main CLI function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Validate prompt template format")
    parser.add_argument(
        "file",
        nargs="?",
        default="prompts.json",
        help="Path to prompts.json file (default: prompts.json)"
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Verbose output"
    )
    
    args = parser.parse_args()
    
    print("DADM Prompt Template Validator")
    print("=" * 50)
    
    # Resolve file path
    if not os.path.isabs(args.file):
        # Look for file relative to current directory
        file_path = os.path.abspath(args.file)
        if not os.path.exists(file_path):
            # Look for file relative to script directory
            script_dir = os.path.dirname(os.path.abspath(__file__))
            file_path = os.path.join(script_dir, args.file)
    else:
        file_path = args.file
    
    print(f"Validating file: {file_path}")
    print()
    
    success = validate_prompts_file(file_path)
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
