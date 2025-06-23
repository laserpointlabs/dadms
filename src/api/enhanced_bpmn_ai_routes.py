"""
Enhanced BPMN AI API Routes

Flask routes for the enhanced BPMN AI functionality including:
- External prompt management
- Example storage and retrieval
- Better BPMN structure validation
- Configurable templates
"""

import logging
import asyncio
from flask import Blueprint, request, jsonify
from typing import Dict, Any
import json

# Import the enhanced BPMN AI service
try:
    from src.services.enhanced_bpmn_ai_service import (
        get_enhanced_bpmn_ai_service,
        BPMNGenerationRequest,
        BPMNExample,
        BPMNComplexity
    )
except ImportError as e:
    logging.error(f"Failed to import enhanced BPMN AI service: {e}")
    get_enhanced_bpmn_ai_service = None

# Configure logging
logger = logging.getLogger(__name__)

# Create Blueprint for enhanced BPMN AI routes
enhanced_bpmn_ai_bp = Blueprint('enhanced_bpmn_ai', __name__, url_prefix='/api/enhanced-bpmn-ai')

def handle_async(coro):
    """Helper function to handle async functions in Flask routes"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()

@enhanced_bpmn_ai_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Enhanced BPMN AI Service',
        'version': '2.0.0'
    })

@enhanced_bpmn_ai_bp.route('/generate', methods=['POST'])
def generate_bpmn():
    """Generate BPMN using enhanced service"""
    try:
        if get_enhanced_bpmn_ai_service is None:
            return jsonify({'error': 'Enhanced BPMN AI service not available'}), 500
            
        data = request.get_json()
        if not data or not data.get('user_input'):
            return jsonify({'error': 'user_input is required'}), 400
        
        # Parse complexity preference
        complexity_preference = None
        if data.get('complexity_preference'):
            try:
                complexity_preference = BPMNComplexity(data.get('complexity_preference'))
            except ValueError:
                return jsonify({'error': 'Invalid complexity_preference'}), 400
        
        service = get_enhanced_bpmn_ai_service()
        request_obj = BPMNGenerationRequest(
            user_input=data.get('user_input'),
            context=data.get('context', {}),
            complexity_preference=complexity_preference,
            include_examples=data.get('include_examples', True),
            max_examples=data.get('max_examples', 3),
            template_name=data.get('template_name')
        )
        
        # Run async function
        result = handle_async(service.generate_bpmn(request_obj))
        
        # Convert result to dict
        response = {
            'success': True,
            'bpmn_xml': result.bpmn_xml,
            'explanation': result.explanation,
            'elements_created': result.elements_created,
            'suggestions': result.suggestions,
            'confidence_score': result.confidence_score,
            'validation_errors': result.validation_errors,
            'examples_used': result.examples_used,
            'complexity_level': result.complexity_level.value,
            'generation_time': result.generation_time
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Enhanced BPMN generation failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@enhanced_bpmn_ai_bp.route('/examples', methods=['GET'])
def get_examples():
    """Get BPMN examples"""
    try:
        if get_enhanced_bpmn_ai_service is None:
            return jsonify({'error': 'Enhanced BPMN AI service not available'}), 500
        
        service = get_enhanced_bpmn_ai_service()
        complexity_filter = request.args.get('complexity')
        
        if complexity_filter:
            try:
                complexity = BPMNComplexity(complexity_filter)
                examples = service.get_examples(complexity)
            except ValueError:
                return jsonify({'error': 'Invalid complexity filter'}), 400
        else:
            examples = service.get_examples()
        
        # Convert examples to dict format
        examples_data = []
        for example in examples:
            examples_data.append({
                'id': example.id,
                'name': example.name,
                'description': example.description,
                'natural_language': example.natural_language,
                'complexity': example.complexity.value,
                'tags': example.tags,
                'metadata': example.metadata,
                'created_at': example.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'examples': examples_data,
            'count': len(examples_data)
        })
        
    except Exception as e:
        logger.error(f"Error getting examples: {str(e)}")
        return jsonify({'error': str(e)}), 500

@enhanced_bpmn_ai_bp.route('/examples', methods=['POST'])
def add_example():
    """Add a new BPMN example"""
    try:
        if get_enhanced_bpmn_ai_service is None:
            return jsonify({'error': 'Enhanced BPMN AI service not available'}), 500
            
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        # Validate required fields
        required_fields = ['name', 'description', 'natural_language', 'bpmn_xml', 'complexity']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Parse complexity
        try:
            complexity = BPMNComplexity(data['complexity'])
        except ValueError:
            return jsonify({'error': 'Invalid complexity value'}), 400
        
        service = get_enhanced_bpmn_ai_service()
        
        # Create example object
        example = BPMNExample(
            id=data.get('id', f"example_{len(service.get_examples()) + 1}"),
            name=data['name'],
            description=data['description'],
            natural_language=data['natural_language'],
            bpmn_xml=data['bpmn_xml'],
            complexity=complexity,
            tags=data.get('tags', []),
            metadata=data.get('metadata', {})
        )
        
        # Add the example
        service.add_example(example)
        
        return jsonify({
            'success': True,
            'message': f'Example "{example.name}" added successfully',
            'example_id': example.id
        })
        
    except Exception as e:
        logger.error(f"Error adding example: {str(e)}")
        return jsonify({'error': str(e)}), 500

@enhanced_bpmn_ai_bp.route('/templates', methods=['GET'])
def get_templates():
    """Get available prompt templates"""
    try:
        if get_enhanced_bpmn_ai_service is None:
            return jsonify({'error': 'Enhanced BPMN AI service not available'}), 500
        
        service = get_enhanced_bpmn_ai_service()
        templates = service.prompt_manager.templates
        
        # Convert templates to dict format
        templates_data = []
        for template_name, template in templates.items():
            templates_data.append({
                'name': template.name,
                'description': template.description,
                'variables': template.variables,
                'examples': template.examples,
                'metadata': template.metadata
            })
        
        return jsonify({
            'success': True,
            'templates': templates_data,
            'count': len(templates_data)
        })
        
    except Exception as e:
        logger.error(f"Error getting templates: {str(e)}")
        return jsonify({'error': str(e)}), 500

@enhanced_bpmn_ai_bp.route('/validate', methods=['POST'])
def validate_bpmn():
    """Validate BPMN XML"""
    try:
        if get_enhanced_bpmn_ai_service is None:
            return jsonify({'error': 'Enhanced BPMN AI service not available'}), 500
            
        data = request.get_json()
        if not data or not data.get('bpmn_xml'):
            return jsonify({'error': 'bpmn_xml is required'}), 400
        
        service = get_enhanced_bpmn_ai_service()
        validation_errors = service.validator.validate_bpmn_xml(data['bpmn_xml'])
        
        return jsonify({
            'success': True,
            'is_valid': len(validation_errors) == 0,
            'validation_errors': validation_errors,
            'error_count': len(validation_errors)
        })
        
    except Exception as e:
        logger.error(f"Error validating BPMN: {str(e)}")
        return jsonify({'error': str(e)}), 500

@enhanced_bpmn_ai_bp.route('/fix', methods=['POST'])
def fix_bpmn():
    """Fix common BPMN XML issues"""
    try:
        if get_enhanced_bpmn_ai_service is None:
            return jsonify({'error': 'Enhanced BPMN AI service not available'}), 500
            
        data = request.get_json()
        if not data or not data.get('bpmn_xml'):
            return jsonify({'error': 'bpmn_xml is required'}), 400
        
        service = get_enhanced_bpmn_ai_service()
        fixed_bpmn = service.validator.fix_common_issues(data['bpmn_xml'])
        
        return jsonify({
            'success': True,
            'fixed_bpmn_xml': fixed_bpmn,
            'message': 'BPMN XML has been fixed for common issues'
        })
        
    except Exception as e:
        logger.error(f"Error fixing BPMN: {str(e)}")
        return jsonify({'error': str(e)}), 500

@enhanced_bpmn_ai_bp.route('/analyze', methods=['POST'])
def analyze_complexity():
    """Analyze the complexity of a natural language description"""
    try:
        if get_enhanced_bpmn_ai_service is None:
            return jsonify({'error': 'Enhanced BPMN AI service not available'}), 500
            
        data = request.get_json()
        if not data or not data.get('user_input'):
            return jsonify({'error': 'user_input is required'}), 400
        
        service = get_enhanced_bpmn_ai_service()
        complexity = service._detect_complexity(data['user_input'])
        
        return jsonify({
            'success': True,
            'complexity_level': complexity.value,
            'user_input': data['user_input'],
            'analysis': f"Detected {complexity.value} complexity based on keywords and patterns"
        })
        
    except Exception as e:
        logger.error(f"Error analyzing complexity: {str(e)}")
        return jsonify({'error': str(e)}), 500 