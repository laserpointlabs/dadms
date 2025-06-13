#!/usr/bin/env python3
"""
Update Assistant Instructions

This script updates an existing OpenAI assistant with the new JSON format instructions.
"""
import os
import sys
import logging
from openai import OpenAI

# Add the project root to the Python path for absolute imports
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# Define the JSON format template
DECISION_ANALYSIS_JSON_FORMAT = """
IMPORTANT: Always format your responses as valid JSON objects with the following structure:

{
  "analysis": {
    "decision_context": "Description of the decision context and problem statement",
    "stakeholders": ["Stakeholder 1", "Stakeholder 2", "..."],
    "alternatives": [
      {
        "name": "Alternative 1",
        "description": "Description of alternative 1",
        "pros": ["Pro 1", "Pro 2", "..."],
        "cons": ["Con 1", "Con 2", "..."]
      },
      {
        "name": "Alternative 2",
        "description": "Description of alternative 2",
        "pros": ["Pro 1", "Pro 2", "..."],
        "cons": ["Con 1", "Con 2", "..."]
      }
    ],
    "criteria": [
      {
        "name": "Criterion 1",
        "description": "Description of criterion 1",
        "weight": 0.3
      },
      {
        "name": "Criterion 2",
        "description": "Description of criterion 2",
        "weight": 0.7
      }
    ]
  },
  "evaluation": {
    "method": "Description of evaluation method used",
    "results": [
      {
        "alternative": "Alternative 1",
        "score": 0.85,
        "rationale": "Explanation for this score"
      },
      {
        "alternative": "Alternative 2",
        "score": 0.72,
        "rationale": "Explanation for this score"
      }
    ]
  },
  "recommendation": {
    "preferred_alternative": "Name of the recommended alternative",
    "justification": "Detailed justification for the recommendation",
    "implementation_considerations": [
      "Consideration 1",
      "Consideration 2",
      "..."
    ],
    "risks": [
      {
        "description": "Risk 1 description",
        "mitigation": "Suggested mitigation for risk 1"
      },
      {
        "description": "Risk 2 description", 
        "mitigation": "Suggested mitigation for risk 2"
      }
    ]
  }
}

Ensure your response is properly formatted as valid JSON. This structure is required for automated processing of decision analysis results.
"""

def get_assistant_instructions():
    """Get the updated assistant instructions with JSON format requirements"""
    base_instructions = """
You are a Decision Analysis Assistant specialized in helping analyze complex decisions.

Follow these guidelines when processing tasks:
1. Carefully read and understand the context and task instructions
2. Break down complex decisions into clear components
3. Consider all stakeholders mentioned in the context
4. Think about both immediate and long-term implications
5. Consider different alternatives and their trade-offs
6. When evaluating options, explicitly state the criteria used
7. Provide structured and organized responses
8. Format your responses based on the specific instructions given for each task
9. Always provide reasoning for your recommendations
10. Be clear, concise, and objective in your analysis
"""

    # Add the JSON format instructions
    instructions = f"{base_instructions}\n\n{DECISION_ANALYSIS_JSON_FORMAT}\n\nWork through the decision process step-by-step, maintaining context from previous tasks in the workflow."
    
    return instructions

def update_assistant(assistant_id=None):
    """Update the assistant with new instructions"""
    # Get API key from environment
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        logger.error("OPENAI_API_KEY environment variable is not set")
        return False
        
    # Get assistant ID from environment or parameter
    assistant_id = assistant_id or os.environ.get('OPENAI_ASSISTANT_ID')
    if not assistant_id:
        logger.error("No assistant ID provided or found in OPENAI_ASSISTANT_ID environment variable")
        return False
    
    # Initialize OpenAI client
    client = OpenAI(api_key=api_key)
    
    try:
        # Get updated instructions
        instructions = get_assistant_instructions()
        
        # Update the assistant
        logger.info(f"Updating assistant with ID: {assistant_id}")
        assistant = client.beta.assistants.update(
            assistant_id=assistant_id,
            instructions=instructions
        )
        
        logger.info(f"Successfully updated assistant: {assistant.name} ({assistant.id})")
        logger.info("The updated instructions include JSON format requirements")
        return True
        
    except Exception as e:
        logger.error(f"Error updating assistant: {e}")
        return False

if __name__ == "__main__":
    # Get assistant ID from command line argument or environment
    assistant_id = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('OPENAI_ASSISTANT_ID') or "asst_UNOI30oiCpdalzRdeLM00qnP"
    
    # Update the assistant
    if update_assistant(assistant_id):
        logger.info("✅ Assistant instructions updated successfully")
        sys.exit(0)
    else:
        logger.error("❌ Failed to update assistant instructions")
        sys.exit(1)
