import os
import json
import uuid
import logging
from datetime import datetime
from flask import Flask, request, jsonify

from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct, Filter, FieldCondition, MatchValue
from ollama import Client as OllamaClient

# Add project root to path for imports
import sys
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.analysis_service_integration import get_analysis_service
from services.ollama_service.consul_registry import ConsulServiceRegistry

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load service configuration
CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'service_config.json')
SERVICE_CONFIG = {}
if os.path.exists(CONFIG_PATH):
    with open(CONFIG_PATH, 'r') as f:
        SERVICE_CONFIG = json.load(f).get('service', {})

SERVICE_NAME = SERVICE_CONFIG.get('name', 'dadm-ollama-assistant')
SERVICE_PORT = int(os.environ.get('PORT', SERVICE_CONFIG.get('port', 5300)))

OLLAMA_HOST = os.environ.get('OLLAMA_HOST', 'http://localhost:11434')
OLLAMA_MODEL = SERVICE_CONFIG.get('model', 'mistral')

QDRANT_HOST = os.environ.get('QDRANT_HOST', 'localhost')
QDRANT_PORT = int(os.environ.get('QDRANT_PORT', 6333))

THREAD_COLLECTION = 'ollama_threads'
FILE_COLLECTION = 'ollama_files'

app = Flask(__name__)

# Global instances
ollama_client = None
qdrant_client = None
embedder = None
analysis_service = None

# Thread index cache
thread_indices = {}


def init_services():
    global ollama_client, qdrant_client, embedder, analysis_service
    if ollama_client is None:
        ollama_client = OllamaClient(host=OLLAMA_HOST)
    if qdrant_client is None:
        qdrant_client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        # Ensure collections
        collections = qdrant_client.get_collections().collections
        if not any(c.name == THREAD_COLLECTION for c in collections):
            qdrant_client.create_collection(THREAD_COLLECTION,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE))
        if not any(c.name == FILE_COLLECTION for c in collections):
            qdrant_client.create_collection(FILE_COLLECTION,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE))
    if embedder is None:
        embedder = SentenceTransformer('all-MiniLM-L6-v2')
    if analysis_service is None:
        analysis_service = get_analysis_service(enable_vector_store=True,
                                                enable_graph_db=True,
                                                auto_process=True)


def get_thread_messages(thread_id):
    init_services()
    try:
        result, _ = qdrant_client.scroll(collection_name=THREAD_COLLECTION,
            scroll_filter=Filter(must=[FieldCondition(key='thread_id', match=MatchValue(value=thread_id))]),
            limit=1000)
        messages = sorted(result, key=lambda r: r.payload.get('index', 0))
        return [{'role': r.payload['role'], 'content': r.payload['content']} for r in messages]
    except Exception as e:
        logger.warning(f'Error fetching thread {thread_id}: {e}')
        return []


def append_thread_message(thread_id, role, content):
    init_services()
    index = thread_indices.get(thread_id, 0)
    embedding = embedder.encode(content).tolist()
    point = PointStruct(id=str(uuid.uuid4()), vector=embedding,
                        payload={'thread_id': thread_id, 'role': role, 'content': content, 'index': index})
    qdrant_client.upsert(collection_name=THREAD_COLLECTION, points=[point])
    thread_indices[thread_id] = index + 1


def retrieve_context(query, top_k=3):
    init_services()
    embedding = embedder.encode(query).tolist()
    try:
        results = qdrant_client.search(collection_name=FILE_COLLECTION,
                                       query_vector=embedding,
                                       limit=top_k)
        return [r.payload.get('text', '') for r in results]
    except Exception as e:
        logger.warning(f'Context retrieval failed: {e}')
        return []


def chunk_text(text, chunk_size=1000, overlap=200):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap
        if start < 0:
            start = 0
    return chunks


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': SERVICE_NAME})


@app.route('/process', methods=['POST'])
def process_task():
    init_services()
    data = request.json or {}
    task_name = data.get('task_name', 'task')
    task_description = data.get('task_description', '')
    variables = data.get('variables', {})
    process_instance_id = data.get('process_instance_id')
    thread_id = process_instance_id or data.get('thread_id') or str(uuid.uuid4())

    previous = get_thread_messages(thread_id)
    user_input = f"{task_description}\n\n{json.dumps(variables)}"
    context_chunks = retrieve_context(user_input)
    if context_chunks:
        context_text = '\n'.join(context_chunks)
        user_input += f"\n\nContext:\n{context_text}"

    messages = previous + [{'role': 'user', 'content': user_input}]
    try:
        response = ollama_client.chat(model=OLLAMA_MODEL, messages=messages)
        content = response['message']['content']
        try:
            result_json = json.loads(content)
        except json.JSONDecodeError:
            result_json = {'response': content}
        append_thread_message(thread_id, 'user', user_input)
        append_thread_message(thread_id, 'assistant', content)
        analysis_service.store_task_analysis(task_description=task_description,
                                             task_id=str(uuid.uuid4()),
                                             task_name=task_name,
                                             variables=variables,
                                             response_data=result_json,
                                             raw_response=content,
                                             thread_id=thread_id,
                                             process_instance_id=process_instance_id,
                                             service_name=SERVICE_NAME)
        return jsonify({'success': True, 'response': result_json, 'thread_id': thread_id})
    except Exception as e:
        logger.error(f'Processing error: {e}')
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/upload_files', methods=['POST'])
def upload_files():
    init_services()
    if 'files' not in request.files:
        return jsonify({'status': 'error', 'message': 'No files provided'}), 400
    files = request.files.getlist('files')
    results = []
    for f in files:
        content = f.read().decode('utf-8', errors='ignore')
        chunks = chunk_text(content)
        for idx, chunk in enumerate(chunks):
            embedding = embedder.encode(chunk).tolist()
            point = PointStruct(id=str(uuid.uuid4()), vector=embedding,
                                payload={'file_name': f.filename, 'chunk_index': idx, 'text': chunk})
            qdrant_client.upsert(collection_name=FILE_COLLECTION, points=[point])
        results.append({'file': f.filename, 'chunks': len(chunks)})
    return jsonify({'status': 'success', 'results': results})


@app.route('/files', methods=['GET'])
def list_files():
    init_services()
    points, _ = qdrant_client.scroll(collection_name=FILE_COLLECTION, limit=1000)
    files = {}
    for p in points:
        fname = p.payload.get('file_name')
        if fname:
            files.setdefault(fname, 0)
            files[fname] += 1
    return jsonify({'files': [{'name': k, 'chunks': v} for k,v in files.items()]})


if __name__ == '__main__':
    init_services()
    use_consul = os.environ.get('USE_CONSUL', 'true').lower() == 'true'
    if use_consul:
        ConsulServiceRegistry().register_service(name=SERVICE_NAME,
                                                 service_type='assistant',
                                                 port=SERVICE_PORT,
                                                 health_check_path='/health',
                                                 tags=['ollama', 'assistant'])
    app.run(host='0.0.0.0', port=SERVICE_PORT, debug=True)
