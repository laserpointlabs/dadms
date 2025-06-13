import os
from config.analysis_config import DECISION_ANALYSIS_JSON_FORMAT

# OpenAI API settings
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

# Assistant configuration
ASSISTANT_NAME = "DADM Decision Analysis Assistant"
ASSISTANT_MODEL = "gpt-4o"

# Use environment variable for assistant ID if available
# This ensures consistent ID usage across the application
ASSISTANT_ID = os.environ.get("OPENAI_ASSISTANT_ID")

ASSISTANT_INSTRUCTIONS = f"""
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

{DECISION_ANALYSIS_JSON_FORMAT}

Work through the decision process step-by-step, maintaining context from previous tasks
in the workflow.
"""

# Timeout settings (in seconds)
REQUEST_TIMEOUT = 60
POLLING_INTERVAL = 2
MAX_POLLING_ATTEMPTS = 300  # 10 minutes max wait time with 2-second polling

# Thread retention settings
THREAD_TTL_DAYS = 1  # Days to keep threads before deletion