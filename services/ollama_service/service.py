"""Ollama Assistant Service

Expose a local Ollama model as a microservice that mimics the OpenAI service
used by the ServiceOrchestrator. Conversation threads are keyed by
`process_instance_id`.
"""
import os
import sys
import json
import logging
import uuid
from datetime import datetime
from typing import Dict, List

from flask import Flask, request, jsonify
import ollama

# Add project root for absolute imports
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

try:
    from src.analysis_service_integration import get_analysis_service
    ANALYSIS_SERVICE_AVAILABLE = True
except Exception:
    ANALYSIS_SERVICE_AVAILABLE = False

from services.openai_service.consul_registry import ConsulServiceRegistry

# --------------------------------------------------
# Configuration
# --------------------------------------------------

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "service_config.json")


def load_service_config() -> Dict:
    try:
        with open(CONFIG_PATH, "r") as f:
            data = json.load(f)
            return data.get("service", {})
    except Exception as e:
        logging.warning(f"Could not load config: {e}")
        return {
            "name": "dadm-ollama-assistant",
            "type": "assistant",
            "port": 5200,
            "health_endpoint": "/health",
            "description": "DADM Ollama Assistant Service",
            "version": "1.0.0",
        }

SERVICE_CONFIG = load_service_config()
SERVICE_NAME = SERVICE_CONFIG.get("name", "dadm-ollama-assistant")
SERVICE_PORT = SERVICE_CONFIG.get("port", 5200)
MODEL_NAME = os.environ.get("OLLAMA_MODEL", SERVICE_CONFIG.get("metadata", {}).get("model_default", "llama3"))
DEFAULT_FORMAT = SERVICE_CONFIG.get("metadata", {}).get("format", "json")
CONSUL_CFG = SERVICE_CONFIG.get("consul", {"register": True})

# --------------------------------------------------
# Application
# --------------------------------------------------
app = Flask(__name__)

analysis_service = None
threads: Dict[str, List[Dict[str, str]]] = {}


def init_analysis_service():
    global analysis_service
    if ANALYSIS_SERVICE_AVAILABLE and analysis_service is None:
        analysis_service = get_analysis_service(enable_vector_store=True, enable_graph_db=True, auto_process=True)


@app.before_request
def before_request():
    init_analysis_service()


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": SERVICE_NAME,
        "model": MODEL_NAME,
        "threads": len(threads)
    })


@app.route("/process_task", methods=["POST"])
def process_task():
    data = request.get_json() or {}
    task_desc = data.get("task_description", "")
    task_id = data.get("task_id", str(uuid.uuid4()))
    task_name = data.get("task_name", "ollama_task")
    variables = data.get("variables")
    proc_id = data.get("process_instance_id", "default")

    history = threads.setdefault(proc_id, [])
    messages = history + [{"role": "user", "content": task_desc}]

    try:
        response = ollama.chat(model=MODEL_NAME, messages=messages, stream=False, format=DEFAULT_FORMAT)
        assistant_text = response.message.content if hasattr(response, "message") else response["message"]["content"]
    except Exception as e:
        logging.error(f"Ollama request failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

    history.append({"role": "user", "content": task_desc})
    history.append({"role": "assistant", "content": assistant_text})

    result = {
        "response": assistant_text,
        "model": MODEL_NAME,
        "thread_id": proc_id
    }

    if analysis_service:
        try:
            analysis_id = analysis_service.store_task_analysis(
                task_description=task_desc,
                task_id=task_id,
                task_name=task_name,
                variables=variables,
                response_data=result,
                thread_id=proc_id,
                process_instance_id=proc_id,
                service_name="assistant/ollama",
                tags=["ollama"]
            )
            result["analysis_id"] = analysis_id
        except Exception as e:
            logging.warning(f"Analysis storage failed: {e}")

    return jsonify({"result": result})


def register_consul():
    if not CONSUL_CFG.get("register", True):
        return
    try:
        registry = ConsulServiceRegistry()
        registry.register_service(
            name=SERVICE_NAME,
            service_type="assistant",
            port=SERVICE_PORT,
            tags=SERVICE_CONFIG.get("tags", []),
            meta={"version": SERVICE_CONFIG.get("version", "1.0.0"), "model": MODEL_NAME}
        )
    except Exception as e:
        logging.warning(f"Failed to register with Consul: {e}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
    register_consul()
    app.run(host="0.0.0.0", port=SERVICE_PORT)
