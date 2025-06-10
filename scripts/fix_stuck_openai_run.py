#!/usr/bin/env python3
"""
Fix Stuck OpenAI Assistant Run

This script helps resolve the OpenAI API error:
"Can't add messages to thread while a run is active"

It identifies and cancels stuck runs on a specific thread.
"""
import os
import sys
import argparse
import json
from datetime import datetime
from pathlib import Path

# Add the project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Color codes for terminal output
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

def colored_print(text, color):
    """Print colored text to terminal"""
    print(f"{color}{text}{Colors.END}")

def get_openai_client():
    """Initialize OpenAI client with API key validation"""
    try:
        from config import openai_config
        from openai import OpenAI
        
        if not openai_config.OPENAI_API_KEY:
            colored_print("❌ ERROR: OPENAI_API_KEY environment variable is not set", Colors.RED)
            return None
        
        client = OpenAI(api_key=openai_config.OPENAI_API_KEY)
        colored_print("✅ OpenAI client initialized successfully", Colors.GREEN)
        return client
        
    except Exception as e:
        colored_print(f"❌ Error initializing OpenAI client: {e}", Colors.RED)
        return None

def list_runs_on_thread(client, thread_id):
    """List all runs on a specific thread"""
    try:
        colored_print(f"🔍 Retrieving runs for thread: {thread_id}", Colors.BLUE)
        runs = client.beta.threads.runs.list(thread_id=thread_id)
        
        if not runs.data:
            colored_print("ℹ️ No runs found on this thread", Colors.YELLOW)
            return []
        
        colored_print(f"📋 Found {len(runs.data)} run(s) on this thread:", Colors.CYAN)
        
        for i, run in enumerate(runs.data, 1):
            status_color = Colors.GREEN if run.status == "completed" else Colors.YELLOW if run.status in ["queued", "in_progress"] else Colors.RED
            colored_print(f"  {i}. Run ID: {run.id}", Colors.WHITE)
            colored_print(f"     Status: {run.status}", status_color)
            colored_print(f"     Created: {datetime.fromtimestamp(run.created_at).strftime('%Y-%m-%d %H:%M:%S')}", Colors.WHITE)
            colored_print(f"     Assistant: {run.assistant_id}", Colors.WHITE)
            print()  # Empty line for readability
        
        return runs.data
        
    except Exception as e:
        colored_print(f"❌ Error listing runs: {e}", Colors.RED)
        return []

def cancel_run(client, thread_id, run_id):
    """Cancel a specific run"""
    try:
        colored_print(f"⏹️ Attempting to cancel run: {run_id}", Colors.YELLOW)
        
        # First check the current status
        run = client.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run_id)
        colored_print(f"📊 Current run status: {run.status}", Colors.CYAN)
        
        if run.status in ["completed", "failed", "cancelled", "expired"]:
            colored_print(f"ℹ️ Run is already in final state: {run.status}", Colors.YELLOW)
            return True
        
        # Attempt to cancel the run
        cancelled_run = client.beta.threads.runs.cancel(thread_id=thread_id, run_id=run_id)
        colored_print(f"✅ Cancel request sent. New status: {cancelled_run.status}", Colors.GREEN)
        
        # Wait a moment and check the status again
        import time
        time.sleep(2)
        
        updated_run = client.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run_id)
        colored_print(f"🔄 Updated status after cancellation: {updated_run.status}", Colors.CYAN)
        
        if updated_run.status in ["cancelled", "failed", "expired"]:
            colored_print("✅ Run successfully cancelled/stopped", Colors.GREEN)
            return True
        else:
            colored_print(f"⚠️ Run may still be active with status: {updated_run.status}", Colors.YELLOW)
            return False
        
    except Exception as e:
        colored_print(f"❌ Error cancelling run: {e}", Colors.RED)
        return False

def cancel_all_active_runs(client, thread_id):
    """Cancel all active runs on a thread"""
    runs = list_runs_on_thread(client, thread_id)
    
    active_runs = [run for run in runs if run.status in ["queued", "in_progress"]]
    
    if not active_runs:
        colored_print("✅ No active runs found to cancel", Colors.GREEN)
        return True
    
    colored_print(f"🎯 Found {len(active_runs)} active run(s) to cancel", Colors.YELLOW)
    
    success_count = 0
    for run in active_runs:
        if cancel_run(client, thread_id, run.id):
            success_count += 1
    
    colored_print(f"📊 Successfully cancelled {success_count}/{len(active_runs)} runs", Colors.CYAN)
    return success_count == len(active_runs)

def create_new_thread(client):
    """Create a new thread as a workaround"""
    try:
        colored_print("🆕 Creating a new thread as a workaround...", Colors.BLUE)
        new_thread = client.beta.threads.create()
        colored_print(f"✅ New thread created: {new_thread.id}", Colors.GREEN)
        return new_thread.id
    except Exception as e:
        colored_print(f"❌ Error creating new thread: {e}", Colors.RED)
        return None

def main():
    parser = argparse.ArgumentParser(description="Fix stuck OpenAI Assistant runs")
    parser.add_argument("--thread-id", "-t", required=True, help="Thread ID with stuck run")
    parser.add_argument("--run-id", "-r", help="Specific run ID to cancel (optional)")
    parser.add_argument("--list-only", "-l", action="store_true", help="Only list runs, don't cancel")
    parser.add_argument("--auto-cancel", "-a", action="store_true", help="Automatically cancel all active runs")
    parser.add_argument("--create-new-thread", "-n", action="store_true", help="Create a new thread as workaround")
    
    args = parser.parse_args()
    
    colored_print(f"{Colors.BOLD}🔧 OpenAI Assistant Run Fixer{Colors.END}", Colors.CYAN)
    colored_print(f"Thread ID: {args.thread_id}", Colors.WHITE)
    print()
    
    # Initialize OpenAI client
    client = get_openai_client()
    if not client:
        return 1
    
    # List runs on the thread
    runs = list_runs_on_thread(client, args.thread_id)
    
    if args.list_only:
        colored_print("📋 List-only mode. Exiting without making changes.", Colors.CYAN)
        return 0
    
    # If specific run ID provided, cancel only that run
    if args.run_id:
        success = cancel_run(client, args.thread_id, args.run_id)
        return 0 if success else 1
    
    # Auto-cancel mode
    if args.auto_cancel:
        success = cancel_all_active_runs(client, args.thread_id)
        if not success:
            colored_print("⚠️ Some runs could not be cancelled", Colors.YELLOW)
        return 0 if success else 1
    
    # Interactive mode
    active_runs = [run for run in runs if run.status in ["queued", "in_progress"]]
    
    if not active_runs:
        colored_print("✅ No active runs found. Thread should be ready for new messages.", Colors.GREEN)
        return 0
    
    colored_print(f"🎯 Found {len(active_runs)} active run(s)", Colors.YELLOW)
    
    # Ask user what to do
    while True:
        print()
        colored_print("What would you like to do?", Colors.CYAN)
        print("1. Cancel all active runs")
        print("2. Cancel specific run")
        print("3. Create new thread (workaround)")
        print("4. Exit without changes")
        
        choice = input(f"\n{Colors.BOLD}Enter your choice (1-4): {Colors.END}").strip()
        
        if choice == "1":
            success = cancel_all_active_runs(client, args.thread_id)
            break
        elif choice == "2":
            print()
            colored_print("Available active runs:", Colors.CYAN)
            for i, run in enumerate(active_runs, 1):
                print(f"  {i}. {run.id} (Status: {run.status})")
            
            try:
                run_choice = int(input(f"\n{Colors.BOLD}Select run number to cancel: {Colors.END}")) - 1
                if 0 <= run_choice < len(active_runs):
                    selected_run = active_runs[run_choice]
                    success = cancel_run(client, args.thread_id, selected_run.id)
                    break
                else:
                    colored_print("❌ Invalid selection", Colors.RED)
            except ValueError:
                colored_print("❌ Please enter a valid number", Colors.RED)
        elif choice == "3":
            new_thread_id = create_new_thread(client)
            if new_thread_id:
                colored_print(f"💡 Tip: Update your application to use thread ID: {new_thread_id}", Colors.YELLOW)
            break
        elif choice == "4":
            colored_print("👋 Exiting without changes", Colors.CYAN)
            return 0
        else:
            colored_print("❌ Invalid choice. Please enter 1, 2, 3, or 4.", Colors.RED)
    
    print()
    colored_print("🏁 Operation completed!", Colors.GREEN)
    colored_print("💡 You should now be able to send new messages to the thread.", Colors.BLUE)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
