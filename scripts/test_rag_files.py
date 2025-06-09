#!/usr/bin/env python3
"""
Test RAG File Manager

This script tests the RAG (Retrieval-Augmented Generation) file manager integration with OpenAI.
It supports checking file configuration and manager initialization.
"""

import os
import sys
import argparse
from pathlib import Path

# Add the project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def test_file_manager(data_dir=None):
    """Test RAGFileManager functionality"""
    print("=== Testing RAG File Manager ===")
    
    # Initialize file manager
    if not data_dir:
        data_dir = os.path.join(project_root, "data")
    
    print(f"Using data directory: {data_dir}")
    
    # Check if API key is set
    try:
        from config import openai_config
        if not openai_config.OPENAI_API_KEY:
            print("ERROR: OPENAI_API_KEY environment variable is not set")
            return
    except Exception as e:
        print(f"Error loading OpenAI config: {e}")
        return
    
    # Initialize OpenAI client for file manager
    try:
        from openai import OpenAI
        from src.rag_file_manager import RAGFileManager
        
        client = OpenAI(api_key=openai_config.OPENAI_API_KEY)
        file_manager = RAGFileManager(client=client, data_dir=data_dir)
        print("Initialized RAG File Manager successfully")
        
        # List files in the data directory
        print("\nFiles in data directory:")
        file_count = 0
        for file_path in Path(data_dir).glob("*.*"):
            if file_path.is_file() and not file_path.name.startswith('.'):
                print(f"  - {file_path.name}")
                file_count += 1
        
        if file_count == 0:
            print("  No files found in data directory")
        else:
            print(f"  Found {file_count} files")
        
        # Check if meta.json exists
        meta_path = os.path.join(data_dir, "meta.json")
        if os.path.exists(meta_path):
            print("\nFile metadata exists at:", meta_path)
            try:
                import json
                with open(meta_path, 'r') as f:
                    meta = json.load(f)
                    if isinstance(meta, dict) and "files" in meta:
                        print(f"  Metadata contains {len(meta['files'])} file entries")
            except Exception as e:
                print(f"  Error reading metadata: {e}")
        else:
            print("\nNo file metadata found at:", meta_path)
    
    except Exception as e:
        print(f"Error initializing RAG File Manager: {e}")

def test_assistant_manager(data_dir=None):
    """Test AssistantManager initialization"""
    print("\n=== Testing AssistantManager Initialization ===")
    
    # Initialize AssistantManager
    if not data_dir:
        data_dir = os.path.join(project_root, "data")
    
    print(f"Using data directory: {data_dir}")
    
    try:
        # Import AssistantManager
        from src.openai_assistant import AssistantManager
        
        # Initialize AssistantManager
        print("Initializing AssistantManager...")
        assistant_manager = AssistantManager(data_dir=data_dir)
        print(f"AssistantManager initialized successfully")
        print(f"Assistant ID: {assistant_manager.assistant_id}")
        print(f"Thread ID: {assistant_manager.thread_id}")
        
        # Check assistant ID file
        assistant_id_file = os.path.join(data_dir, "assistant_id.json")
        if os.path.exists(assistant_id_file):
            print(f"\nAssistant ID file exists at: {assistant_id_file}")
            try:
                import json
                with open(assistant_id_file, 'r') as f:
                    data = json.load(f)
                    print(f"  Saved assistant ID: {data.get('assistant_id')}")
                    print(f"  Assistant name: {data.get('name')}")
                    print(f"  Last used: {data.get('last_used')}")
            except Exception as e:
                print(f"  Error reading assistant ID file: {e}")
        else:
            print(f"\nNo assistant ID file found at: {assistant_id_file}")
            
    except Exception as e:
        print(f"Error testing AssistantManager: {e}")

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Test RAG File Manager")
    parser.add_argument("--data-dir", help="Path to data directory")
    parser.add_argument("--test-assistant", action="store_true", help="Test AssistantManager initialization")
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    
    # Test RAGFileManager
    test_file_manager(args.data_dir)
    
    # Test AssistantManager if requested
    if args.test_assistant:
        test_assistant_manager(args.data_dir)