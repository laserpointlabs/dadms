import os
import sys
import json
import logging
from datetime import datetime

# Add the project root to the Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from services.openai_service.name_based_assistant_manager import NameBasedAssistantManager
from services.openai_service import config
from openai import OpenAI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def debug_openai_failure():
    """Debug OpenAI assistant failure"""
    
    # Check API key
    if not config.OPENAI_API_KEY:
        print("❌ OPENAI_API_KEY is not set")
        return
    
    print(f"✅ OPENAI_API_KEY is set: {config.OPENAI_API_KEY[:10]}...")
    
    try:
        # Initialize OpenAI client
        client = OpenAI(api_key=config.OPENAI_API_KEY)
        print("✅ OpenAI client initialized")
        
        # Initialize assistant manager
        manager = NameBasedAssistantManager(client)
        print("✅ Assistant manager initialized")
        
        # Check if assistant exists
        assistant = manager.find_assistant_by_name()
        if not assistant:
            print("❌ No assistant found, attempting to create one...")
            assistant = manager.get_or_create_assistant()
        
        if assistant:
            print(f"✅ Assistant found: {assistant.name} (ID: {assistant.id})")
        else:
            print("❌ Could not find or create assistant")
            return
        
        # Create a simple test task
        print("\n🔍 Testing simple task processing...")
        test_input = """
        Task: FrameDecisionTask
        
        Instructions: Analyze the decision context to frame the problem appropriately.
        
        Context Variables: {'decision_context': 'Test decision scenario'}
        """
        
        # Process the task with detailed error handling
        try:
            result = manager.process_task("FrameDecisionTask", test_input, {})
            
            if "error" in result:
                print(f"❌ Task failed with error: {result['error']}")
                if "details" in result:
                    print(f"📋 Error details: {json.dumps(result['details'], indent=2)}")
            else:
                print(f"✅ Task completed successfully")
                print(f"📝 Response length: {len(result.get('recommendation', ''))}")
                
        except Exception as e:
            print(f"❌ Exception during task processing: {e}")
            import traceback
            traceback.print_exc()
        
    except Exception as e:
        print(f"❌ Error during debug: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_openai_failure()
