#!/usr/bin/env python3
"""
OpenAI Thread Interaction

Interact with OpenAI threads captured during DADM workflow execution.
"""

import sys
import json
import os
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

def interact_with_thread(thread_id: str, assistant_id: str, message: str):
    """Interact with an OpenAI thread"""
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
        print(f"🤖 Interacting with OpenAI Thread: {thread_id}")
        print(f"🤖 Assistant: {assistant_id}")
        print(f"💬 Your message: {message}")
        print("=" * 60)
        
        # Add message to the thread
        client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=message
        )
        
        # Run the assistant
        run = client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=assistant_id
        )
        
        # Wait for completion
        import time
        while run.status in ['queued', 'in_progress']:
            time.sleep(1)
            run = client.beta.threads.runs.retrieve(
                thread_id=thread_id,
                run_id=run.id
            )
        
        if run.status == 'completed':
            # Get the latest messages
            messages = client.beta.threads.messages.list(
                thread_id=thread_id,
                limit=5
            )
            
            print("🤖 Assistant Response:")
            print("-" * 60)
            for message in messages.data:
                if message.role == "assistant":
                    for content in message.content:
                        if content.type == "text":
                            print(content.text.value)
                    break
            print("-" * 60)
            
        else:
            print(f"❌ Run failed with status: {run.status}")
            if run.last_error:
                print(f"Error: {run.last_error}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error interacting with thread: {e}")
        import traceback
        traceback.print_exc()
        return False

def get_thread_history(thread_id: str, limit: int = 10):
    """Get the conversation history for a thread"""
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
        print(f"📜 Thread History: {thread_id}")
        print("=" * 60)
        
        messages = client.beta.threads.messages.list(
            thread_id=thread_id,
            limit=limit
        )
        
        for message in reversed(messages.data):
            role_emoji = "👤" if message.role == "user" else "🤖"
            print(f"{role_emoji} {message.role.upper()}:")
            for content in message.content:
                if content.type == "text":
                    print(content.text.value)
            print("-" * 40)
        
        return True
        
    except Exception as e:
        print(f"❌ Error getting thread history: {e}")
        return False

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Interact with OpenAI threads from DADM analyses")
    parser.add_argument("--process-id", help="Process instance ID")
    parser.add_argument("--analysis-id", help="Analysis ID")
    parser.add_argument("--thread-id", help="Direct thread ID")
    parser.add_argument("--assistant-id", help="Direct assistant ID")
    parser.add_argument("--message", help="Message to send to the thread")
    parser.add_argument("--history", action="store_true", help="Show thread history only")
    parser.add_argument("--limit", type=int, default=10, help="Number of messages to show in history")
    
    args = parser.parse_args()
    
    # Check for OpenAI API key
    if not os.environ.get("OPENAI_API_KEY"):
        print("❌ OPENAI_API_KEY environment variable not set")
        return 1
    
    thread_id = args.thread_id
    assistant_id = args.assistant_id
    
    # Extract thread information from analysis if needed
    if not thread_id and (args.process_id or args.analysis_id):
        try:
            from src.analysis_service_integration import get_analysis_service
            
            analysis_service = get_analysis_service()
            
            if args.analysis_id:
                thread_id = analysis_service.get_openai_thread_id(args.analysis_id)
                assistant_id = analysis_service.get_openai_assistant_id(args.analysis_id)
                print(f"📋 Extracted from analysis {args.analysis_id}:")
                print(f"   Thread: {thread_id}")
                print(f"   Assistant: {assistant_id}")
                
            elif args.process_id:
                context = analysis_service.get_process_openai_context(args.process_id)
                if context['thread_ids']:
                    thread_id = context['thread_ids'][0]  # Use first thread
                    assistant_id = context['assistant_ids'][0] if context['assistant_ids'] else None
                    print(f"📋 Extracted from process {args.process_id}:")
                    print(f"   Thread: {thread_id}")
                    print(f"   Assistant: {assistant_id}")
                    if len(context['thread_ids']) > 1:
                        print(f"   Note: Process has {len(context['thread_ids'])} threads, using first one")
        
        except Exception as e:
            print(f"❌ Error extracting thread information: {e}")
            return 1
    
    if not thread_id:
        print("❌ No thread ID found. Specify --thread-id or --process-id/--analysis-id")
        return 1
    
    if args.history:
        # Show thread history
        success = get_thread_history(thread_id, args.limit)
        return 0 if success else 1
    
    if not args.message:
        print("❌ No message specified. Use --message or --history")
        return 1
    
    if not assistant_id:
        print("❌ No assistant ID found. Specify --assistant-id or use analysis/process extraction")
        return 1
    
    # Send message to thread
    success = interact_with_thread(thread_id, assistant_id, args.message)
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
