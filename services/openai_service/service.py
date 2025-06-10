"""
OpenAI Assistant Service

This service exposes the functionality of the OpenAI Assistant API as a microservice.
It uses name-based discovery to find assistants by name rather than storing IDs locally.
All assistant metadata is discovered dynamically from OpenAI using the assistant name from config.
"""
import os
import sys
import json
import logging
import time
import uuid
from datetime import datetime
from flask import Flask, request, jsonify
import openai
import sys
import os

# Add the project root to the Python path for absolute imports
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

try:
    from src.data_persistence_manager import DataPersistenceManager
except ImportError:
    DataPersistenceManager = None
    
from services.openai_service.consul_registry import ConsulServiceRegistry
from services.openai_service.name_based_assistant_manager import NameBasedAssistantManager
from services.openai_service import config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load service configuration
def load_service_config():
    """Load service configuration from service_config.json"""
    config_path = os.path.join(os.path.dirname(__file__), "service_config.json")
    try:
        with open(config_path, 'r') as f:
            config_data = json.load(f)
            return config_data.get('service', {})
    except Exception as e:
        logger.warning(f"Could not load service config from {config_path}: {e}")
        return {
            "name": "dadm-openai-assistant",
            "type": "assistant",
            "port": 5000,
            "health_endpoint": "/health",
            "description": "DADM OpenAI Assistant Service for Decision Analysis",
            "version": "1.0.0"
        }

# Load service configuration
SERVICE_CONFIG = load_service_config()
SERVICE_NAME = SERVICE_CONFIG.get('name', 'dadm-openai-assistant')

# Assistant configuration from service config
ASSISTANT_CONFIG = SERVICE_CONFIG.get('assistant', {})
ASSISTANT_NAME = ASSISTANT_CONFIG.get('name', 'DADM Decision Analysis Assistant')
ASSISTANT_MODEL = ASSISTANT_CONFIG.get('model', 'gpt-4o')
ASSISTANT_INSTRUCTIONS = ASSISTANT_CONFIG.get('instructions', """You are a Decision Analysis Assistant specialized in helping analyze complex decisions.

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

Work through the decision process step-by-step, maintaining context from previous tasks
in the workflow.""")

# Initialize Flask app
app = Flask(__name__)

def initialize_persistence_manager():
    """Initialize DataPersistenceManager if available"""
    global persistence_manager, current_run_id, _persistence_initialized
    
    if _persistence_initialized:
        return
        
    logger.info("Attempting to initialize DataPersistenceManager...")
    logger.info(f"DataPersistenceManager import status: {DataPersistenceManager is not None}")
    
    if DataPersistenceManager:
        try:
            logger.info("Creating DataPersistenceManager instance...")
            persistence_manager = DataPersistenceManager(
                qdrant_host=os.environ.get('QDRANT_HOST', 'localhost'),
                qdrant_port=int(os.environ.get('QDRANT_PORT', '6333')),
                neo4j_uri=os.environ.get('NEO4J_URI', 'bolt://localhost:7687'),
                neo4j_user=os.environ.get('NEO4J_USER', 'neo4j'),
                neo4j_password=os.environ.get('NEO4J_PASSWORD', 'password'),
                embedding_model=os.environ.get('EMBEDDING_MODEL', 'all-MiniLM-L6-v2')
            )
            # Generate a run ID for this service session
            current_run_id = persistence_manager.generate_run_id("openai_service")
            logger.info(f"Data persistence manager initialized with run ID: {current_run_id}")
            _persistence_initialized = True
        except Exception as e:
            logger.warning(f"Failed to initialize data persistence manager: {e}")
            persistence_manager = None
    else:
        logger.warning("DataPersistenceManager not available - data persistence disabled")

@app.before_request
def ensure_persistence_initialized():
    """Ensure persistence manager is initialized before handling requests"""
    initialize_persistence_manager()

# Global service instances - only name-based manager and persistence
openai_client = None
name_based_manager = None
persistence_manager = None
current_run_id = None

# Task tracking to prevent duplicate processing
# processed_tasks maps task_id (str) to a dict result
processed_tasks: dict[str, dict] = {}

# Flag to track if persistence manager has been initialized
_persistence_initialized = False

def get_openai_client():
    """Get or initialize the OpenAI client"""
    global openai_client
    
    if openai_client is None:
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        openai_client = openai.OpenAI(api_key=api_key)
        
    return openai_client

def get_name_based_manager():
    """Get or initialize the name-based assistant manager"""
    global name_based_manager
    
    if name_based_manager is None:
        client = get_openai_client()
        name_based_manager = NameBasedAssistantManager(
            client, 
            assistant_name=ASSISTANT_NAME,
            assistant_model=ASSISTANT_MODEL,
            assistant_instructions=ASSISTANT_INSTRUCTIONS
        )
        logger.info(f"Initialized name-based assistant manager for: {ASSISTANT_NAME}")
        
        # Ensure assistant is ready - run rebuild script if necessary
        logger.info("Checking if assistant setup is complete...")
        readiness_result = name_based_manager.ensure_assistant_ready()
        
        if readiness_result["success"]:
            if readiness_result["action"] == "rebuild":
                logger.info("Assistant was rebuilt successfully")
            else:
                logger.info("Assistant is ready")
        else:
            logger.error(f"Failed to ensure assistant readiness: {readiness_result['message']}")
            # Don't fail startup, but log the issue
    
    return name_based_manager

def get_memory_usage():
    """Get current memory usage in MB"""
    try:
        import psutil
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / 1024 / 1024  # Convert to MB
    except ImportError:
        return 0.0  # Return 0 if psutil is not available
    except Exception:
        return -1  # Other error

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    global persistence_manager, current_run_id
    
    return jsonify({
        "status": "healthy", 
        "service": SERVICE_NAME,
        "processed_tasks": len(processed_tasks),
        "data_persistence": "active" if persistence_manager else "inactive",
        "current_run_id": current_run_id,
        "approach": "name_based_discovery"
    })

@app.route('/metrics', methods=['GET'])
def metrics():
    """Metrics endpoint for monitoring"""
    global persistence_manager, current_run_id
    
    metrics_data = {
        "service": SERVICE_NAME,
        "processed_tasks_count": len(processed_tasks),
        "active_since": processed_tasks.get("service_start_time", "unknown"),
        "memory_usage_mb": get_memory_usage(),
        "approach": "name_based_discovery"
    }
    
    # Add data persistence metrics if available
    if persistence_manager:
        metrics_data.update({
            "data_persistence": "active",
            "current_run_id": current_run_id,
            "databases": ["qdrant", "neo4j"]
        })
    else:
        metrics_data["data_persistence"] = "inactive"
    
    return jsonify(metrics_data)

@app.route('/status', methods=['GET'])
def status():
    """Status endpoint with detailed information using name-based discovery"""
    global persistence_manager, current_run_id
    
    try:
        manager = get_name_based_manager()
        
        # Get current assistant info by name
        assistant = manager.get_or_create_assistant()
        if not assistant:
            return jsonify({
                "status": "error",
                "message": "Could not find or create assistant",
                "approach": "name_based_discovery"
            }), 500
        
        # Get associated resources
        vector_stores = manager.get_assistant_vector_stores(assistant.id)
        files = manager.get_assistant_files(assistant.id)
        
        # Prepare persistence status information
        persistence_status = {
            "active": persistence_manager is not None,
            "current_run_id": current_run_id
        }
        
        if persistence_manager:
            persistence_status.update({
                "qdrant_host": persistence_manager.qdrant_host,
                "qdrant_port": persistence_manager.qdrant_port,
                "neo4j_uri": persistence_manager.neo4j_uri,
                "qdrant_collection": persistence_manager.qdrant_collection,
                "embedding_model": persistence_manager.embedding_model.__class__.__name__ if persistence_manager.embedding_model else None
            })
        
        return jsonify({
            "status": "operational",
            "assistant_id": assistant.id,
            "assistant_name": assistant.name,
            "thread_id": manager.get_session_thread_id(),
            "vector_stores_count": len(vector_stores),
            "files_count": len(files),
            "processed_tasks": list(processed_tasks.keys()),
            "data_persistence": persistence_status,
            "approach": "name_based_discovery"
        })
        
    except Exception as e:
        logger.error(f"Error getting status: {e}")
        return jsonify({
            "status": "error",
            "message": f"Error getting status: {str(e)}",
            "approach": "name_based_discovery"
        }), 500

@app.route('/metadata', methods=['GET'])
def get_metadata():
    """Get core OpenAI service metadata using name-based discovery"""
    try:
        manager = get_name_based_manager()
        
        # Get current assistant info by name
        assistant = manager.get_or_create_assistant()
        if not assistant:
            return jsonify({
                "status": "error",
                "message": "Could not find or create assistant",
                "approach": "name_based_discovery"
            }), 500
        
        # Get associated resources
        vector_stores = manager.get_assistant_vector_stores(assistant.id)
        files = manager.get_assistant_files(assistant.id)
        
        return jsonify({
            "status": "success",
            "assistant_id": assistant.id,
            "assistant_name": assistant.name,
            "vector_store_count": len(vector_stores),
            "file_count": len(files),
            "approach": "name_based_discovery",
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting metadata: {e}")
        return jsonify({
            "status": "error",
            "message": f"Error getting metadata: {str(e)}",
            "approach": "name_based_discovery"
        }), 500

@app.route('/metadata/full', methods=['GET'])
def get_full_metadata():
    """Get detailed OpenAI service metadata using name-based discovery"""
    try:
        manager = get_name_based_manager()
        
        # Get current assistant info by name
        assistant = manager.get_or_create_assistant()
        if not assistant:
            return jsonify({
                "status": "error",
                "message": "Could not find or create assistant",
                "approach": "name_based_discovery"
            }), 500
        
        # Get associated resources
        vector_stores = manager.get_assistant_vector_stores(assistant.id)
        files = manager.get_assistant_files(assistant.id)
        
        # Build detailed metadata
        full_metadata = {
            "assistant": {
                "id": assistant.id,
                "name": assistant.name,
                "model": assistant.model,
                "instructions": assistant.instructions,
                "tools": [tool.type for tool in assistant.tools] if assistant.tools else [],
                "created_at": assistant.created_at
            },            "vector_stores": [
                {
                    "id": vs.id,
                    "name": vs.name,
                    "status": vs.status,
                    "file_counts": {
                        "in_progress": vs.file_counts.in_progress if hasattr(vs.file_counts, 'in_progress') else 0,
                        "completed": vs.file_counts.completed if hasattr(vs.file_counts, 'completed') else 0,
                        "cancelled": vs.file_counts.cancelled if hasattr(vs.file_counts, 'cancelled') else 0,
                        "failed": vs.file_counts.failed if hasattr(vs.file_counts, 'failed') else 0,
                        "total": vs.file_counts.total if hasattr(vs.file_counts, 'total') else 0
                    } if vs.file_counts else {},
                    "created_at": vs.created_at
                }
                for vs in vector_stores
            ],"files": [
                {
                    "id": file["id"],
                    "filename": file["filename"],
                    "status": file["status"],
                    "vector_store_id": file["vector_store_id"],
                    "vector_store_name": file["vector_store_name"]
                }
                for file in files
            ]
        }
        
        return jsonify({
            "status": "success",
            "metadata": full_metadata,
            "approach": "name_based_discovery",
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting full metadata: {e}")
        return jsonify({
            "status": "error",
            "message": f"Error getting full metadata: {str(e)}",
            "approach": "name_based_discovery"
        }), 500

@app.route('/initialize', methods=['POST'])
def initialize():
    """Initialize the OpenAI assistant service using name-based discovery"""
    global persistence_manager, current_run_id, processed_tasks
    
    try:
        data = request.json or {}
        
        # Initialize the name-based manager (will create or find assistant by name)
        manager = get_name_based_manager()
        assistant = manager.get_or_create_assistant()
        
        if not assistant:
            return jsonify({
                "status": "error",
                "message": "Failed to initialize or create assistant",
                "approach": "name_based_discovery"
            }), 500
          # Initialize processed tasks tracking
        processed_tasks = {"service_start_time": time.strftime("%Y-%m-%d %H:%M:%S")}        # Initialize persistence manager if not already done
        if not persistence_manager and DataPersistenceManager:
            try:
                persistence_manager = DataPersistenceManager(
                    qdrant_host=os.environ.get('QDRANT_HOST', 'localhost'),
                    qdrant_port=int(os.environ.get('QDRANT_PORT', '6333')),
                    neo4j_uri=os.environ.get('NEO4J_URI', 'bolt://localhost:7687'),
                    neo4j_user=os.environ.get('NEO4J_USER', 'neo4j'),
                    neo4j_password=os.environ.get('NEO4J_PASSWORD', 'password'),
                    embedding_model=os.environ.get('EMBEDDING_MODEL', 'all-MiniLM-L6-v2')
                )
                logger.info("Data persistence manager initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize data persistence manager: {e}")
                persistence_manager = None
        
        # Generate a run ID for tracking this execution
        if persistence_manager:
            current_run_id = persistence_manager.generate_run_id("openai_service")
            logger.info(f"Generated new run ID: {current_run_id}")
        
        # Get current resources
        vector_stores = manager.get_assistant_vector_stores(assistant.id)
        files = manager.get_assistant_files(assistant.id)
        
        return jsonify({
            "status": "success",
            "message": f"Service initialized successfully using name-based discovery",
            "assistant_id": assistant.id,
            "assistant_name": assistant.name,
            "vector_stores_count": len(vector_stores),
            "files_count": len(files),
            "data_persistence": "active" if persistence_manager else "inactive",
            "approach": "name_based_discovery"
        })
        
    except Exception as e:
        logger.error(f"Error initializing service: {e}")
        return jsonify({
            "status": "error",
            "message": f"Error initializing service: {str(e)}",
            "approach": "name_based_discovery"
        }), 500

@app.route('/process_task', methods=['POST'])
def process_task():
    """Process a task using the OpenAI assistant with name-based discovery"""
    global current_run_id, processed_tasks, persistence_manager
    
    try:
        data = request.json
        if not data or 'task_description' not in data:
            return jsonify({
                "status": "error", 
                "message": "task_description is required",
                "approach": "name_based_discovery"
            }), 400
        
        task_description = data['task_description']
        task_id = data.get('task_id', str(uuid.uuid4()))
        
        # Check if this task was already processed
        if task_id in processed_tasks:
            logger.info(f"Task {task_id} already processed, returning cached result")
            return jsonify(processed_tasks[task_id])
        
        # Get the name-based manager and process the task
        manager = get_name_based_manager()
        result = manager.process_task(task_description)
          # Store the result
        processed_result = {
            "status": "success",
            "task_id": task_id,
            "result": result,
            "timestamp": datetime.now().isoformat(),
            "approach": "name_based_discovery"
        }
        processed_tasks[task_id] = processed_result        # Store interaction in databases if persistence manager is available
        if persistence_manager and current_run_id:
            try:
                # Extract the actual response content from the result
                # NameBasedAssistantManager returns "recommendation" not "response"
                actual_response = result.get("recommendation", result.get("response", ""))
                
                # Try to parse the response as JSON for semantic expansion
                recommendation_data = actual_response
                if isinstance(actual_response, str):
                    try:
                        # Try to parse as JSON first
                        parsed_json = json.loads(actual_response)
                        recommendation_data = parsed_json
                        logger.info(f"Parsed response as structured JSON with {len(parsed_json) if isinstance(parsed_json, dict) else 0} keys")
                    except:
                        # If not JSON, create a simple structure for text responses
                        recommendation_data = {
                            "response_text": actual_response,
                            "response_type": "text",
                            "task_type": task_description.split(":")[0] if ":" in task_description else "analysis"
                        }
                        logger.info(f"Using text response structure for semantic expansion")
                
                task_data = {
                    "task_name": task_description or "OpenAI Decision Process",
                    "assistant_id": ASSISTANT_NAME,
                    "thread_id": task_id,  # Using task_id as thread_id for tracking
                    "processed_at": datetime.now().isoformat(),
                    "processed_by": "OpenAI Assistant Service",
                    "recommendation": recommendation_data  # Use the parsed or structured data
                }
                
                # Store with semantic expansion
                persistence_manager.store_interaction(
                    run_id=current_run_id,
                    process_instance_id=task_id,
                    task_data=task_data,
                    decision_context=task_description
                )
                logger.info(f"Stored interaction for task {task_id} with semantic expansion (data type: {type(recommendation_data)})")
            except Exception as e:
                logger.warning(f"Failed to store interaction in persistence layer: {e}")
                logger.exception("Full traceback for persistence error:")
        
        return jsonify(processed_result)
        
    except Exception as e:
        logger.error(f"Error processing task: {e}")
        return jsonify({
            "status": "error",
            "message": f"Error processing task: {str(e)}",
            "approach": "name_based_discovery"
        }), 500

@app.route('/upload_files', methods=['POST'])
def upload_files():
    """Upload files to the assistant using name-based discovery"""
    try:
        manager = get_name_based_manager()
        
        if 'files' not in request.files:
            return jsonify({
                "status": "error",
                "message": "No files provided",
                "approach": "name_based_discovery"
            }), 400
        
        files = request.files.getlist('files')
        upload_results = []
        
        for file in files:
            if file.filename:
                try:
                    result = manager.upload_file(file)
                    upload_results.append(result)
                except Exception as e:
                    logger.error(f"Error uploading file {file.filename}: {e}")
                    upload_results.append({
                        "filename": file.filename,
                        "status": "error",
                        "message": str(e)
                    })
        
        return jsonify({
            "status": "success",
            "uploads": upload_results,
            "approach": "name_based_discovery"
        })
        
    except Exception as e:
        logger.error(f"Error uploading files: {e}")
        return jsonify({
            "status": "error",
            "message": f"Error uploading files: {str(e)}",
            "approach": "name_based_discovery"
        }), 500

@app.route('/files', methods=['GET'])
def list_files():
    """List all files associated with the assistant using name-based discovery"""
    try:
        manager = get_name_based_manager()
        assistant = manager.get_or_create_assistant()
        
        if not assistant:
            return jsonify({
                "status": "error",
                "message": "Could not find assistant",
                "approach": "name_based_discovery"
            }), 500
        
        files = manager.get_assistant_files(assistant.id)
        
        files_info = [
            {
                "id": file.id,
                "filename": file.filename,
                "purpose": file.purpose,
                "status": file.status,
                "created_at": file.created_at,
                "bytes": file.bytes
            }
            for file in files
        ]
        
        return jsonify({
            "status": "success",
            "files": files_info,
            "count": len(files_info),
            "approach": "name_based_discovery"
        })
        
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        return jsonify({
            "status": "error",
            "message": f"Error listing files: {str(e)}",
            "approach": "name_based_discovery"
        }), 500

@app.route('/vector_stores', methods=['GET'])
def list_vector_stores():
    """List all vector stores associated with the assistant using name-based discovery"""
    try:
        manager = get_name_based_manager()
        assistant = manager.get_or_create_assistant()
        
        if not assistant:
            return jsonify({
                "status": "error",
                "message": "Could not find assistant",
                "approach": "name_based_discovery"
            }), 500
        
        vector_stores = manager.get_assistant_vector_stores(assistant.id)
        
        vs_info = [
            {
                "id": vs.id,
                "name": vs.name,
                "status": vs.status,
                "file_counts": vs.file_counts,
                "created_at": vs.created_at
            }
            for vs in vector_stores
        ]
        
        return jsonify({
            "status": "success",
            "vector_stores": vs_info,
            "count": len(vs_info),
            "approach": "name_based_discovery"
        })
        
    except Exception as e:
        logger.error(f"Error listing vector stores: {e}")
        return jsonify({
            "status": "error",
            "message": f"Error listing vector stores: {str(e)}",
            "approach": "name_based_discovery"
        }), 500

if __name__ == '__main__':
    # Add the project root to Python path
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    
    port = int(os.environ.get('PORT', SERVICE_CONFIG.get('port', 5000)))
    logger.info(f"Starting {SERVICE_NAME} on port {port}")
    logger.info(f"Using name-based assistant discovery for: {ASSISTANT_NAME}")
    
    # Initialize and validate assistant setup during startup
    logger.info("Initializing assistant manager and validating setup...")
    try:
        manager = get_name_based_manager()
        logger.info("Assistant validation completed successfully during startup")
    except Exception as e:
        logger.error(f"Failed to initialize assistant manager during startup: {e}")
        logger.error("Service will continue but may not function properly until assistant is configured")
    
    app.run(host='0.0.0.0', port=port, debug=True)
