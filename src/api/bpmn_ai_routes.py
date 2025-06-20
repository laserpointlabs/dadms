"""
BPMN AI API Routes

Flask routes for BPMN AI functionality including generation, modification, and explanation.
"""
import logging
import asyncio
from flask import Blueprint, request, jsonify
from typing import Dict, Any
import json

# Import the BPMN AI service
try:
    from src.services.bpmn_ai_service import (
        BPMNAIService, 
        BPMNGenerationRequest, 
        BPMNModificationRequest,
        get_bpmn_ai_service
    )
except ImportError as e:
    logging.error(f"Failed to import BPMN AI service: {e}")
    BPMNAIService = None

# Configure logging
logger = logging.getLogger(__name__)

# Create Blueprint for BPMN AI routes
bpmn_ai_bp = Blueprint('bpmn_ai', __name__, url_prefix='/api/bpmn-ai')

def handle_async(coro):
    """Helper function to handle async functions in Flask routes"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()

@bpmn_ai_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for BPMN AI service"""
    try:
        service = get_bpmn_ai_service()
        return jsonify({
            'status': 'healthy',
            'service': 'bpmn-ai',
            'model': service.model if service else 'unknown'
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@bpmn_ai_bp.route('/generate', methods=['POST'])
def generate_bpmn():
    """
    Generate BPMN from natural language description.
    
    Expected JSON payload:
    {
        "user_input": "Create a purchase order process",
        "context": {...},  // Optional
        "model_history": [...]  // Optional
    }
    """
    try:
        # Validate request
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        user_input = data.get('user_input')
        
        if not user_input:
            return jsonify({'error': 'user_input is required'}), 400
            
        # Create request object
        bpmn_request = BPMNGenerationRequest(
            user_input=user_input,
            context=data.get('context'),
            model_history=data.get('model_history')
        )
        
        # Get service and generate BPMN
        service = get_bpmn_ai_service()
        
        # Handle async call
        response = handle_async(service.generate_bpmn(bpmn_request))
        
        # Convert response to dict
        result = {
            'bpmn_xml': response.bpmn_xml,
            'explanation': response.explanation,
            'elements_created': response.elements_created,
            'suggestions': response.suggestions,
            'confidence_score': response.confidence_score,
            'validation_errors': response.validation_errors or []
        }
        
        logger.info(f"Successfully generated BPMN for: {user_input[:50]}...")
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error generating BPMN: {str(e)}")
        return jsonify({
            'error': 'Failed to generate BPMN',
            'details': str(e)
        }), 500

@bpmn_ai_bp.route('/modify', methods=['POST'])
def modify_bpmn():
    """
    Modify existing BPMN based on natural language request.
    
    Expected JSON payload:
    {
        "current_bpmn": "<bpmn:definitions>...</bpmn:definitions>",
        "modification_request": "Add approval step after review",
        "context": {...}  // Optional
    }
    """
    try:
        # Validate request
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        current_bpmn = data.get('current_bpmn')
        modification_request = data.get('modification_request')
        
        if not current_bpmn:
            return jsonify({'error': 'current_bpmn is required'}), 400
        if not modification_request:
            return jsonify({'error': 'modification_request is required'}), 400
            
        # Create request object
        bpmn_request = BPMNModificationRequest(
            current_bpmn=current_bpmn,
            modification_request=modification_request,
            context=data.get('context')
        )
        
        # Get service and modify BPMN
        service = get_bpmn_ai_service()
        
        # Handle async call
        response = handle_async(service.modify_bpmn(bpmn_request))
        
        # Convert response to dict
        result = {
            'bpmn_xml': response.bpmn_xml,
            'explanation': response.explanation,
            'elements_created': response.elements_created,
            'suggestions': response.suggestions,
            'confidence_score': response.confidence_score,
            'validation_errors': response.validation_errors or []
        }
        
        logger.info(f"Successfully modified BPMN: {modification_request[:50]}...")
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error modifying BPMN: {str(e)}")
        return jsonify({
            'error': 'Failed to modify BPMN',
            'details': str(e)
        }), 500

@bpmn_ai_bp.route('/explain', methods=['POST'])
def explain_bpmn():
    """
    Generate natural language explanation of a BPMN model.
    
    Expected JSON payload:
    {
        "bpmn_xml": "<bpmn:definitions>...</bpmn:definitions>"
    }
    """
    try:
        # Validate request
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        bpmn_xml = data.get('bpmn_xml')
        
        if not bpmn_xml:
            return jsonify({'error': 'bpmn_xml is required'}), 400
            
        # Get service and explain BPMN
        service = get_bpmn_ai_service()
        
        # Handle async call
        explanation = handle_async(service.explain_bpmn(bpmn_xml))
        
        result = {
            'explanation': explanation
        }
        
        logger.info("Successfully generated BPMN explanation")
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error explaining BPMN: {str(e)}")
        return jsonify({
            'error': 'Failed to explain BPMN',
            'details': str(e)
        }), 500

@bpmn_ai_bp.route('/validate', methods=['POST'])
def validate_bpmn():
    """
    Validate BPMN XML structure and semantics.
    
    Expected JSON payload:
    {
        "bpmn_xml": "<bpmn:definitions>...</bpmn:definitions>"
    }
    """
    try:
        # Validate request
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        bpmn_xml = data.get('bpmn_xml')
        
        if not bpmn_xml:
            return jsonify({'error': 'bpmn_xml is required'}), 400
            
        # Get service and validate BPMN
        service = get_bpmn_ai_service()
        validation_errors = service._validate_bpmn_xml(bpmn_xml)
        
        result = {
            'is_valid': len(validation_errors) == 0,
            'validation_errors': validation_errors
        }
        
        logger.info("Successfully validated BPMN")
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error validating BPMN: {str(e)}")
        return jsonify({
            'error': 'Failed to validate BPMN',
            'details': str(e)
        }), 500

@bpmn_ai_bp.route('/models', methods=['GET'])
def list_bpmn_models():
    """
    List available BPMN models from the camunda_models directory.
    """
    try:
        import os
        import glob
        
        # Get the project root directory
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
        models_dir = os.path.join(project_root, 'camunda_models')
        
        # Find all .bpmn files
        bpmn_files = glob.glob(os.path.join(models_dir, '*.bpmn'))
        
        models = []
        for file_path in bpmn_files:
            filename = os.path.basename(file_path)
            # Skip backup files
            if not filename.endswith('.bak'):
                models.append({
                    'name': filename,
                    'path': file_path,
                    'size': os.path.getsize(file_path),
                    'modified': os.path.getmtime(file_path)
                })
        
        return jsonify({
            'models': models,
            'total': len(models)
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing BPMN models: {str(e)}")
        return jsonify({
            'error': 'Failed to list BPMN models',
            'details': str(e)
        }), 500

@bpmn_ai_bp.route('/models/<model_name>', methods=['GET'])
def get_bpmn_model(model_name):
    """
    Get a specific BPMN model by name.
    """
    try:
        import os
        
        # Get the project root directory
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
        models_dir = os.path.join(project_root, 'camunda_models')
        model_path = os.path.join(models_dir, model_name)
        
        # Validate file exists and is a .bpmn file
        if not os.path.exists(model_path) or not model_name.endswith('.bpmn'):
            return jsonify({'error': 'BPMN model not found'}), 404
            
        # Read the BPMN file
        with open(model_path, 'r', encoding='utf-8') as f:
            bpmn_content = f.read()
            
        return jsonify({
            'name': model_name,
            'bpmn_xml': bpmn_content,
            'size': len(bpmn_content)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting BPMN model {model_name}: {str(e)}")
        return jsonify({
            'error': 'Failed to get BPMN model',
            'details': str(e)
        }), 500

# Error handlers
@bpmn_ai_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@bpmn_ai_bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Method not allowed'}), 405

@bpmn_ai_bp.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500
