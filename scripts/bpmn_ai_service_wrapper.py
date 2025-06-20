#!/usr/bin/env python
import sys
import os
import json
import asyncio

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from src.services.bpmn_ai_service import get_bpmn_ai_service, BPMNGenerationRequest, BPMNModificationRequest

async def main():
    try:
        endpoint = sys.argv[1] if len(sys.argv) > 1 else None
        method = sys.argv[2] if len(sys.argv) > 2 else 'GET'
        
        # Read data from stdin if provided
        data = None
        if method == 'POST':
            try:
                stdin_data = sys.stdin.read().strip()
                if stdin_data:
                    data = json.loads(stdin_data)
            except Exception as stdin_error:
                # If we can't read stdin, continue without data
                pass
        
        service = get_bpmn_ai_service();
        
        if endpoint == 'health':
            result = {
                'status': 'healthy',
                'service': 'bpmn-ai',
                'model': service.model if service else 'unknown'
            }
        elif endpoint == 'generate' and data:
            request = BPMNGenerationRequest(
                user_input=data.get('user_input', ''),
                context=data.get('context', {})
            )
            result = await service.generate_bpmn(request)
            # Convert to dict
            result = {
                'bpmn_xml': result.bpmn_xml,
                'explanation': result.explanation,
                'elements_created': result.elements_created,
                'suggestions': result.suggestions,
                'confidence_score': result.confidence_score,
                'validation_errors': result.validation_errors
            }
        elif endpoint == 'modify' and data:
            request = BPMNModificationRequest(
                current_bpmn=data.get('current_bpmn', ''),
                modification_request=data.get('modification_request', ''),
                context=data.get('context', {})
            )
            result = await service.modify_bpmn(request)
            # Convert to dict
            result = {
                'bpmn_xml': result.bpmn_xml,
                'explanation': result.explanation,
                'elements_created': result.elements_created,
                'suggestions': result.suggestions,
                'confidence_score': result.confidence_score,
                'validation_errors': result.validation_errors
            }
        elif endpoint == 'explain' and data:
            result = await service.explain_bpmn(
                bpmn_xml=data.get('bpmn_xml', '')
            )
            # Wrap string result in dict
            result = {'explanation': result}
        elif endpoint == 'validate' and data:
            # Use bpmn_utils for validation since service doesn't have validate method
            from src.utils.bpmn_utils import get_bpmn_validator
            validator = get_bpmn_validator()
            validation_result = validator.validate_complete(data.get('bpmn_xml', ''))
            result = {
                'valid': len(validation_result.get('errors', [])) == 0,
                'errors': validation_result.get('errors', []),
                'warnings': validation_result.get('warnings', [])
            }
        elif endpoint == 'models':
            result = {
                'available_models': ['gpt-4', 'gpt-4-turbo'],
                'current_model': service.model if service else 'gpt-4'
            }
        else:
            result = {'error': f'Unknown endpoint or missing data: {endpoint}'}
        
        print(json.dumps(result));
        
    except Exception as e:
        print(json.dumps({'error': str(e)}));
        sys.exit(1);

if __name__ == '__main__':
    asyncio.run(main())
