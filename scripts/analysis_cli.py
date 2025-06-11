#!/usr/bin/env python3
"""
Analysis Data CLI

Command-line interface for managing analysis data stored by the Analysis Data Manager.
Provides tools for querying, processing, and managing analysis data.
"""
import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.analysis_data_manager import AnalysisDataManager, AnalysisStatus
from src.analysis_service_integration import get_analysis_service


def format_analysis_summary(analysis_data: Dict[str, Any]) -> str:
    """Format analysis data for summary display"""
    metadata = analysis_data['metadata']
    
    lines = [
        f"ID: {metadata['analysis_id']}",
        f"Thread: {metadata['thread_id']}",
        f"Task: {metadata['task_name']}",
        f"Status: {metadata['status']}",
        f"Created: {metadata['created_at']}",
        f"Service: {metadata['source_service']}"
    ]
    
    if metadata.get('tags'):
        lines.append(f"Tags: {', '.join(metadata['tags'])}")
    
    return " | ".join(lines)


def format_analysis_detail(analysis_data: Dict[str, Any]) -> str:
    """Format analysis data for detailed display"""
    metadata = analysis_data['metadata']
    
    lines = [
        f"Analysis ID: {metadata['analysis_id']}",
        f"Thread ID: {metadata['thread_id']}",
        f"Session ID: {metadata.get('session_id', 'N/A')}",
        f"Process Instance ID: {metadata.get('process_instance_id', 'N/A')}",
        f"Task Name: {metadata['task_name']}",
        f"Status: {metadata['status']}",
        f"Created: {metadata['created_at']}",
        f"Updated: {metadata['updated_at']}",
        f"Source Service: {metadata['source_service']}",
        ""
    ]
    
    if metadata.get('tags'):
        lines.append(f"Tags: {', '.join(metadata['tags'])}")
        lines.append("")
    
    # Input data
    if analysis_data.get('input_data'):
        lines.append("Input Data:")
        lines.append(json.dumps(analysis_data['input_data'], indent=2))
        lines.append("")
    
    # Output data
    if analysis_data.get('output_data'):
        lines.append("Output Data:")
        lines.append(json.dumps(analysis_data['output_data'], indent=2))
        lines.append("")
    
    # Raw response
    if analysis_data.get('raw_response'):
        lines.append("Raw Response:")
        lines.append(analysis_data['raw_response'])
        lines.append("")
    
    return "\n".join(lines)


def cmd_list(args):
    """List analyses command"""
    data_manager = AnalysisDataManager(storage_dir=args.storage_dir)
    
    try:
        # Search with filters
        analyses = data_manager.search_analyses(
            thread_id=args.thread_id,
            session_id=args.session_id,
            task_name_pattern=args.task_name,
            tags=args.tags,
            status=AnalysisStatus(args.status) if args.status else None,
            limit=args.limit
        )
        
        if not analyses:
            print("No analyses found.")
            return
        
        print(f"Found {len(analyses)} analyses:")
        print()
        
        for analysis in analyses:
            print(format_analysis_summary(analysis.to_dict()))
    
    finally:
        data_manager.close()


def cmd_show(args):
    """Show analysis details command"""
    data_manager = AnalysisDataManager(storage_dir=args.storage_dir)
    
    try:
        analysis = data_manager.get_analysis(args.analysis_id)
        
        if not analysis:
            print(f"Analysis {args.analysis_id} not found.")
            return
        
        print(format_analysis_detail(analysis.to_dict()))
    
    finally:
        data_manager.close()


def cmd_thread(args):
    """Show thread conversation command"""
    data_manager = AnalysisDataManager(storage_dir=args.storage_dir)
    
    try:
        analyses = data_manager.get_thread_analyses(args.thread_id, limit=args.limit)
        
        if not analyses:
            print(f"No analyses found for thread {args.thread_id}.")
            return
        
        print(f"Thread {args.thread_id} - {len(analyses)} analyses:")
        print("=" * 80)
        
        for i, analysis in enumerate(analyses, 1):
            print(f"\n[{i}] {analysis.metadata.task_name}")
            print(f"    Created: {analysis.metadata.created_at}")
            print(f"    Status: {analysis.metadata.status.value}")
            
            if args.verbose:
                print(f"    Input: {json.dumps(analysis.input_data, indent=6)}")
                if analysis.output_data:
                    print(f"    Output: {json.dumps(analysis.output_data, indent=6)}")
                if analysis.raw_response:
                    print(f"    Response: {analysis.raw_response}")
    
    finally:
        data_manager.close()


def cmd_process(args):
    """Process pending analyses command"""
    data_manager = AnalysisDataManager(storage_dir=args.storage_dir)
    
    try:
        processed = data_manager.process_pending_tasks(
            processor_type=args.processor_type,
            limit=args.limit
        )
        
        print(f"Processed {processed} tasks.")
    
    finally:
        data_manager.close()


def cmd_reprocess(args):
    """Reprocess analysis command"""
    data_manager = AnalysisDataManager(storage_dir=args.storage_dir)
    
    try:
        success = data_manager.reprocess_analysis(args.analysis_id, args.processors)
        
        if success:
            print(f"Queued reprocessing for analysis {args.analysis_id}")
        else:
            print(f"Failed to queue reprocessing for analysis {args.analysis_id}")
    
    finally:
        data_manager.close()


def cmd_status(args):
    """Show processing status command"""
    data_manager = AnalysisDataManager(storage_dir=args.storage_dir)
    
    try:
        if args.analysis_id:
            # Show status for specific analysis
            status = data_manager.get_processing_status(args.analysis_id)
            
            print(f"Processing status for analysis {status['analysis_id']}:")
            print()
            
            if not status['tasks']:
                print("No processing tasks found.")
            else:
                for task in status['tasks']:
                    print(f"Processor: {task['processor_type']}")
                    print(f"Status: {task['status']}")
                    print(f"Created: {task['created_at']}")
                    if task['completed_at']:
                        print(f"Completed: {task['completed_at']}")
                    if task['error_message']:
                        print(f"Error: {task['error_message']}")
                    print()
        else:
            # Show overall statistics
            stats = data_manager.get_stats()
            
            print("Analysis Data Manager Statistics:")
            print(f"Total analyses: {stats['total_analyses']}")
            print()
            
            print("Status distribution:")
            for status, count in stats['status_distribution'].items():
                print(f"  {status}: {count}")
            print()
            
            print("Processing task status:")
            for status, count in stats['processing_task_status'].items():
                print(f"  {status}: {count}")
            print()
            
            print("Top threads:")
            for thread_id, count in stats['top_threads'].items():
                print(f"  {thread_id}: {count} analyses")
            print()
            
            print("Backends enabled:")
            for backend, enabled in stats['backends_enabled'].items():
                print(f"  {backend}: {'Yes' if enabled else 'No'}")
    
    finally:
        data_manager.close()


def cmd_export(args):
    """Export analyses command"""
    data_manager = AnalysisDataManager(storage_dir=args.storage_dir)
    
    try:
        # Get analyses based on filters
        analyses = data_manager.search_analyses(
            thread_id=args.thread_id,
            session_id=args.session_id,
            task_name_pattern=args.task_name,
            tags=args.tags,
            limit=args.limit or 1000  # Default to 1000 for export
        )
        
        if not analyses:
            print("No analyses to export.")
            return
        
        # Convert to exportable format
        export_data = {
            "exported_at": datetime.now().isoformat(),
            "total_count": len(analyses),
            "analyses": [analysis.to_dict() for analysis in analyses]
        }
        
        # Write to file
        output_file = Path(args.output)
        with open(output_file, 'w') as f:
            json.dump(export_data, f, indent=2)
        
        print(f"Exported {len(analyses)} analyses to {output_file}")
    
    finally:
        data_manager.close()


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description="Analysis Data Manager CLI")
    
    parser.add_argument(
        "--storage-dir",
        type=str,
        help="Storage directory for analysis data"
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # List command
    list_parser = subparsers.add_parser("list", help="List analyses")
    list_parser.add_argument("--thread-id", help="Filter by thread ID")
    list_parser.add_argument("--session-id", help="Filter by session ID")
    list_parser.add_argument("--task-name", help="Filter by task name pattern")
    list_parser.add_argument("--tags", nargs="*", help="Filter by tags")
    list_parser.add_argument("--status", choices=[s.value for s in AnalysisStatus], help="Filter by status")
    list_parser.add_argument("--limit", type=int, default=100, help="Maximum results")
    
    # Show command
    show_parser = subparsers.add_parser("show", help="Show analysis details")
    show_parser.add_argument("analysis_id", help="Analysis ID")
    
    # Thread command
    thread_parser = subparsers.add_parser("thread", help="Show thread conversation")
    thread_parser.add_argument("thread_id", help="Thread ID")
    thread_parser.add_argument("--limit", type=int, default=50, help="Maximum analyses")
    thread_parser.add_argument("--verbose", action="store_true", help="Show detailed content")
    
    # Process command
    process_parser = subparsers.add_parser("process", help="Process pending analyses")
    process_parser.add_argument("--processor-type", choices=["vector_store", "graph_db"], help="Processor type")
    process_parser.add_argument("--limit", type=int, default=10, help="Maximum tasks to process")
    
    # Reprocess command
    reprocess_parser = subparsers.add_parser("reprocess", help="Reprocess an analysis")
    reprocess_parser.add_argument("analysis_id", help="Analysis ID")
    reprocess_parser.add_argument("--processors", nargs="*", 
                                choices=["vector_store", "graph_db"],
                                default=["vector_store", "graph_db"],
                                help="Processors to run")
    
    # Status command
    status_parser = subparsers.add_parser("status", help="Show processing status")
    status_parser.add_argument("--analysis-id", help="Show status for specific analysis")
    
    # Export command
    export_parser = subparsers.add_parser("export", help="Export analyses to JSON")
    export_parser.add_argument("output", help="Output file path")
    export_parser.add_argument("--thread-id", help="Filter by thread ID")
    export_parser.add_argument("--session-id", help="Filter by session ID")
    export_parser.add_argument("--task-name", help="Filter by task name pattern")
    export_parser.add_argument("--tags", nargs="*", help="Filter by tags")
    export_parser.add_argument("--limit", type=int, help="Maximum analyses to export")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Execute command
    if args.command == "list":
        cmd_list(args)
    elif args.command == "show":
        cmd_show(args)
    elif args.command == "thread":
        cmd_thread(args)
    elif args.command == "process":
        cmd_process(args)
    elif args.command == "reprocess":
        cmd_reprocess(args)
    elif args.command == "status":
        cmd_status(args)
    elif args.command == "export":
        cmd_export(args)


if __name__ == "__main__":
    main()
