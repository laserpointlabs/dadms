import sys
import os
import json
import time
import threading
import argparse
import subprocess
from pathlib import Path

import sys
import os
import json
import time
import threading
import argparse
import subprocess
from pathlib import Path

# Force unbuffered output to fix issues when redirecting to files
os.environ['PYTHONUNBUFFERED'] = '1'

# Add the project root to the Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from camunda.external_task.external_task_worker import ExternalTaskWorker
from config import camunda_config
import requests

# Import ServiceOrchestrator with proper dynamic discovery priority logic
from src.service_orchestrator import ServiceOrchestrator
print("Using ServiceOrchestrator with dynamic discovery priority")

# Remove direct OpenAI imports - use service-only approach
from config import openai_config
# Import service discovery module
from src.consul_app import get_openai_service_url


def format_variables_for_display(variables, title="VARIABLES"):
    """
    Format variables for human-readable display, detecting and prettifying JSON strings
    
    Args:
        variables: Dictionary of variables to display
        title: Title to show above the variables
        
    Returns:
        str: Formatted string for display
    """
    if not variables:
        return f"\n{title}: None"
    
    def try_parse_and_format_json(value):
        """Try to parse a value as JSON and format it nicely"""
        if not isinstance(value, str):
            return value
        
        # Check if this looks like JSON (starts with { or [)
        stripped = value.strip()
        if not (stripped.startswith('{') or stripped.startswith('[')):
            return value
        
        try:
            # Try to parse as JSON
            parsed = json.loads(value)
            # If successful, return pretty-formatted JSON
            return json.dumps(parsed, indent=4, ensure_ascii=False)
        except (json.JSONDecodeError, ValueError):
            # If parsing fails, return original value
            return value
    
    # Process each variable
    formatted_vars = {}
    for key, value in variables.items():
        formatted_vars[key] = try_parse_and_format_json(value)
    
    # Create the display string
    lines = [f"\n{title}:"]
    
    for key, value in formatted_vars.items():
        lines.append(f"\n📋 {key}:")
          # Check if this is a formatted JSON string (has newlines and indentation)
        if isinstance(value, str) and '\n' in value and ('    ' in value or '  ' in value):
            # This is likely formatted JSON, display it with proper indentation
            lines.append("=" * 60)
            lines.append(value)
            lines.append("=" * 60)
        else:
            # Regular value, display normally
            # Don't truncate important variables like decision_context, instructions, etc.
            important_vars = ['decision_context', 'instructions', 'task_documentation', 'context', 'description']
            
            if isinstance(value, str) and len(value) > 500 and not any(imp_var in key.lower() for imp_var in important_vars):
                # Only truncate very long strings that aren't important context
                lines.append(f"{str(value)[:500]}... (truncated)")
            else:
                # Display the full value for important variables
                lines.append(str(value))
    
    return '\n'.join(lines)


def namespace_task_output_variables(topic_name, activity_id, output_variables):
    """
    Namespace task output variables to prevent conflicts when parallel streams converge.
    
    This function transforms task output variables to use unique names based on the task type,
    ensuring that when parallel analysis streams converge at a parallel gateway join,
    the variables from different tasks don't overwrite each other.
    
    Uses pattern-based matching for flexibility with new task types.
    
    Args:
        topic_name: The topic name of the task (e.g., 'TechnicalFeasibility')
        activity_id: The activity ID of the task (e.g., 'TechnicalFeasibilityTask') 
        output_variables: The original output variables from the task
        
    Returns:
        dict: Namespaced variables that won't conflict with other parallel tasks
    """
    if not output_variables:
        return output_variables
    
    def determine_namespace(topic_name, activity_id):
        """
        Determine the namespace for a task using pattern matching.
        This allows new tasks to be automatically categorized without hardcoding.
        """
        # Convert to lowercase for case-insensitive matching
        topic_lower = (topic_name or '').lower()
        activity_lower = (activity_id or '').lower()
        
        # Technical Analysis patterns
        technical_patterns = [
            'technical', 'performance', 'feasibility', 'engineering', 
            'architecture', 'implementation', 'system', 'technology'
        ]
        
        # Business Analysis patterns  
        business_patterns = [
            'business', 'cost', 'benefit', 'stakeholder', 'financial',
            'economic', 'market', 'commercial', 'budget', 'roi'
        ]
        
        # Risk Analysis patterns
        risk_patterns = [
            'risk', 'mitigation', 'security', 'threat', 'vulnerability',
            'compliance', 'audit', 'safety', 'regulatory'
        ]
        
        # Synthesis/Final patterns (should NOT be namespaced)
        synthesis_patterns = [
            'synthesis', 'synthesize', 'final', 'recommendation', 'whitepaper',
            'generate', 'summary', 'conclusion', 'initialize', 'initial'
        ]
        
        # Check synthesis patterns first (these should not be namespaced)
        for pattern in synthesis_patterns:
            if pattern in topic_lower or pattern in activity_lower:
                return None
        
        # Check technical patterns
        for pattern in technical_patterns:
            if pattern in topic_lower or pattern in activity_lower:
                return 'technical'
        
        # Check business patterns
        for pattern in business_patterns:
            if pattern in topic_lower or pattern in activity_lower:
                return 'business'
        
        # Check risk patterns
        for pattern in risk_patterns:
            if pattern in topic_lower or pattern in activity_lower:
                return 'risk'
        
        # For new tasks like "AssessTradeoffs", check for common analysis keywords
        analysis_patterns = ['assess', 'evaluate', 'analyze', 'compare', 'review']
        for pattern in analysis_patterns:
            if pattern in topic_lower or pattern in activity_lower:
                # Default to 'analysis' namespace for general analysis tasks
                return 'analysis'
        
        # If no pattern matches, don't namespace (safer default)
        return None
    
    # Get the namespace for this task using pattern matching
    namespace = determine_namespace(topic_name, activity_id)
    
    # If no namespace is defined (e.g., for synthesis tasks), return variables as-is
    if not namespace:
        return output_variables
    
    # Create namespaced variables
    namespaced_variables = {}
    
    # Variables that should always be preserved without namespacing (metadata)
    preserve_variables = {
        'task_name', 'processed_by', 'processed_at', 'assistant_id', 'thread_id',
        'decision_context', 'context_summary', 'error'
    }
    
    for key, value in output_variables.items():
        if key in preserve_variables:
            # Keep metadata variables without namespacing
            namespaced_variables[key] = value
        elif key in ['analysis', 'recommendation']:
            # Namespace the main content variables
            namespaced_key = f"{namespace}_{key}"
            namespaced_variables[namespaced_key] = value
        else:
            # For other variables, namespace them but also keep original for compatibility
            namespaced_key = f"{namespace}_{key}"
            namespaced_variables[namespaced_key] = value
            # Also keep the original key for backward compatibility
            namespaced_variables[key] = value
    
    return namespaced_variables

# Main application logic for DADM Demonstrator

# Timing and delay configuration constants
# These control the timing behavior of the script and can be adjusted as needed
TASK_VISUALIZATION_DELAY = 2     # Seconds to delay between tasks for visualization
IDLE_THRESHOLD = 5               # Seconds of no activity before considering process complete (reduced from 10 to 5)
COMPLETION_CHECK_INTERVAL = 2    # Seconds between checks for process completion (reduced from 5 to 2)
FINAL_CLEANUP_DELAY = 3          # Seconds to wait before final cleanup (reduced from 5 to 3)
TOPIC_MONITOR_INTERVAL = 5      # Seconds between checks for new topics
TASK_POLLING_INTERVAL = 10       # Seconds between polling attempts for active tasks
WORKER_LOCK_DURATION = 30000     # Milliseconds for task lock duration (30 seconds)

# Define a decision context to be used as input for the first task
DECISION_CONTEXT = """
Our agency needs to select the most suitable Unmanned Aircraft System (UAS) platform for rapid deployment in disaster response scenarios. The decision must consider operational requirements, technical capabilities, cost constraints, and regulatory compliance. The selected UAS should support emergency response teams by providing timely, high-quality data in various weather conditions, while staying within a $2M budget and meeting payload and endurance requirements. Stakeholders include emergency response teams, procurement officers, technical experts, and regulatory authorities.
"""

# Global variables for execution
processed_topics = set()
discovered_topics = []
execution_completed = threading.Event()
first_task_done = False
last_activity_time = time.time()
stop_monitoring = threading.Event()
assistant_manager = None  # Will be initialized in main()
service_orchestrator = None  # Will be initialized in main()
current_process_instance_id = None  # Will be set when a process is started

def get_openai_service_url_from_orchestrator():
    """
    Get the OpenAI service URL using the service orchestrator's registry
    This uses localhost addresses when running on host machine instead of container IPs
    
    Returns:
        str: URL of the OpenAI service
    """
    global service_orchestrator
    
    # Default URL as fallback
    default_url = os.environ.get("OPENAI_SERVICE_URL", "http://localhost:5000")
    
    if not service_orchestrator:
        print("WARNING: Service orchestrator not initialized, using default URL")
        return default_url
    
    try:
        # Look for OpenAI service in the service orchestrator's registry
        service_registry = service_orchestrator.service_registry
        
        # Try to find the OpenAI assistant service
        if "assistant" in service_registry:
            assistant_services = service_registry["assistant"]
            
            # Try to find by the new service name first
            if "dadm-openai-assistant" in assistant_services:
                endpoint = assistant_services["dadm-openai-assistant"].get("endpoint")
                if endpoint:
                    print(f"Found OpenAI service at: {endpoint}")
                    return endpoint
            
            # Try to find by old service name as fallback
            if "openai" in assistant_services:
                endpoint = assistant_services["openai"].get("endpoint")
                if endpoint:
                    print(f"Found OpenAI service (legacy name) at: {endpoint}")
                    return endpoint
            
            # If no specific service name found, use the first assistant service
            if assistant_services:
                first_service_name = list(assistant_services.keys())[0]
                endpoint = assistant_services[first_service_name].get("endpoint")
                if endpoint:
                    print(f"Using first assistant service ({first_service_name}) at: {endpoint}")
                    return endpoint
        
        print("WARNING: No assistant services found in service orchestrator registry, using default URL")
        return default_url
        
    except Exception as e:
        print(f"ERROR: Failed to get OpenAI service URL from orchestrator: {e}")
        return default_url

def extract_topics_from_process_xml(definition_id):
    """Extract topic names from a process definition's XML"""
    base_url = camunda_config.CAMUNDA_ENGINE_URL
    if not base_url.endswith('/'):
        base_url += '/'
    
    url = f"{base_url}process-definition/{definition_id}/xml"
    print(f"Fetching process XML: {url}")
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            xml_data = response.json().get('bpmn20Xml', '')
            
            # Simple parsing to find external task topics
            # This is a basic approach - a more robust solution would use proper XML parsing
            import re
            
            # Look for topic attribute in external task definitions
            topic_matches = re.findall(r'camunda:topic="([^"]+)"', xml_data)
            
            if topic_matches:
                print(f"Found {len(topic_matches)} topic names in process XML: {', '.join(topic_matches)}")
                return topic_matches
            else:
                print("No topic names found in process XML.")
                
    except Exception as e:
        print(f"Error extracting topics from XML: {str(e)}")
    
    return []

def discover_topics_from_camunda(check_active_only=False, prioritize_definition_id=None):
    """
    Discover available topics from Camunda by querying the REST API
    
    Args:
        check_active_only: If True, only check for active tasks without querying process definitions
        prioritize_definition_id: Process definition ID to check first (typically the one just started)
        
    Returns:
        tuple: (active_topics, potential_topics)
            - active_topics: List of topics from currently active tasks
            - potential_topics: List of topics extracted from process definitions
    """
    active_topics = []
    potential_topics = []
    
    base_url = camunda_config.CAMUNDA_ENGINE_URL
    if not base_url.endswith('/'):
        base_url += '/'
        
    # First try to get currently available external tasks
    url = f"{base_url}external-task"
    print(f"Querying Camunda for active tasks: {url}")
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            tasks = response.json()
            topics = set()
            
            for task in tasks:
                topic = task.get('topicName')
                if topic:
                    topics.add(topic)
                    
            if topics:
                print(f"Discovered {len(topics)} topics from active tasks: {', '.join(topics)}")
                active_topics = list(topics)
        
        # If check_active_only is True, only return active topics without checking definitions
        if check_active_only:
            return active_topics, []
                    
        # If no active tasks found or we want all potential topics,
        # try to get process definitions and check their XML
        
        # If we have a priority definition ID, check that first
        if prioritize_definition_id:
            print(f"Prioritizing extraction from recently started process definition: {prioritize_definition_id}")
            xml_topics = extract_topics_from_process_xml(prioritize_definition_id)
            if xml_topics:
                print(f"Found {len(xml_topics)} topics in prioritized process definition: {', '.join(xml_topics)}")
                for topic in xml_topics:
                    if topic not in potential_topics:
                        potential_topics.append(topic)
                        
                # If we found topics in the prioritized definition, return them without checking other definitions
                if potential_topics:
                    print("Using topics from the specified process definition.")
                    return active_topics, potential_topics
                else:
                    print("No topics found in the prioritized process definition. Checking others...")
        
        # If we reach here, we need to check all process definitions
        url = f"{base_url}process-definition"
        if not active_topics:
            print(f"No active tasks found. Querying for process definitions: {url}")
        else:
            print(f"Checking for additional topics in process definitions: {url}")
        
        response = requests.get(url)
        if response.status_code == 200:
            definitions = response.json()
            
            if not definitions:
                print("No process definitions found in Camunda.")
            else:
                print(f"Found {len(definitions)} process definitions. Checking for topic names...")
                
                # Process each definition to extract topics
                for definition in definitions:
                    def_id = definition.get('id')
                    if def_id and def_id != prioritize_definition_id:  # Skip if we already checked it
                        print(f"Checking process definition: {def_id}")
                        xml_topics = extract_topics_from_process_xml(def_id)
                        for topic in xml_topics:
                            if topic not in potential_topics:
                                potential_topics.append(topic)
                
                if potential_topics:
                    print(f"Total potential topics from process definitions: {', '.join(potential_topics)}")
                else:
                    print("No topic names could be extracted from process definitions.")
    except Exception as e:
        print(f"Error querying Camunda: {str(e)}")
    
    # Return both active and potential topics
    return active_topics, potential_topics

# Task handling function with OpenAI Assistant integration
def handle_activity_task(task):
    """Handle a task by routing it to the appropriate service based on service properties"""
    global first_task_done, last_activity_time, assistant_manager, service_orchestrator
    
    # Update the last activity time
    last_activity_time = time.time()
    
    topic_name = task.get_topic_name()
    task_id = task.get_task_id()
    activity_id = task.get_activity_id()
    
    # If this is not the first task, add a short delay to help visualize the process flow
    if first_task_done:
        print(f"\nDelaying processing of task {topic_name} by {TASK_VISUALIZATION_DELAY} seconds to visualize flow...")
        time.sleep(TASK_VISUALIZATION_DELAY)
        print("Continuing with task processing...")
    
    print("\n" + "="*80)
    print(f"TASK RECEIVED: ID={task_id}, Activity={activity_id}, Topic={topic_name}")
    print("="*80)
      # Extract input variables from the task
    variables = task.get_variables()
    print(format_variables_for_display(variables, "INPUT VARIABLES"))
    
    # Determine if this is the first task to include decision context
    if not first_task_done:
        print("\nThis is the first task - including DECISION_CONTEXT")
        if not variables:
            variables = {}
        variables["decision_context"] = DECISION_CONTEXT
        first_task_done = True
      # Process the task with the Service Orchestrator if available
    if service_orchestrator:
        print("\nRouting task to appropriate service via Service Orchestrator...")
        
        # Extract service properties from task
        service_properties = service_orchestrator.extract_service_properties(task)
        print(f"\nExtracted service properties: {json.dumps(service_properties, indent=2)}")
          # Route task to service
        output_variables = service_orchestrator.route_task(task, variables)
    else:        # Try to use OpenAI service directly using service discovery
        openai_service_url = get_openai_service_url_from_orchestrator()
        try:
            print(f"\nAttempting to use OpenAI service at: {openai_service_url}...")
            
            # Get task documentation
            task_documentation = None
            if assistant_manager:
                task_documentation = assistant_manager.get_task_documentation(task)
            
            if task_documentation:
                print("\nFound task documentation/instructions:")
                print("-" * 40)
                print(task_documentation)
                print("-" * 40)
            
            # Check for instruction variable in the task variables
            if variables and "instructions" in variables:
                if task_documentation:
                    print("\nFound both task documentation and instructions variable. Using instructions variable.")
                task_documentation = variables["instructions"]
                print("\nUsing instructions from variables:")
                print("-" * 40)
                print(task_documentation)
                print("-" * 40)            # Process with OpenAI service
            import requests
            
            # Combine task name and documentation into task_description for OpenAI service
            task_description = f"Task: {topic_name}"
            if task_documentation:
                task_description += f"\n\nInstructions: {task_documentation}"
            if variables:
                task_description += f"\n\nContext Variables: {variables}"
            
            # Prepare the request payload
            payload = {
                "task_description": task_description,
                "task_id": task_id,
                "task_name": topic_name,
                "task_documentation": task_documentation,
                "variables": variables,
                "service_properties": {}
            }
              # Get up-to-date service URL using discovery
            openai_service_url = get_openai_service_url_from_orchestrator()
            
            # Send the request to the OpenAI service
            print(f"Sending request to OpenAI service at {openai_service_url}/process_task")
            response = requests.post(
                f"{openai_service_url}/process_task",
                json=payload,
                timeout=300  # 5-minute timeout
            )
            
            if response.status_code == 200:
                result_data = response.json()
                output_variables = result_data.get("result", {})
                print(f"OpenAI service processed task successfully")
            else:
                print(f"Error from OpenAI service: Status {response.status_code}")
                print(response.text)
                raise Exception(f"OpenAI service error: {response.text}")
                
        except Exception as e:
            print(f"\nError using OpenAI service: {str(e)}")
            print("Falling back to direct AssistantManager if available...")
            
            if assistant_manager:
                # Fallback to direct AssistantManager (legacy mode)
                print("\nFalling back to direct AssistantManager...")
                
                # Get task documentation (again, to be safe)
                task_documentation = assistant_manager.get_task_documentation(task)
                if task_documentation:
                    print("\nFound task documentation/instructions:")
                    print("-" * 40)
                    print(task_documentation)
                    print("-" * 40)
                
                # Check for instruction variable in the task variables
                if variables and "instructions" in variables:
                    if task_documentation:
                        print("\nFound both task documentation and instructions variable. Using instructions variable.")
                    task_documentation = variables["instructions"]
                    print("\nUsing instructions from variables:")
                    print("-" * 40)
                    print(task_documentation)
                    print("-" * 40)

                # Process with assistant
                initial_decision_context = DECISION_CONTEXT if not first_task_done else None
                output_variables = assistant_manager.process_task(
                    task_name=topic_name, 
                    task_documentation=task_documentation,
                    variables=variables,
                    decision_context=initial_decision_context
                )
            else:
                print("\nNo OpenAI service or AssistantManager available. Using default processing...")
                # Create default output variables
                output_variables = {
                    "processed_by": "DADM Demonstrator (No Services Available)",
                    "processed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "topic_name": topic_name,
                    f"{topic_name}_result": f"Processed task for {topic_name}"
                }
        else:
            print("\nNeither Service Orchestrator nor OpenAI Assistant available. Using default processing...")
            # Create default output variables
            output_variables = {
                "processed_by": "DADM Demonstrator (No Services Available)",
                "processed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "topic_name": topic_name,
                f"{topic_name}_result": f"Processed task for {topic_name}"
            }
        
        # Add decision context if this is the first task
        if not first_task_done:
            output_variables["decision_context"] = DECISION_CONTEXT
            output_variables["context_summary"] = "UAS selection for disaster response, $2M budget, multiple stakeholders"
            first_task_done = True      # Namespace the output variables to prevent conflicts when parallel streams converge
    # This ensures that outputs from parallel analysis tasks don't overwrite each other
    namespaced_variables = namespace_task_output_variables(topic_name, activity_id, output_variables)
    
    print(format_variables_for_display(namespaced_variables, "OUTPUT VARIABLES"))
      
    # Add this topic to the processed set
    processed_topics.add(topic_name)
    
    # Provide detailed feedback about the completed task
    print("\n" + "-"*40)
    print(f"TASK COMPLETED: Topic={topic_name}")
    print(f"Activity ID: {activity_id}")
    print(f"Task ID: {task_id}")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("-"*40)
    
    # Always provide information about the process, but don't trigger completion checks here
    # Let the periodic check_for_completion function handle the completion decision
    remaining = [t for t in discovered_topics if t not in processed_topics]
    all_topics_processed = discovered_topics and set(discovered_topics).issubset(processed_topics)
    
    if all_topics_processed:
        print("\nAll discovered topics have been processed.")
        print(f"Processed {len(processed_topics)} topics: {', '.join(processed_topics)}")
        print("Will continue monitoring to ensure all workflow tasks are handled...")
    elif remaining:
        print(f"\nStill waiting for topics: {', '.join(remaining)}")
    else:
        print("\nNo remaining expected topics, but monitoring for new ones...")
    
    # Always update the last activity time when a task completes
    last_activity_time = time.time()
    
    # Complete the task with the namespaced output variables
    return task.complete(namespaced_variables)

def monitor_for_tasks(polling_interval=TASK_POLLING_INTERVAL, prioritize_definition_id=None):
    """
    Monitor Camunda for new active tasks
    
    Args:
        polling_interval: Time in seconds between polling attempts
        prioritize_definition_id: Process definition ID to check first (typically the one just started)
    
    Returns:
        list: List of active topics when found
    """
    print(f"\nMonitoring for active tasks (polling every {polling_interval} seconds)...")
    
    attempt = 1
    while True:
        print(f"\nPolling attempt #{attempt} - Checking for active tasks...")
        active_topics, _ = discover_topics_from_camunda(check_active_only=True, prioritize_definition_id=prioritize_definition_id)
        
        if active_topics:
            print(f"Active tasks found with topics: {', '.join(active_topics)}")
            return active_topics
            
        print(f"No active tasks found. Will check again in {polling_interval} seconds...")
        time.sleep(polling_interval)
        attempt += 1

def periodic_topic_monitor(worker, check_interval=TOPIC_MONITOR_INTERVAL, prioritize_definition_id=None):
    """
    Periodically check for new topics and add them to the subscription
    
    Args:
        worker: The ExternalTaskWorker instance
        check_interval: Time in seconds between checks
        prioritize_definition_id: Process definition ID to check first (typically the one just started)
    """
    global discovered_topics, stop_monitoring
    
    print(f"\nStarting periodic topic monitor (checking every {check_interval} seconds)...")
    
    while not stop_monitoring.is_set():
        time.sleep(check_interval)
        
        if stop_monitoring.is_set():
            break
            
        print("\nChecking for new topics in Camunda...")
        active_topics, potential_topics = discover_topics_from_camunda(prioritize_definition_id=prioritize_definition_id)
        
        # Combine all topics
        all_topics = active_topics + [t for t in potential_topics if t not in active_topics]
        
        # Find new topics
        new_topics = [t for t in all_topics if t not in discovered_topics]
        
        if new_topics:
            print(f"Found {len(new_topics)} new topics: {', '.join(new_topics)}")
            
            # Update the discovered topics
            discovered_topics.extend(new_topics)
            
            # Subscribe to the new topics
            try:
                for topic in new_topics:
                    print(f"Adding subscription to new topic: {topic}")
                    # This would require custom worker implementation to support dynamic subscriptions
                    # For now, we'll just update our tracking so we know these topics exist
                
            except Exception as e:
                print(f"Error subscribing to new topics: {str(e)}")
        else:
            print("No new topics found.")
    
    print("Topic monitor stopped.")

def check_for_completion():
    """Check if there have been no new tasks for a while and set completion flag if so"""
    global last_activity_time, stop_monitoring, current_process_instance_id, discovered_topics, processed_topics
    
    current_time = time.time()
    idle_time = current_time - last_activity_time
    
    # Check if all discovered topics have been processed
    all_topics_processed = discovered_topics and set(discovered_topics).issubset(processed_topics)
    
    # Check for active tasks directly with Camunda
    active_tasks = []
    try:
        base_url = camunda_config.CAMUNDA_ENGINE_URL
        if not base_url.endswith('/'):
            base_url += '/'
        
        # Check if we have a process instance ID to filter by
        if current_process_instance_id:
            url = f"{base_url}external-task?processInstanceId={current_process_instance_id}"
            print(f"Checking for active tasks in process instance: {current_process_instance_id}")
        else:
            url = f"{base_url}external-task"
            print(f"Checking for all active tasks (no specific process instance)")
            
        response = requests.get(url)
        if response.status_code == 200:
            active_tasks = response.json()
            active_topics = set(task.get('topicName') for task in active_tasks if task.get('topicName'))
            if active_topics:
                print(f"Still have active tasks for topics: {', '.join(active_topics)}")
    except Exception as e:
        print(f"Error checking for active tasks: {str(e)}")
    
    # Check if process instance is still active (if we know which one we're tracking)
    process_completed = False
    if current_process_instance_id:
        try:
            process_completed = check_process_instance_status(current_process_instance_id)
            if process_completed:
                print(f"\nProcess instance {current_process_instance_id} has completed!")
        except Exception as e:
            print(f"Error checking process instance status: {str(e)}")
    
    # REVISED COMPLETION LOGIC:
    # 1. If there are active tasks, continue running (highest priority)
    # 2. If process instance is explicitly reported as completed by Camunda, we're done
    # 3. If no active tasks AND all known topics processed, we're done
    # 4. Only use extended idle timeout as a failsafe, and only if no active tasks
    
    # Active tasks check - HIGHEST PRIORITY
    # If there are active tasks, we should ALWAYS continue regardless of idle time
    if active_tasks:
        print(f"\nThere are {len(active_tasks)} active tasks. Continuing execution...")
        # Reset our idle timer since there are active tasks to process
        last_activity_time = time.time()
        threading.Timer(COMPLETION_CHECK_INTERVAL, check_for_completion).start()
        return
    
    # Case 1: Process instance completed = done
    if process_completed:
        print(f"\nProcess instance {current_process_instance_id} is no longer active. Workflow is complete.")
        print(f"Processed topics: {', '.join(processed_topics)}")
        
        print("\n*** WORKFLOW EXECUTION COMPLETED: PROCESS INSTANCE FINISHED ***\n")
        
        # Signal threads to stop
        stop_monitoring.set()
        execution_completed.set()
        return
    
    # Case 2: No active tasks + all topics processed = done
    if not active_tasks and all_topics_processed:
        print(f"\nNo active tasks remain in Camunda and all discovered topics have been processed.")
        print(f"Processed topics: {', '.join(processed_topics)}")
        
        print("\n*** WORKFLOW EXECUTION COMPLETED: ALL TOPICS PROCESSED ***\n")
        
        # Signal threads to stop
        stop_monitoring.set()
        execution_completed.set()
        return
    
    # Case 3: No active tasks + no process instance = done
    if not active_tasks and not current_process_instance_id:
        print(f"\nNo active tasks remain in Camunda and no specific process instance is being tracked.")
        print(f"Processed topics: {', '.join(processed_topics)}")
        
        print("\n*** WORKFLOW EXECUTION COMPLETED: NO ACTIVE TASKS ***\n")
        
        # Signal threads to stop
        stop_monitoring.set()
        execution_completed.set()
        return
        
    # Case 4: Idle for VERY long + no active tasks = probably done (failsafe only)
    # Only terminate due to idle timeout if there are no active tasks
    if not active_tasks and idle_time >= (IDLE_THRESHOLD * 3):  # Use a much longer threshold (tripled)
        print(f"\nNo active tasks and no activity detected in the last {idle_time:.1f} seconds (extended threshold: {IDLE_THRESHOLD * 3}s).")
        print(f"Processed topics: {', '.join(processed_topics)}")
        
        # Show missing topics if any
        missing_topics = [t for t in discovered_topics if t not in processed_topics]
        if missing_topics:
            print(f"Missing topics that were not processed: {', '.join(missing_topics)}")
        
        print("\n*** WORKFLOW EXECUTION COMPLETED DUE TO EXTENDED IDLE TIMEOUT (FAILSAFE) ***\n")
        
        # Signal threads to stop
        stop_monitoring.set()
        execution_completed.set()
        return
        
    # If we get here, we're still waiting for tasks
    print(f"\nStill waiting for activity. Idle time: {idle_time:.1f}s. Continuing to wait...")
    threading.Timer(COMPLETION_CHECK_INTERVAL, check_for_completion).start()

def find_process_definition_by_name(process_name):
    """
    Find a process definition by name in Camunda
    
    Args:
        process_name: The name of the process to find
        
    Returns:
        str: The ID of the process definition, or None if not found
    """
    base_url = camunda_config.CAMUNDA_ENGINE_URL
    if not base_url.endswith('/'):
        base_url += '/'
    
    # Query for process definitions with the given name
    url = f"{base_url}process-definition?name={process_name}"
    print(f"Looking for process definition with name: {process_name}")
    print(f"Querying: {url}")
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            definitions = response.json()
            
            if not definitions:
                print(f"No process definition found with name: {process_name}")
                return None
            
            # Use the latest version of the process definition
            # Sort by version (descending) and take the first one
            if len(definitions) > 1:
                definitions.sort(key=lambda d: int(d.get('version', 0)), reverse=True)
                print(f"Found {len(definitions)} versions of the process. Using the latest (version {definitions[0].get('version')}).")
            
            definition = definitions[0]
            def_id = definition.get('id')
            
            print(f"Found process definition: {def_id}")
            print(f"Key: {definition.get('key')}, Version: {definition.get('version')}")
            
            return def_id
        else:
            print(f"Error querying Camunda API: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error finding process definition: {str(e)}")
    
    return None

def start_process_instance(process_def_id, variables=None):
    """
    Start a new instance of a process
    
    Args:
        process_def_id: The ID of the process definition
        variables: Optional dictionary of variables to pass to the process
        
    Returns:
        dict: Information about the started process instance, or None if failed
    """
    base_url = camunda_config.CAMUNDA_ENGINE_URL
    if not base_url.endswith('/'):
        base_url += '/'
    
    url = f"{base_url}process-definition/{process_def_id}/start"
    print(f"Starting new process instance: {url}")
    
    payload = {
        "variables": {}
    }
    
    # Add any initial variables if provided
    if variables:
        for key, value in variables.items():
            payload["variables"][key] = {"value": value}
    
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            instance = response.json()
            print(f"Successfully started process instance: {instance.get('id')}")
            print(f"Definition ID: {instance.get('definitionId')}")
            print(f"Business Key: {instance.get('businessKey')}")
            return instance
        else:
            print(f"Error starting process instance: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error starting process instance: {str(e)}")
    
    return None

def start_process_by_name(process_name, variables=None):
    """
    Find and start a process by name
    
    Args:
        process_name: The name of the process to start
        variables: Optional dictionary of variables to pass to the process
        
    Returns:
        dict: Information about the started process instance, or None if failed
    """
    process_def_id = find_process_definition_by_name(process_name)
    
    if not process_def_id:
        print(f"Could not find process definition with name '{process_name}'")
        return None
    
    return start_process_instance(process_def_id, variables)

def list_process_definitions():
    """
    List all process definitions on the Camunda server
    
    Returns:
        int: The number of process definitions found, or -1 if an error occurred
    """
    base_url = camunda_config.CAMUNDA_ENGINE_URL
    if not base_url.endswith('/'):
        base_url += '/'
    
    url = f"{base_url}process-definition"
    print(f"Querying process definitions: {url}")
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            definitions = response.json()
            
            if not definitions:
                print("No process definitions found on Camunda server.")
                return 0
            
            # Sort by name and version
            definitions.sort(key=lambda d: (d.get('name', ''), -int(d.get('version', 0))))
            
            print("\n" + "="*80)
            print("PROCESS DEFINITIONS ON CAMUNDA SERVER")
            print("="*80)
            print(f"Found {len(definitions)} process definitions:\n")
            
            # Determine column widths
            name_width = max(len("Name"), max(len(d.get('name', '')) for d in definitions))
            key_width = max(len("Key"), max(len(d.get('key', '')) for d in definitions))
            id_width = max(len("ID"), max(len(d.get('id', '')) for d in definitions))
            
            # Print header
            header_format = f"{{:<{name_width}}}  {{:<{key_width}}}  {{:<8}}  {{:<{id_width}}}"
            print(header_format.format("Name", "Key", "Version", "ID"))
            print("-" * (name_width + key_width + id_width + 14))
            
            # Print each definition
            row_format = f"{{:<{name_width}}}  {{:<{key_width}}}  {{:<8}}  {{:<{id_width}}}"
            for definition in definitions:
                name = definition.get('name', 'N/A')
                key = definition.get('key', 'N/A')
                version = definition.get('version', 'N/A')
                def_id = definition.get('id', 'N/A')
                
                print(row_format.format(name, key, version, def_id))
            
            return len(definitions)
        else:
            print(f"Error querying Camunda API: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error listing process definitions: {str(e)}")
    
    return -1

def parse_arguments():
    """Parse command-line arguments"""
    parser = argparse.ArgumentParser(description="DADM Demonstrator for Decision Analysis with Camunda and OpenAI")
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # Main app arguments
    parser.add_argument('--start-process', '-s', type=str, 
                        help='Name of the process to start on Camunda server')
    parser.add_argument('--variables', '-v', type=str,
                        help='JSON string of variables to pass to the process')
    parser.add_argument('--monitor-only', '-m', action='store_true',
                        help='Only monitor for tasks without starting a process')
    parser.add_argument('--timeout', '-t', type=int, default=600,
                        help='Maximum time to wait for task completion in seconds (default: 600)')
    parser.add_argument('--list', '-l', action='store_true',
                        help='List available process definitions on the Camunda server')
    
    # Deploy subcommand
    deploy_parser = subparsers.add_parser('deploy', 
                                         help='Deploy BPMN models to Camunda server',
                                         description='Deploy BPMN model files from the camunda_models directory to a Camunda BPM server')
    deploy_parser.epilog = "Examples:\n  dadm deploy list\n  dadm deploy model my_process\n  dadm deploy model my_process.bpmn -s http://camunda-server:8080\n  dadm deploy all\n  dadm deploy services\n  dadm deploy services --list-only"
    deploy_subparsers = deploy_parser.add_subparsers(dest='deploy_command', help='Deploy command to execute')
    
    # List models command
    list_parser = deploy_subparsers.add_parser('list', 
                                             help='List available BPMN models',
                                             description='List all available BPMN model files in the camunda_models directory')
    
    # Deploy a specific model
    model_parser = deploy_subparsers.add_parser('model', 
                                              help='Deploy a specific BPMN model',
                                              description='Deploy a specific BPMN model file to the Camunda BPM server')
    model_parser.add_argument('model_name', help='Name of the model to deploy (with or without .bpmn extension, e.g., "my_process" or "my_process.bpmn")')
    model_parser.add_argument('-s', '--server', default='http://localhost:8080', 
                           help='Camunda server URL (default: http://localhost:8080)')
      # Deploy all models
    all_parser = deploy_subparsers.add_parser('all', 
                                            help='Deploy all BPMN models',
                                            description='Deploy all BPMN model files from the camunda_models directory to the Camunda BPM server')
    all_parser.add_argument('-s', '--server', default='http://localhost:8080', 
                          help='Camunda server URL (default: http://localhost:8080)')
    
    # Deploy services to Consul
    services_parser = deploy_subparsers.add_parser('services', 
                                                 help='Deploy services to Consul',
                                                 description='Register DADM services with Consul service discovery')
    services_parser.add_argument('--consul-url', default='http://localhost:8500',
                               help='Consul server URL (default: http://localhost:8500)')
    services_parser.add_argument('--list-only', action='store_true',
                               help='Only list available services without registering them')
    services_parser.add_argument('--no-browser', action='store_true',
                               help='Do not open Consul UI in browser')
      # Analysis subcommand
    analysis_parser = subparsers.add_parser('analysis',
                                          help='Analysis data management commands',
                                          description='Manage analysis data storage and processing')
    analysis_parser.epilog = "Examples:\n  dadm analysis daemon\n  dadm analysis status\n  dadm analysis process --once"
    analysis_subparsers = analysis_parser.add_subparsers(dest='analysis_command', help='Analysis command to execute')
      # Analysis daemon command
    daemon_parser = analysis_subparsers.add_parser('daemon', 
                                                  help='Start analysis processing daemon',
                                                  description='Start background daemon for processing analysis data')
    daemon_parser.add_argument('--interval', type=int, default=30, 
                              help='Processing interval in seconds (default: 30)')
    daemon_parser.add_argument('--batch-size', type=int, default=10,
                              help='Number of tasks to process per batch (default: 10)')
    daemon_parser.add_argument('--no-vector-store', action='store_true',
                              help='Disable vector store processing')
    daemon_parser.add_argument('--no-graph-db', action='store_true',
                              help='Disable graph database processing')
    daemon_parser.add_argument('--storage-dir', type=str,
                              help='Storage directory for analysis data')
    daemon_parser.add_argument('--detach', action='store_true',
                              help='Run daemon in background and release terminal')
    daemon_parser.add_argument('--log-file', type=str,
                              help='Log file for background daemon (default: logs/analysis_daemon.log)')
    
    # Analysis stop command
    stop_parser = analysis_subparsers.add_parser('stop',
                                                help='Stop background analysis daemon',
                                                description='Stop running background analysis daemon')
    stop_parser.add_argument('--storage-dir', type=str,
                           help='Storage directory for analysis data')
    
    # Analysis restart command
    restart_parser = analysis_subparsers.add_parser('restart',
                                                   help='Restart background analysis daemon',
                                                   description='Restart background analysis daemon with previous settings')
    restart_parser.add_argument('--storage-dir', type=str,
                               help='Storage directory for analysis data')
    
    # Analysis status command
    status_parser = analysis_subparsers.add_parser('status',
                                                  help='Show analysis system status',
                                                  description='Display status of analysis storage and processing')
    status_parser.add_argument('--storage-dir', type=str,
                              help='Storage directory for analysis data')
      # Analysis list command
    list_parser = analysis_subparsers.add_parser('list',
                                                help='List recent analysis runs',
                                                description='Display recent analysis runs with key information')
    list_parser.add_argument('--limit', type=int, default=10,
                           help='Number of recent analyses to show (default: 10)')
    list_parser.add_argument('--thread-id', type=str,
                           help='Filter by specific thread ID')
    list_parser.add_argument('--session-id', type=str,
                           help='Filter by specific session ID')
    list_parser.add_argument('--process-id', type=str,
                           help='Filter by specific process instance ID')
    list_parser.add_argument('--service', type=str,
                           help='Filter by source service')    
    list_parser.add_argument('--tags', nargs='*',
                           help='Filter by tags')
    list_parser.add_argument('--detailed', action='store_true',
                           help='Show detailed information for each analysis')
    list_parser.add_argument('--get-openai-url', action='store_true',
                           help='Generate OpenAI Playground URL for the process (requires --process-id)')
    list_parser.add_argument('--storage-dir', type=str,
                           help='Storage directory for analysis data')

    # Analysis process command
    process_parser = analysis_subparsers.add_parser('process',
                                                   help='Process pending analysis tasks',
                                                   description='Process pending analysis tasks manually')
    process_parser.add_argument('--once', action='store_true',
                               help='Process once and exit (don\'t run as daemon)')
    process_parser.add_argument('--limit', type=int, default=10,
                               help='Number of tasks to process (default: 10)')
    process_parser.add_argument('--processor-type', choices=['vector_store', 'graph_db'],
                               help='Specific processor type to run')
    process_parser.add_argument('--storage-dir', type=str,
                               help='Storage directory for analysis data')

    # Docker subcommand
    docker_parser = subparsers.add_parser('docker',
                                        help='Run Docker Compose commands',
                                        description='Execute Docker Compose commands using the docker-compose.yml file in the docker directory')
    docker_parser.epilog = "Examples:\n  dadm docker up\n  dadm docker down\n  dadm docker up -d --build\n  dadm docker ps"
    # Use REMAINDER to capture all remaining arguments without parsing them
    docker_parser.add_argument('docker_args', nargs=argparse.REMAINDER, help='Arguments to pass to docker-compose command')

    return parser.parse_args()

def handle_analysis_command(args):
    """Handle analysis subcommands"""
    from colorama import init, Fore, Style
    init()  # Initialize colorama
    
    if args.analysis_command == 'daemon':
        # Start analysis processing daemon
        print(f"{Fore.CYAN}Starting Analysis Processing Daemon...{Style.RESET_ALL}")
        
        try:
            # Import daemon manager
            from src.daemon_manager import DaemonManager
            
            daemon_manager = DaemonManager("analysis_daemon", args.storage_dir)
            
            if args.detach:
                # Start in detached mode
                if daemon_manager.is_running():
                    print(f"{Fore.YELLOW}Analysis daemon is already running (PID: {daemon_manager.get_pid()}){Style.RESET_ALL}")
                    return 0
                
                # Prepare arguments for the daemon script
                daemon_args = [
                    '--interval', str(args.interval),
                    '--batch-size', str(args.batch_size)
                ]
                
                if args.no_vector_store:
                    daemon_args.append('--no-vector-store')
                if args.no_graph_db:
                    daemon_args.append('--no-graph-db')
                if args.storage_dir:
                    daemon_args.extend(['--storage-dir', args.storage_dir])
                
                # Get daemon script path
                script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'analysis_processing_daemon.py')
                script_path = os.path.abspath(script_path)
                  # Save configuration
                import time
                config = {
                    'interval': args.interval,
                    'batch_size': args.batch_size,
                    'no_vector_store': args.no_vector_store,
                    'no_graph_db': args.no_graph_db,
                    'storage_dir': args.storage_dir,
                    'log_file': args.log_file,
                    'started_at': time.time()
                }
                daemon_manager.save_config(config)
                
                # Start daemon
                log_file = args.log_file or "logs/analysis_daemon.log"
                success = daemon_manager.start_detached(script_path, daemon_args, log_file)
                
                if success:
                    pid = daemon_manager.get_pid()
                    print(f"{Fore.GREEN}✅ Analysis daemon started in background!{Style.RESET_ALL}")
                    print(f"  PID: {pid}")
                    print(f"  Processing interval: {args.interval} seconds")
                    print(f"  Batch size: {args.batch_size}")
                    print(f"  Vector store: {'disabled' if args.no_vector_store else 'enabled'}")
                    print(f"  Graph database: {'disabled' if args.no_graph_db else 'enabled'}")
                    print(f"  Log file: {log_file}")
                    print(f"\n{Fore.CYAN}Use 'dadm analysis status' to check daemon status{Style.RESET_ALL}")
                    print(f"{Fore.CYAN}Use 'dadm analysis stop' to stop the daemon{Style.RESET_ALL}")
                    return 0
                else:
                    print(f"{Fore.RED}❌ Failed to start analysis daemon{Style.RESET_ALL}")
                    return 1
            
            else:
                # Start in foreground mode (original behavior)
                import sys
                from pathlib import Path
                
                # Add scripts directory to path
                scripts_dir = Path(__file__).parent.parent / "scripts"
                sys.path.insert(0, str(scripts_dir))
                
                from analysis_processing_daemon import AnalysisProcessingDaemon
                
                # Create daemon with args
                daemon = AnalysisProcessingDaemon(
                    storage_dir=args.storage_dir,
                    enable_vector_store=not args.no_vector_store,
                    enable_graph_db=not args.no_graph_db,
                    process_interval=args.interval,
                    batch_size=args.batch_size
                )
                
                print(f"{Fore.GREEN}Analysis daemon started in foreground!{Style.RESET_ALL}")
                print(f"  Processing interval: {args.interval} seconds")
                print(f"  Batch size: {args.batch_size}")
                print(f"  Vector store: {'disabled' if args.no_vector_store else 'enabled'}")
                print(f"  Graph database: {'disabled' if args.no_graph_db else 'enabled'}")
                print(f"\n{Fore.YELLOW}Press Ctrl+C to stop the daemon{Style.RESET_ALL}")
                print(f"{Fore.CYAN}Tip: Use --detach flag to run in background{Style.RESET_ALL}")
                
                # Start daemon
                daemon.start()
                
        except ImportError as e:
            print(f"{Fore.RED}Error: Could not import required modules: {e}{Style.RESET_ALL}")
            return 1
        except Exception as e:
            print(f"{Fore.RED}Error starting analysis daemon: {e}{Style.RESET_ALL}")
            return 1
    
    elif args.analysis_command == 'stop':
        # Stop background analysis daemon
        print(f"{Fore.CYAN}Stopping Analysis Daemon...{Style.RESET_ALL}")
        
        try:
            from src.daemon_manager import DaemonManager
            
            daemon_manager = DaemonManager("analysis_daemon", args.storage_dir)
            
            if not daemon_manager.is_running():
                print(f"{Fore.YELLOW}Analysis daemon is not running{Style.RESET_ALL}")
                return 0
            
            pid = daemon_manager.get_pid()
            success = daemon_manager.stop()
            
            if success:
                print(f"{Fore.GREEN}✅ Analysis daemon stopped successfully (was PID: {pid}){Style.RESET_ALL}")
                return 0
            else:
                print(f"{Fore.RED}❌ Failed to stop analysis daemon{Style.RESET_ALL}")
                return 1
                
        except Exception as e:
            print(f"{Fore.RED}Error stopping analysis daemon: {e}{Style.RESET_ALL}")
            return 1
    
    elif args.analysis_command == 'restart':
        # Restart background analysis daemon
        print(f"{Fore.CYAN}Restarting Analysis Daemon...{Style.RESET_ALL}")
        
        try:
            from src.daemon_manager import DaemonManager
            
            daemon_manager = DaemonManager("analysis_daemon", args.storage_dir)
            
            # Get previous configuration
            config = daemon_manager.get_config()
            if not config:
                print(f"{Fore.RED}No previous daemon configuration found. Use 'dadm analysis daemon' to start.{Style.RESET_ALL}")
                return 1
            
            # Prepare arguments from config
            daemon_args = [
                '--interval', str(config.get('interval', 30)),
                '--batch-size', str(config.get('batch_size', 10))
            ]
            
            if config.get('no_vector_store'):
                daemon_args.append('--no-vector-store')
            if config.get('no_graph_db'):
                daemon_args.append('--no-graph-db')
            if config.get('storage_dir'):
                daemon_args.extend(['--storage-dir', config['storage_dir']])
            
            # Get daemon script path
            script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'analysis_processing_daemon.py')
            script_path = os.path.abspath(script_path)
            
            success = daemon_manager.restart(script_path, daemon_args)
            
            if success:
                pid = daemon_manager.get_pid()
                print(f"{Fore.GREEN}✅ Analysis daemon restarted successfully (PID: {pid}){Style.RESET_ALL}")
                return 0
            else:
                print(f"{Fore.RED}❌ Failed to restart analysis daemon{Style.RESET_ALL}")
                return 1
                
        except Exception as e:
            print(f"{Fore.RED}Error restarting analysis daemon: {e}{Style.RESET_ALL}")
            return 1
            
    elif args.analysis_command == 'list':
        # List recent analysis runs
        print(f"{Fore.CYAN}Recent Analysis Runs{Style.RESET_ALL}")
        
        try:
            # Import analysis data manager
            import sys
            from pathlib import Path
            project_root = Path(__file__).parent.parent
            sys.path.insert(0, str(project_root))
            
            from src.analysis_data_manager import AnalysisDataManager
            
            data_manager = AnalysisDataManager(storage_dir=args.storage_dir)
              # Build filters
            filters = {}
            if args.thread_id:
                filters['thread_id'] = args.thread_id
            if args.session_id:
                filters['session_id'] = args.session_id
            if args.tags:
                filters['tags'] = args.tags
            
            # Handle process_id filtering separately since search_analyses doesn't support it directly
            if args.process_id:
                # We'll filter by process_instance_id after getting results
                pass
              # Search analyses
            analyses = data_manager.search_analyses(
                limit=args.limit * 2 if args.process_id else args.limit,  # Get more if we need to filter by process_id
                **filters
            )
            
            # Filter by process ID if specified (since search_analyses doesn't support it directly)
            if args.process_id:
                analyses = [a for a in analyses if a.metadata.process_instance_id == args.process_id]
                # Limit to requested number after filtering
                analyses = analyses[:args.limit]
              # Filter by service if specified
            if args.service:
                analyses = [a for a in analyses if a.metadata.source_service == args.service]
            
            # Handle OpenAI URL generation if requested
            if args.get_openai_url:
                if not args.process_id:
                    print(f"{Fore.RED}Error: --get-openai-url requires --process-id to be specified{Style.RESET_ALL}")
                    data_manager.close()
                    return 1
                
                # Find analysis with OpenAI thread information for this process
                openai_analysis = None
                for analysis in analyses:
                    if (analysis.output_data and 
                        'thread_id' in analysis.output_data and 
                        'assistant_id' in analysis.output_data):
                        openai_analysis = analysis
                        break
                
                if not openai_analysis:
                    print(f"{Fore.RED}No OpenAI thread information found for process {args.process_id}{Style.RESET_ALL}")
                    data_manager.close()
                    return 1
                
                assistant_id = openai_analysis.output_data['assistant_id']
                thread_id = openai_analysis.output_data['thread_id']
                
                # Generate OpenAI Playground URL
                playground_url = f"https://platform.openai.com/playground/assistants?assistant={assistant_id}&thread={thread_id}"
                
                print(f"\n{Fore.GREEN}OpenAI Playground URL for process {args.process_id}:{Style.RESET_ALL}")
                print(f"{playground_url}")
                print(f"\n{Fore.CYAN}Assistant ID:{Style.RESET_ALL} {assistant_id}")
                print(f"{Fore.CYAN}Thread ID:{Style.RESET_ALL} {thread_id}")
                
                data_manager.close()
                return 0
            
            if not analyses:
                print(f"\n{Fore.YELLOW}No analyses found matching the criteria.{Style.RESET_ALL}")
                data_manager.close()
                return 0
            
            print(f"\n{Fore.GREEN}Found {len(analyses)} analyses:{Style.RESET_ALL}")
            print()
            
            # Display analyses
            for i, analysis in enumerate(analyses, 1):
                metadata = analysis.metadata
                
                # Format timestamps
                created_at = metadata.created_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(metadata.created_at, 'strftime') else str(metadata.created_at)
                
                # Basic information
                print(f"{Fore.CYAN}[{i}] Analysis ID:{Style.RESET_ALL} {metadata.analysis_id}")
                print(f"    Task: {metadata.task_name}")
                print(f"    Service: {metadata.source_service}")
                print(f"    Created: {created_at}")
                print(f"    Status: {metadata.status.value if hasattr(metadata.status, 'value') else metadata.status}")
                
                # Thread and session info
                if metadata.thread_id:
                    print(f"    Thread ID: {metadata.thread_id}")
                if metadata.session_id:
                    print(f"    Session ID: {metadata.session_id}")
                if metadata.process_instance_id:
                    print(f"    Process ID: {metadata.process_instance_id}")
                
                # Tags
                if metadata.tags:
                    tags_str = ", ".join(metadata.tags)
                    print(f"    Tags: {tags_str}")
                
                # OpenAI specific info
                if analysis.output_data:
                    if 'thread_id' in analysis.output_data:
                        print(f"    OpenAI Thread: {analysis.output_data['thread_id']}")
                    if 'assistant_id' in analysis.output_data:
                        print(f"    OpenAI Assistant: {analysis.output_data['assistant_id']}")
                
                # Detailed view
                if args.detailed:
                    # Input data summary
                    if analysis.input_data:
                        input_keys = list(analysis.input_data.keys())
                        print(f"    Input Keys: {', '.join(input_keys[:5])}")
                        if len(input_keys) > 5:
                            print(f"                ... and {len(input_keys) - 5} more")
                    
                    # Output data summary
                    if analysis.output_data:
                        output_keys = list(analysis.output_data.keys())
                        print(f"    Output Keys: {', '.join(output_keys[:5])}")
                        if len(output_keys) > 5:
                            print(f"                 ... and {len(output_keys) - 5} more")
                    
                    # Processing status
                    processing_status = data_manager.get_processing_status(metadata.analysis_id)
                    if processing_status.get('tasks'):
                        completed_tasks = len([t for t in processing_status['tasks'] if t['status'] == 'completed'])
                        total_tasks = len(processing_status['tasks'])
                        print(f"    Processing: {completed_tasks}/{total_tasks} tasks completed")
                
                print()  # Empty line between analyses
            
            # Show summary
            if len(analyses) >= args.limit:
                print(f"{Fore.YELLOW}Showing first {args.limit} results. Use --limit to see more.{Style.RESET_ALL}")
            
            data_manager.close()
            
        except Exception as e:
            print(f"{Fore.RED}Error listing analyses: {e}{Style.RESET_ALL}")
            import traceback
            print(f"{Fore.RED}Details: {traceback.format_exc()}{Style.RESET_ALL}")
            return 1
            
    elif args.analysis_command == 'status':
        # Show analysis system status
        print(f"{Fore.CYAN}Analysis System Status{Style.RESET_ALL}")
        
        try:
            # Import daemon manager
            from src.daemon_manager import DaemonManager
            
            daemon_manager = DaemonManager("analysis_daemon", args.storage_dir)
            daemon_status = daemon_manager.get_status()
            
            # Show daemon status
            print(f"\n{Fore.GREEN}Daemon Status:{Style.RESET_ALL}")
            if daemon_status['running']:
                print(f"  Status: {Fore.GREEN}Running{Style.RESET_ALL} (PID: {daemon_status['pid']})")
                config = daemon_status['config']
                if config:
                    print(f"  Interval: {config.get('interval', 'unknown')} seconds")
                    print(f"  Batch size: {config.get('batch_size', 'unknown')}")
                    print(f"  Vector store: {'disabled' if config.get('no_vector_store') else 'enabled'}")
                    print(f"  Graph database: {'disabled' if config.get('no_graph_db') else 'enabled'}")
                    if 'started_at' in config:
                        import time
                        uptime = time.time() - config['started_at']
                        hours, remainder = divmod(uptime, 3600)
                        minutes, seconds = divmod(remainder, 60)
                        print(f"  Uptime: {int(hours):02d}:{int(minutes):02d}:{int(seconds):02d}")
            else:
                print(f"  Status: {Fore.RED}Not Running{Style.RESET_ALL}")
                print(f"  Use 'dadm analysis daemon --detach' to start in background")
            
            # Import analysis data manager for storage stats
            import sys
            from pathlib import Path
            project_root = Path(__file__).parent.parent
            sys.path.insert(0, str(project_root))
            
            from src.analysis_data_manager import AnalysisDataManager
            
            data_manager = AnalysisDataManager(storage_dir=args.storage_dir)
            stats = data_manager.get_stats()
            
            print(f"\n{Fore.GREEN}Storage Statistics:{Style.RESET_ALL}")
            print(f"  Total analyses: {stats['total_analyses']}")
            print(f"  Processing task status: {stats.get('processing_task_status', {})}")
            print(f"  Vector store enabled: {stats['backends_enabled']['vector_store']}")
            print(f"  Graph database enabled: {stats['backends_enabled']['graph_db']}")
            
            data_manager.close()
            
        except Exception as e:
            print(f"{Fore.RED}Error getting analysis status: {e}{Style.RESET_ALL}")
            return 1
            
    elif args.analysis_command == 'process':
        # Process pending analysis tasks
        print(f"{Fore.CYAN}Processing Analysis Tasks...{Style.RESET_ALL}")
        
        try:
            # Import analysis data manager
            import sys
            from pathlib import Path
            project_root = Path(__file__).parent.parent
            sys.path.insert(0, str(project_root))
            
            from src.analysis_data_manager import AnalysisDataManager
            
            data_manager = AnalysisDataManager(storage_dir=args.storage_dir)
            
            if args.once:
                # Process once
                processed = data_manager.process_pending_tasks(
                    limit=args.limit,
                    processor_type=args.processor_type
                )
                print(f"{Fore.GREEN}Processed {processed} tasks{Style.RESET_ALL}")
            else:
                print(f"{Fore.YELLOW}Use --once flag to process tasks manually{Style.RESET_ALL}")
                print(f"{Fore.YELLOW}For continuous processing, use: dadm analysis daemon{Style.RESET_ALL}")
            
            data_manager.close()
            
        except Exception as e:
            print(f"{Fore.RED}Error processing analysis tasks: {e}{Style.RESET_ALL}")
            return 1
    
    else:
        print(f"{Fore.RED}Unknown analysis command: {args.analysis_command}{Style.RESET_ALL}")
        return 1
    
    return 0


def run_docker_command(args):
    """Run a Docker Compose command with the provided arguments"""
    from colorama import init, Fore, Style
    init()  # Initialize colorama
    
    # Find docker-compose.yml file
    docker_dir = os.path.join(project_root, "docker")
    docker_compose_file = os.path.join(docker_dir, "docker-compose.yml")
    
    if not os.path.exists(docker_compose_file):
        print(f"{Fore.RED}Error: docker-compose.yml not found at {docker_compose_file}{Style.RESET_ALL}")
        return 1
    
    # Ensure args is a list (not tuple or other sequence)
    if not isinstance(args, list):
        args = list(args)
        
    # Remove any empty strings from args
    args = [arg for arg in args if arg]
    
    # Build the command
    docker_compose_cmd = ["docker", "compose", "-f", docker_compose_file]
    docker_compose_cmd.extend(args)
    
    print(f"{Fore.CYAN}Executing Docker command: {' '.join(docker_compose_cmd)}{Style.RESET_ALL}")
    
    try:
        # Run the Docker Compose command
        result = subprocess.run(docker_compose_cmd, cwd=project_root, check=False)
        
        if result.returncode == 0:
            print(f"{Fore.GREEN}Docker command completed successfully{Style.RESET_ALL}")
        else:
            print(f"{Fore.RED}Docker command failed with exit code: {result.returncode}{Style.RESET_ALL}")
        
        return result.returncode
    
    except Exception as e:
        print(f"{Fore.RED}Error executing Docker command: {str(e)}{Style.RESET_ALL}")
        return 1

def verify_assistant_configuration():
    """
    Verify that assistant ID is correctly configured before starting the process
    Returns True if verification succeeded, False otherwise
    """
    print("Verifying assistant configuration...")
    try:
        # Check for assistant_id.json in logs directory
        logs_dir = os.path.join(project_root, "logs")
        assistant_id_file = os.path.join(logs_dir, "assistant_id.json")
        
        # Create logs directory if it doesn't exist
        if not os.path.exists(logs_dir):
            os.makedirs(logs_dir)
            print(f"Created logs directory at: {logs_dir}")
            
        if not os.path.exists(assistant_id_file):
            print("Warning: No assistant_id.json found")
            return False
            
        # Read the file
        with open(assistant_id_file, 'r') as f:
            data = json.load(f)
            stored_id = data.get("assistant_id")
            
        if not stored_id:
            print("Warning: No assistant ID found in assistant_id.json")
            return False        # Check service registry
        try:
            # Try to get assistant ID from environment or config
            registry_id = os.environ.get("OPENAI_ASSISTANT_ID")
            
            if not registry_id:
                print("Warning: No assistant ID found in service registry")
                # Use stored ID as fallback
                registry_id = stored_id
                print(f"Updated service registry with ID: {stored_id}")
            elif registry_id != stored_id:
                print(f"Warning: Assistant ID mismatch - registry: {registry_id}, stored: {stored_id}")
                # Update environment to match stored ID
                os.environ["OPENAI_ASSISTANT_ID"] = stored_id
                print(f"Updated environment with ID: {stored_id}")
        except Exception as e:
            print(f"Warning: Could not verify service registry: {e}")
        
        # Set environment variable
        os.environ["OPENAI_ASSISTANT_ID"] = stored_id
        
        print(f"Assistant configuration verified (ID: {stored_id})")
        return True
    except Exception as e:
        print(f"Error verifying assistant configuration: {e}")
        return False

def run_setup():
    """Run the setup script to create necessary directories and files."""
    try:
        setup_script = os.path.join(project_root, "scripts", "setup.py")
        if os.path.exists(setup_script):
            print("Running setup script...")
            setup_result = subprocess.run([sys.executable, setup_script], check=True)
            if setup_result.returncode == 0:
                print("Setup completed successfully")
                
                # Check if dadm command is available
                import shutil
                dadm_command = shutil.which("dadm")
                if not dadm_command:
                    print("Warning: The 'dadm' command is not available in the PATH.")
                    print("You may need to run: pip install -e .")
                
                return True
            else:
                print(f"Setup script failed with exit code: {setup_result.returncode}")
        else:
            print(f"Setup script not found at: {setup_script}")
    except Exception as e:
        print(f"Error running setup script: {e}")
    return False

def check_process_instance_status(process_instance_id):
    """
    Checks if a process instance is still active or has completed
    
    Args:
        process_instance_id: The ID of the process instance to check
        
    Returns:
        bool: True if process has completed, False if still active
    """
    print(f"\nChecking status for process instance: {process_instance_id}")
    base_url = camunda_config.CAMUNDA_ENGINE_URL
    if not base_url.endswith('/'):
        base_url += '/'
    
    url = f"{base_url}process-instance/{process_instance_id}"
    
    try:
        response = requests.get(url)
        # If we get a 404, the process instance no longer exists (completed)
        if response.status_code == 404:
            print(f"Process instance {process_instance_id} has completed (no longer exists)")
            return True
            
        # If we get a 200, check the status
        elif response.status_code == 200:
            # Process instance exists, it's still active
            print(f"Process instance {process_instance_id} is still active")
            return False
            
        else:
            print(f"Error checking process instance status: {response.status_code}")
            print(f"Response: {response.text}")
            # Default to assuming it's still active if we can't determine
            return False
    except Exception as e:
        print(f"Error checking process instance status: {str(e)}")
        # Default to assuming it's still active if we can't determine
        return False

def detect_parallel_workflow(process_def_id=None, process_name=None):
    """
    Detect if we're dealing with a parallel workflow that requires concurrent task processing
    
    Args:
        process_def_id: Process definition ID to check
        process_name: Process name to check if process_def_id is not provided
        
    Returns:
        bool: True if this is a parallel workflow, False otherwise
    """
    try:
        # Check by process name first
        if process_name:
            for parallel_name in camunda_config.PARALLEL_PROCESS_NAMES:
                if parallel_name.lower() in process_name.lower():
                    print(f"Detected parallel workflow by name: {process_name}")
                    return True
        
        # Check by process definition ID
        if process_def_id:
            base_url = camunda_config.CAMUNDA_ENGINE_URL
            if not base_url.endswith('/'):
                base_url += '/'
            
            # Get process definition details
            url = f"{base_url}process-definition/{process_def_id}"
            response = requests.get(url)
            
            if response.status_code == 200:
                definition = response.json()
                def_name = definition.get('name', '')
                def_key = definition.get('key', '')
                
                # Check name and key against parallel process patterns
                for parallel_name in camunda_config.PARALLEL_PROCESS_NAMES:
                    if (parallel_name.lower() in def_name.lower() or 
                        parallel_name.lower() in def_key.lower()):
                        print(f"Detected parallel workflow by definition: {def_name} (key: {def_key})")
                        return True
                
                # Also check XML for parallel gateways as additional detection
                xml_url = f"{base_url}process-definition/{process_def_id}/xml"
                xml_response = requests.get(xml_url)
                if xml_response.status_code == 200:
                    xml_data = xml_response.json().get('bpmn20Xml', '')
                    if 'parallelGateway' in xml_data:
                        print(f"Detected parallel gateways in process definition: {def_name}")
                        return True
    
    except Exception as e:
        print(f"Error detecting parallel workflow: {str(e)}")
    
    return False

def get_optimal_max_tasks(process_def_id=None, process_name=None):
    """
    Determine the optimal maxTasks setting based on workflow type
    
    Args:
        process_def_id: Process definition ID
        process_name: Process name
        
    Returns:
        int: Optimal maxTasks value
    """
    if detect_parallel_workflow(process_def_id, process_name):
        print(f"Using parallel workflow configuration: maxTasks = {camunda_config.MAX_TASKS_PARALLEL}")
        return camunda_config.MAX_TASKS_PARALLEL
    else:
        print(f"Using sequential workflow configuration: maxTasks = {camunda_config.MAX_TASKS}")
        return camunda_config.MAX_TASKS

def main():
    global assistant_manager, service_orchestrator, current_process_instance_id
    args = parse_arguments()
    
    print("="*80)
    print("DADM DEMONSTRATOR STARTING")
    print("="*80)
      # Handle docker subcommand
    if args.command == 'docker':
        if not args.docker_args:
            print("Error: No Docker command specified")
            print("Examples:")
            print("  dadm docker up")
            print("  dadm docker down")
            print("  dadm docker up -d --build")
            print("  dadm docker ps")
            return 1
        return run_docker_command(args.docker_args)
    
    # Handle analysis subcommand
    if args.command == 'analysis':
        return handle_analysis_command(args)
        
    # Handle deploy subcommand
    if args.command == 'deploy':
        from scripts.deploy_bpmn import get_all_models, deploy_model, get_model_path
        from colorama import init, Fore, Style
        init()  # Initialize colorama
        
        if args.deploy_command == 'list':
            # List all available models
            model_paths = get_all_models()
            if not model_paths:
                print(f"{Fore.YELLOW}No BPMN models found in the camunda_models folder.{Style.RESET_ALL}")
                return 0
                
            print(f"{Fore.CYAN}Available BPMN models in the camunda_models folder:{Style.RESET_ALL}")
            for i, model_path in enumerate(model_paths, 1):
                model_name = os.path.basename(model_path)
                print(f"  {i}. {model_name}")
            return 0
            
        elif args.deploy_command == 'model':
            # Deploy a specific model
            model_path = get_model_path(args.model_name)
              # Check if server is reachable
           
            import requests
            server_url = args.server
            if not server_url.startswith('http'):
                server_url = f"http://{server_url}"
            server_url = server_url.rstrip('/')
            
            try:
                requests.head(server_url, timeout=5)
            except requests.exceptions.RequestException:
                print(f"{Fore.RED}Error: Cannot connect to Camunda server at {server_url}{Style.RESET_ALL}")
                print(f"{Fore.YELLOW}Make sure the server is running and the URL is correct.{Style.RESET_ALL}")
                return 1
            
            if deploy_model(model_path, server_url):
                print(f"{Fore.GREEN}Model deployment successful{Style.RESET_ALL}")
                return 0
            else:
                print(f"{Fore.RED}Model deployment failed{Style.RESET_ALL}")
                return 1
                
        elif args.deploy_command == 'all':
            # Deploy all models
            model_paths = get_all_models()
            if not model_paths:
                print(f"{Fore.YELLOW}No BPMN models found in the camunda_models folder.{Style.RESET_ALL}")
                return 0
              # Check if server is reachable
            import requests
            server_url = args.server
            if not server_url.startswith('http'):
                server_url = f"http://{server_url}"
            server_url = server_url.rstrip('/')
            try:
                requests.head(server_url, timeout=5)
            except requests.exceptions.RequestException:
                print(f"{Fore.RED}Error: Cannot connect to Camunda server at {server_url}{Style.RESET_ALL}")
                print(f"{Fore.YELLOW}Make sure the server is running and the URL is correct.{Style.RESET_ALL}")
                return 1
            
            print(f"{Fore.CYAN}Found {len(model_paths)} BPMN models to deploy.{Style.RESET_ALL}")
            
            success_count = 0
            failure_count = 0
            for model_path in model_paths:
                if deploy_model(model_path, server_url):
                    success_count += 1
                else:
                    failure_count += 1
            
            print(f"\n{Fore.CYAN}Deployment Summary:{Style.RESET_ALL}")
            print(f"  - Successfully deployed: {Fore.GREEN}{success_count}{Style.RESET_ALL}")
            if failure_count > 0:
                print(f"  - Failed deployments: {Fore.RED}{failure_count}{Style.RESET_ALL}")
                return 1
            return 0
            
        elif args.deploy_command == 'services':
            # Deploy services to Consul
            try:
                # Import and run the Consul service deployment script
                script_path = os.path.join(project_root, "scripts", "deploy_consul_services.py")
                
                # Add scripts directory to path to allow imports
                scripts_dir = os.path.join(project_root, "scripts")
                if scripts_dir not in sys.path:
                    sys.path.insert(0, scripts_dir)
                
                # Import and run the deployment function
                from deploy_consul_services import main as deploy_services_main
                
                return deploy_services_main(
                    consul_url=args.consul_url,
                    list_only=args.list_only,
                    no_browser=args.no_browser
                )
                
            except ImportError as e:
                print(f"{Fore.RED}Error: Could not import consul service deployment script: {e}{Style.RESET_ALL}")
                return 1
            except Exception as e:
                print(f"{Fore.RED}Error deploying services: {e}{Style.RESET_ALL}")
                return 1
        else:
            print("Please specify a valid deploy command: list, model, all, or services")
            return 1
    
    print(f"Connecting to Camunda Engine at: {camunda_config.CAMUNDA_ENGINE_URL}")
    
    # Check if we should just list process definitions
    if args.list:
        list_process_definitions()
        return    # Run setup to ensure all directories and files exist
    run_setup()    # Verify assistant configuration through the OpenAI service
    print("\nVerifying OpenAI assistant configuration through service...")
    # Make sure we have requests module
    import requests
      # Use service discovery to get the URL
    openai_service_url = get_openai_service_url_from_orchestrator()
    print(f"Using OpenAI service at: {openai_service_url}")
    
    try:
        # Try to connect to the OpenAI service
        response = requests.get(f"{openai_service_url}/verify_assistant_config")
        if response.status_code == 200:
            data = response.json()
            print(f"OpenAI service verified assistant configuration: {data.get('assistant_id')}")
        else:
            print(f"WARNING: OpenAI service could not verify configuration: {response.status_code}")
            print(f"Response: {response.text}")
            # Fall back to direct verification
            verify_assistant_configuration()
    except Exception as e:
        print(f"WARNING: Could not connect to OpenAI service: {e}")
        print("Falling back to direct assistant verification...")
        verify_assistant_configuration()    # Initialize Service Orchestrator
    try:
        print("\nInitializing Service Orchestrator...")
        service_orchestrator = ServiceOrchestrator()
        print("Service Orchestrator successfully initialized")
        
        # Check if we should initialize the OpenAI Assistant through the service
        if openai_config.OPENAI_API_KEY:
            print("\nDiscovering and checking OpenAI Assistant service...")
            try:                # Use service discovery to get the URL
                openai_service_url = get_openai_service_url_from_orchestrator()
                print(f"Using OpenAI service at: {openai_service_url}")
                
                # Check service status
                service_response = requests.get(f"{openai_service_url}/status")
                if service_response.status_code == 200:
                    status_data = service_response.json()
                    if status_data.get("status") == "operational":
                        print(f"OpenAI Assistant service is operational")
                        assistant_manager = None  # Service handles everything
                    else:
                        print(f"OpenAI Assistant service needs initialization...")
                        data_dir = os.path.join(project_root, "data")
                        init_response = requests.post(
                            f"{openai_service_url}/initialize", 
                            json={"data_dir": data_dir}
                        )
                        if init_response.status_code == 200:
                            print(f"OpenAI Assistant service initialized successfully")
                            assistant_manager = None  # Service handles everything
                        else:
                            print(f"ERROR: Could not initialize OpenAI Assistant service: {init_response.text}")
                            print("Main application cannot function without OpenAI service")
                            assistant_manager = None
                else:
                    print(f"ERROR: OpenAI Assistant service not available. Status: {service_response.status_code}")
                    print("Main application cannot function without OpenAI service")
                    assistant_manager = None            
            except Exception as service_error:
                print(f"ERROR: Could not connect to OpenAI Assistant service: {service_error}")
                print("Main application cannot function without OpenAI service")
                assistant_manager = None
        else:
            print("WARNING: OPENAI_API_KEY environment variable is not set.")
            print("Service Orchestrator will use available services only.")
    except Exception as e:
        print(f"Error initializing Service Orchestrator: {str(e)}")
        print("ERROR: Cannot continue without Service Orchestrator")
        print("The main application requires the service architecture to function properly")
        return 1
    
    # Check if we should start a process
    if args.start_process:
        print(f"\nAttempting to start process: {args.start_process}")
        
        # Parse variables if provided
        variables = None
        if args.variables:
            try:
                variables = json.loads(args.variables)
                print(f"Using variables: {json.dumps(variables, indent=2)}")
            except json.JSONDecodeError as e:
                print(f"Error parsing variables JSON: {str(e)}")
                print("Proceeding without variables.")
        
        # Start the process
        process_instance = start_process_by_name(args.start_process, variables)
        
        if not process_instance:
            print(f"Failed to start process: {args.start_process}")
            if args.monitor_only:
                print("Continuing in monitor-only mode...")
            else:
                print("Exiting.")
                return
        
        # Set the current process instance ID for tracking
        if process_instance:
            current_process_instance_id = process_instance.get('id')
            print(f"Tracking process instance ID: {current_process_instance_id}")
                
        # Get the definition ID of the started process to prioritize it when discovering topics
        if process_instance:
            started_process_def_id = process_instance.get('definitionId')
        else:
            started_process_def_id = None
    elif args.monitor_only:
        print("\nRunning in monitor-only mode. Will watch for tasks but not start any processes.")
        started_process_def_id = None
    else:
        started_process_def_id = None
    
    # Dynamically discover topics from Camunda, prioritizing the started process if applicable
    global discovered_topics
    active_topics, potential_topics = discover_topics_from_camunda(prioritize_definition_id=started_process_def_id)
    
    # Decide which topics to subscribe to
    if active_topics:
        # If we have active topics, use those
        discovered_topics = active_topics
        print(f"Found active tasks. Will subscribe to topics: {', '.join(discovered_topics)}")
    elif potential_topics:
        # If we have potential topics from process definitions, use those and wait for tasks
        discovered_topics = potential_topics
        print(f"No active tasks found, but discovered potential topics from process definitions.")
        print(f"Will subscribe to potential topics: {', '.join(discovered_topics)}")
        print("\nWaiting for tasks to become active...")
    else:
        # If no topics found at all, monitor until tasks appear
        print("No topics discovered from Camunda (neither active nor potential).")
        print("Monitoring for tasks to become active...")
        
        # Wait for tasks to appear
        discovered_topics = monitor_for_tasks(prioritize_definition_id=started_process_def_id)
        print(f"Will subscribe to topics: {', '.join(discovered_topics)}")
    
    # Determine optimal worker configuration based on workflow type
    optimal_max_tasks = get_optimal_max_tasks(
        process_def_id=started_process_def_id,
        process_name=args.start_process if hasattr(args, 'start_process') and args.start_process else None
    )
    
    # Create worker and subscribe to topics
    worker = ExternalTaskWorker(
        worker_id=camunda_config.WORKER_ID,
        base_url=camunda_config.CAMUNDA_ENGINE_URL,
        config={
            "maxTasks": optimal_max_tasks, 
            "lockDuration": WORKER_LOCK_DURATION, 
            "asyncResponseTimeout": camunda_config.POLL_INTERVAL
        }
    )

    print("\nStarting worker...")
    
    try:
        # Start the worker in a separate thread
        worker_thread = threading.Thread(target=worker.subscribe, args=(discovered_topics, handle_activity_task))
        worker_thread.daemon = False  # Don't terminate thread when main thread exits
        worker_thread.start()
        
        # Start the periodic topic monitor in a separate thread
        monitor_thread = threading.Thread(target=periodic_topic_monitor, args=(worker,), kwargs={"prioritize_definition_id": started_process_def_id})
        monitor_thread.daemon = True  # Allow monitor thread to exit when main thread exits
        monitor_thread.start()
        
        # Give some time for initial tasks to be retrieved before starting the completion checker
        # This prevents premature termination if tasks aren't immediately visible
        print(f"\nAllowing time for initial task discovery before starting completion detection...")
        time.sleep(2) # Brief delay to let worker initialize
        
        # Start the completion checker with an appropriate delay
        print(f"Starting workflow completion detection (checking every {COMPLETION_CHECK_INTERVAL} seconds)...")
        threading.Timer(COMPLETION_CHECK_INTERVAL, check_for_completion).start()
        
        # Wait for completion or timeout (use command-line argument if provided)
        timeout_seconds = args.timeout if hasattr(args, 'timeout') else 600  # Default: 10 minutes
        print(f"Waiting up to {timeout_seconds} seconds for all topics to be processed...")
        completed = execution_completed.wait(timeout_seconds)
        
        if completed:
            print("\nSuccessfully processed all discovered topics!")
            print(f"Processed: {', '.join(processed_topics)}")
        else:
            print(f"\nTimed out after {timeout_seconds} seconds.")
            print(f"Processed topics: {', '.join(processed_topics)}")
            print(f"Missing topics: {', '.join([t for t in discovered_topics if t not in processed_topics])}")
            
        # Allow time for final task completion
        print(f"Allowing {FINAL_CLEANUP_DELAY} seconds for final cleanup...")
        time.sleep(FINAL_CLEANUP_DELAY)
    except KeyboardInterrupt:
        print("\nInterrupted by user. Shutting down...")
    except Exception as e:
        print(f"\nError in worker: {str(e)}")
    finally:
        # Signal all monitoring threads to stop
        stop_monitoring.set()
        
        # Perform assistant cleanup if necessary
        if assistant_manager:
            try:
                assistant_manager.cleanup()
            except Exception as e:
                print(f"Error during assistant cleanup: {str(e)}")
        
        print("\nExecution complete.")
        print("\nSummary:")
        print(f"- Discovered topics: {', '.join(discovered_topics)}")
        print(f"- Processed topics: {', '.join(processed_topics)}")
        print(f"- Missing topics: {', '.join([t for t in discovered_topics if t not in processed_topics])}")
        
        # Force exit the script to terminate all threads
        os._exit(0)

if __name__ == "__main__":
    # Usage examples:
    # python app.py                           # Just monitor for tasks
    # python app.py --start-process "DADM Demo Process"   # Start a specific process and monitor
    # python app.py -s "DADM Demo Process" -v '{"variable1":"value1"}'  # Start with variables
    # python app.py -m                        # Monitor-only mode (won't exit if start fails)
    # python app.py -t 300                    # Set timeout to 5 minutes (300 seconds)
    # python app.py -l                        # List all process definitions on the Camunda server    # python app.py deploy list               # List all BPMN models
    # python app.py deploy model "MyModel"    # Deploy a specific BPMN model
    # python app.py deploy all                # Deploy all BPMN models
    # python app.py deploy services           # Deploy services to Consul
    # python app.py deploy services --list-only  # List available services without deploying
    # python app.py docker up                 # Start Docker containers
    # python app.py docker down               # Stop Docker containers
    # python app.py docker up -d --build      # Start Docker containers in detached mode with build
    main()
