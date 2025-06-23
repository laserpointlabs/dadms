"""
BPMN AI API Routes

Flask routes for BPMN AI functionality including generation, modification, and explanation.
Now uses the enhanced BPMN AI service with Qdrant examples and better prompt management.
"""
import logging
import asyncio
from flask import Blueprint, request, jsonify
from typing import Dict, Any
import json

# Import the enhanced BPMN AI service
try:
    from src.services.enhanced_bpmn_ai_service import (
        EnhancedBPMNAIService, 
        BPMNGenerationRequest, 
        BPMNComplexity,
        get_enhanced_bpmn_ai_service
    )
except ImportError as e:
    logging.error(f"Failed to import enhanced BPMN AI service: {e}")
    EnhancedBPMNAIService = None

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
    """Health check endpoint for enhanced BPMN AI service"""
    try:
        service = get_enhanced_bpmn_ai_service()
        return jsonify({
            'status': 'healthy',
            'service': 'enhanced-bpmn-ai',
            'model': service.model if service else 'unknown',
            'qdrant_available': service.qdrant_client is not None
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
    Generate BPMN from natural language description using enhanced service with Qdrant examples.
    
    Expected JSON payload:
    {
        "user_input": "Create a purchase order process",
        "context": {...},  // Optional
        "template_name": "approval_workflow",  // Optional
        "complexity_preference": "moderate",  // Optional: simple, moderate, complex
        "include_examples": true,  // Optional
        "max_examples": 3  // Optional
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
            
        # Parse complexity preference
        complexity_preference = None
        if data.get('complexity_preference'):
            try:
                complexity_preference = BPMNComplexity(data.get('complexity_preference'))
            except ValueError:
                complexity_preference = BPMNComplexity.MODERATE
            
        # Create request object
        bpmn_request = BPMNGenerationRequest(
            user_input=user_input,
            context=data.get('context'),
            complexity_preference=complexity_preference,
            template_name=data.get('template_name'),
            include_examples=data.get('include_examples', True),
            max_examples=data.get('max_examples', 3)
        )
        
        # Get enhanced service and generate BPMN
        service = get_enhanced_bpmn_ai_service()
        
        # Handle async call
        response = handle_async(service.generate_bpmn(bpmn_request))
        
        # Convert response to dict
        result = {
            'success': True,
            'bpmn_xml': response.bpmn_xml,
            'explanation': response.explanation,
            'elements_created': response.elements_created,
            'suggestions': response.suggestions,
            'confidence_score': response.confidence_score,
            'validation_errors': response.validation_errors or [],
            'examples_used': response.examples_used or [],
            'complexity_level': response.complexity_level.value,
            'generation_time': response.generation_time
        }
        
        logger.info(f"Successfully generated BPMN for: {user_input[:50]}...")
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error generating BPMN: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate BPMN',
            'details': str(e)
        }), 500

@bpmn_ai_bp.route('/modify', methods=['POST'])
def modify_bpmn():
    """
    Modify existing BPMN based on natural language request using enhanced service.
    
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
            
        # Create a combined request that includes the current BPMN
        combined_input = f"Current BPMN model:\n{current_bpmn}\n\nModification request: {modification_request}"
        
        # Create request object for generation with context
        bpmn_request = BPMNGenerationRequest(
            user_input=combined_input,
            context={
                'operation': 'modify',
                'original_request': modification_request,
                **data.get('context', {})
            },
            include_examples=True,
            max_examples=2
        )
        
        # Get enhanced service and generate modified BPMN
        service = get_enhanced_bpmn_ai_service()
        
        # Handle async call
        response = handle_async(service.generate_bpmn(bpmn_request))
        
        # Convert response to dict
        result = {
            'success': True,
            'bpmn_xml': response.bpmn_xml,
            'explanation': response.explanation,
            'elements_created': response.elements_created,
            'suggestions': response.suggestions,
            'confidence_score': response.confidence_score,
            'validation_errors': response.validation_errors or [],
            'examples_used': response.examples_used or [],
            'complexity_level': response.complexity_level.value,
            'generation_time': response.generation_time
        }
        
        logger.info(f"Successfully modified BPMN: {modification_request[:50]}...")
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error modifying BPMN: {str(e)}")
        return jsonify({
            'success': False,
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
            
        # Get enhanced service and explain BPMN
        service = get_enhanced_bpmn_ai_service()
        
        # For now, create a simple explanation using the validator
        validation_errors = service.validator.validate_bpmn_xml(bpmn_xml)
        
        # Create a basic explanation
        explanation = f"This BPMN model contains a business process. "
        if validation_errors:
            explanation += f"Note: There are {len(validation_errors)} validation issues that should be addressed."
        else:
            explanation += "The model appears to be valid and ready for use."
        
        result = {
            'explanation': explanation,
            'validation_errors': validation_errors
        }
        
        logger.info("Successfully explained BPMN model")
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
    Validate BPMN XML structure and content.
    
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
            
        # Get enhanced service and validate BPMN
        service = get_enhanced_bpmn_ai_service()
        validation_errors = service.validator.validate_bpmn_xml(bpmn_xml)
        
        result = {
            'is_valid': len(validation_errors) == 0,
            'validation_errors': validation_errors,
            'error_count': len(validation_errors)
        }
        
        logger.info(f"BPMN validation completed with {len(validation_errors)} errors")
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
