#!/usr/bin/env python
"""
Dedicated BPMN AI Service Server

A Flask server specifically for BPMN AI functionality, separate from the DADM Decision Analysis service.
This server runs on port 5010 and integrates with the existing DADM infrastructure.
"""

import os
import sys
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Service configuration
SERVICE_NAME = "BPMN AI Service"
SERVICE_VERSION = "1.0.0"
SERVICE_PORT = int(os.environ.get('PORT', 5010))

# Import BPMN AI functionality
try:
    from src.services.bpmn_ai_service import get_bpmn_ai_service, BPMNGenerationRequest, BPMNModificationRequest
    from src.utils.bpmn_utils import get_bpmn_validator
    logger.info("BPMN AI modules loaded successfully")
except ImportError as e:
    logger.error(f"Failed to import BPMN AI modules: {e}")
    get_bpmn_ai_service = None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': SERVICE_NAME,
        'version': SERVICE_VERSION,
        'port': SERVICE_PORT
    })

@app.route('/api/bpmn-ai/health', methods=['GET'])
def bpmn_ai_health():
    """BPMN AI specific health check"""
    try:
        if get_bpmn_ai_service is None:
            return jsonify({
                'status': 'error',
                'service': 'bpmn-ai',
                'error': 'BPMN AI service not available'
            }), 500
            
        service = get_bpmn_ai_service()
        return jsonify({
            'status': 'healthy',
            'service': 'bpmn-ai',
            'model': service.model if service else 'unknown'
        })
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'service': 'bpmn-ai',
            'error': str(e)
        }), 500

@app.route('/api/bpmn-ai/generate', methods=['POST'])
def generate_bpmn():
    """Generate BPMN from user input"""
    try:
        if get_bpmn_ai_service is None:
            return jsonify({'error': 'BPMN AI service not available'}), 500
            
        data = request.get_json()
        if not data or not data.get('user_input'):
            return jsonify({'error': 'user_input is required'}), 400
        
        service = get_bpmn_ai_service()
        request_obj = BPMNGenerationRequest(
            user_input=data.get('user_input'),
            context=data.get('context', {})
        )
        
        # Run async function
        import asyncio
        result = asyncio.run(service.generate_bpmn(request_obj))
        
        # Convert result to dict
        response = {
            'bpmn_xml': result.bpmn_xml,
            'explanation': result.explanation,
            'elements_created': result.elements_created,
            'suggestions': result.suggestions,
            'confidence_score': result.confidence_score,
            'validation_errors': result.validation_errors
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"BPMN generation failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/bpmn-ai/modify', methods=['POST'])
def modify_bpmn():
    """Modify existing BPMN"""
    try:
        if get_bpmn_ai_service is None:
            return jsonify({'error': 'BPMN AI service not available'}), 500
            
        data = request.get_json()
        if not data or not data.get('current_bpmn') or not data.get('modification_request'):
            return jsonify({'error': 'current_bpmn and modification_request are required'}), 400
        
        service = get_bpmn_ai_service()
        request_obj = BPMNModificationRequest(
            current_bpmn=data.get('current_bpmn'),
            modification_request=data.get('modification_request'),
            context=data.get('context', {})
        )
        
        # Run async function
        import asyncio
        result = asyncio.run(service.modify_bpmn(request_obj))
        
        # Convert result to dict
        response = {
            'bpmn_xml': result.bpmn_xml,
            'explanation': result.explanation,
            'elements_created': result.elements_created,
            'suggestions': result.suggestions,
            'confidence_score': result.confidence_score,
            'validation_errors': result.validation_errors
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"BPMN modification failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/bpmn-ai/explain', methods=['POST'])
def explain_bpmn():
    """Explain BPMN diagram"""
    try:
        if get_bpmn_ai_service is None:
            return jsonify({'error': 'BPMN AI service not available'}), 500
            
        data = request.get_json()
        if not data or not data.get('bpmn_xml'):
            return jsonify({'error': 'bpmn_xml is required'}), 400
        
        service = get_bpmn_ai_service()
        
        # Run async function
        import asyncio
        explanation = asyncio.run(service.explain_bpmn(data.get('bpmn_xml')))
        
        return jsonify({'explanation': explanation})
        
    except Exception as e:
        logger.error(f"BPMN explanation failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/bpmn-ai/validate', methods=['POST'])
def validate_bpmn():
    """Validate BPMN XML"""
    try:
        data = request.get_json()
        if not data or not data.get('bpmn_xml'):
            return jsonify({'error': 'bpmn_xml is required'}), 400
        
        validator = get_bpmn_validator()
        validation_result = validator.validate_complete(data.get('bpmn_xml'))
        
        response = {
            'valid': len(validation_result.get('errors', [])) == 0,
            'errors': validation_result.get('errors', []),
            'warnings': validation_result.get('warnings', [])
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"BPMN validation failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/bpmn-ai/models', methods=['GET'])
def get_models():
    """Get available AI models"""
    try:
        if get_bpmn_ai_service is None:
            return jsonify({'error': 'BPMN AI service not available'}), 500
            
        service = get_bpmn_ai_service()
        return jsonify({
            'available_models': ['gpt-4', 'gpt-4-turbo'],
            'current_model': service.model if service else 'gpt-4'
        })
        
    except Exception as e:
        logger.error(f"Failed to get models: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info(f"Starting {SERVICE_NAME} v{SERVICE_VERSION}")
    logger.info(f"Running on port {SERVICE_PORT}")
    
    # Verify BPMN AI modules are available
    if get_bpmn_ai_service is None:
        logger.warning("BPMN AI service modules not available - service will have limited functionality")
    else:
        logger.info("BPMN AI service modules loaded successfully")
    
    app.run(host='0.0.0.0', port=SERVICE_PORT, debug=False)
