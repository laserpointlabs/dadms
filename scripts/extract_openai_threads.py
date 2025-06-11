#!/usr/bin/env python3
"""
OpenAI Thread Extractor

Extract OpenAI thread and assistant information from stored analyses
for use with the OpenAI API.
"""

import sys
import json
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

def extract_openai_context(process_instance_id: str = None, analysis_id: str = None):
    """Extract OpenAI context from stored analyses"""
    try:
        from src.analysis_service_integration import get_analysis_service
        
        analysis_service = get_analysis_service()
        
        if analysis_id:
            # Get specific analysis context
            thread_id = analysis_service.get_openai_thread_id(analysis_id)
            assistant_id = analysis_service.get_openai_assistant_id(analysis_id)
            
            if thread_id or assistant_id:
                context = {
                    'analysis_id': analysis_id,
                    'thread_id': thread_id,
                    'assistant_id': assistant_id
                }
                print(f"OpenAI Context for Analysis {analysis_id}:")
                print(json.dumps(context, indent=2))
                return context
            else:
                print(f"No OpenAI context found for analysis {analysis_id}")
                return None
        
        elif process_instance_id:
            # Get process context
            context = analysis_service.get_process_openai_context(process_instance_id)
            print(f"OpenAI Context for Process {process_instance_id}:")
            print(json.dumps(context, indent=2))
            return context
        
        else:
            # List all recent analyses with OpenAI context
            from src.analysis_data_manager import AnalysisDataManager
            
            data_manager = AnalysisDataManager()
            try:
                analyses = data_manager.search_analyses(limit=20)
                
                print("Recent Analyses with OpenAI Context:")
                print("=" * 60)
                
                for analysis in analyses:
                    if analysis.output_data and 'thread_id' in analysis.output_data:
                        thread_id = analysis.output_data.get('thread_id')
                        assistant_id = analysis.output_data.get('assistant_id', 'N/A')
                        
                        print(f"Analysis: {analysis.metadata.analysis_id}")
                        print(f"  Process: {analysis.metadata.process_instance_id}")
                        print(f"  Task: {analysis.metadata.task_name}")
                        print(f"  Thread: {thread_id}")
                        print(f"  Assistant: {assistant_id}")
                        print(f"  Created: {analysis.metadata.created_at}")
                        print()
                
            finally:
                data_manager.close()
        
        return None
        
    except Exception as e:
        print(f"Error extracting OpenAI context: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Extract OpenAI thread information from analyses")
    parser.add_argument("--process-id", help="Process instance ID")
    parser.add_argument("--analysis-id", help="Analysis ID")
    parser.add_argument("--format", choices=["json", "text"], default="text", help="Output format")
    
    args = parser.parse_args()
    
    if args.analysis_id:
        context = extract_openai_context(analysis_id=args.analysis_id)
    elif args.process_id:
        context = extract_openai_context(process_instance_id=args.process_id)
    else:
        context = extract_openai_context()
    
    if context and args.format == "json":
        print(json.dumps(context, indent=2))

if __name__ == "__main__":
    main()
