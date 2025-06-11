#!/usr/bin/env python3
"""
Analysis Processing Daemon

Background daemon for processing stored analysis data into vector stores
and graph databases. This decouples the processing from the analysis execution.
"""
import argparse
import logging
import signal
import sys
import time
from pathlib import Path
from typing import Optional

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.analysis_data_manager import AnalysisDataManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AnalysisProcessingDaemon:
    """
    Daemon for processing analysis data in the background
    """
    
    def __init__(
        self,
        storage_dir: str = None,
        enable_vector_store: bool = True,
        enable_graph_db: bool = True,
        process_interval: int = 30,
        batch_size: int = 10
    ):
        """
        Initialize the processing daemon
        
        Args:
            storage_dir: Storage directory for analysis data
            enable_vector_store: Enable vector store processing
            enable_graph_db: Enable graph database processing
            process_interval: Interval between processing runs (seconds)
            batch_size: Number of tasks to process per batch
        """
        self.data_manager = AnalysisDataManager(
            storage_dir=storage_dir,
            enable_vector_store=enable_vector_store,
            enable_graph_db=enable_graph_db
        )
        
        self.process_interval = process_interval
        self.batch_size = batch_size
        self.running = False
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        logger.info(f"Analysis processing daemon initialized with interval {process_interval}s")
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, shutting down gracefully...")
        self.running = False
    
    def start(self):
        """Start the daemon"""
        logger.info("Starting analysis processing daemon")
        self.running = True
        
        while self.running:
            try:
                # Process pending tasks
                vector_processed = self.data_manager.process_pending_tasks(
                    processor_type="vector_store",
                    limit=self.batch_size
                )
                
                graph_processed = self.data_manager.process_pending_tasks(
                    processor_type="graph_db",
                    limit=self.batch_size
                )
                
                total_processed = vector_processed + graph_processed
                
                if total_processed > 0:
                    logger.info(f"Processed {total_processed} tasks (vector: {vector_processed}, graph: {graph_processed})")
                else:
                    logger.debug("No pending tasks to process")
                
                # Log statistics periodically
                stats = self.data_manager.get_stats()
                pending_tasks = stats.get("processing_task_status", {}).get("pending", 0)
                
                if pending_tasks > 0:
                    logger.info(f"Tasks remaining: {pending_tasks} pending")
                
                # Wait for next interval
                time.sleep(self.process_interval)
                
            except KeyboardInterrupt:
                logger.info("Received keyboard interrupt, shutting down...")
                break
            except Exception as e:
                logger.error(f"Error in processing loop: {e}")
                # Continue running even if there's an error
                time.sleep(self.process_interval)
        
        logger.info("Analysis processing daemon stopped")
    
    def process_once(self) -> int:
        """
        Process pending tasks once and return
        
        Returns:
            int: Number of tasks processed
        """
        logger.info("Processing pending tasks once...")
        
        vector_processed = self.data_manager.process_pending_tasks(
            processor_type="vector_store",
            limit=self.batch_size
        )
        
        graph_processed = self.data_manager.process_pending_tasks(
            processor_type="graph_db",
            limit=self.batch_size
        )
        
        total_processed = vector_processed + graph_processed
        
        logger.info(f"Processed {total_processed} tasks (vector: {vector_processed}, graph: {graph_processed})")
        
        return total_processed
    
    def get_status(self) -> dict:
        """Get daemon status"""
        stats = self.data_manager.get_stats()
        
        return {
            "running": self.running,
            "process_interval": self.process_interval,
            "batch_size": self.batch_size,
            "storage_stats": stats,
            "backends": {
                "vector_store": self.data_manager.qdrant_client is not None,
                "graph_db": self.data_manager.neo4j_driver is not None
            }
        }
    
    def close(self):
        """Close connections"""
        self.data_manager.close()


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Analysis Processing Daemon")
    
    parser.add_argument(
        "--storage-dir",
        type=str,
        help="Storage directory for analysis data"
    )
    
    parser.add_argument(
        "--interval",
        type=int,
        default=30,
        help="Processing interval in seconds (default: 30)"
    )
    
    parser.add_argument(
        "--batch-size",
        type=int,
        default=10,
        help="Number of tasks to process per batch (default: 10)"
    )
    
    parser.add_argument(
        "--no-vector-store",
        action="store_true",
        help="Disable vector store processing"
    )
    
    parser.add_argument(
        "--no-graph-db",
        action="store_true",
        help="Disable graph database processing"
    )
    
    parser.add_argument(
        "--once",
        action="store_true",
        help="Process once and exit (don't run as daemon)"
    )
    
    parser.add_argument(
        "--status",
        action="store_true",
        help="Show status and exit"
    )
    
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Create daemon
    daemon = AnalysisProcessingDaemon(
        storage_dir=args.storage_dir,
        enable_vector_store=not args.no_vector_store,
        enable_graph_db=not args.no_graph_db,
        process_interval=args.interval,
        batch_size=args.batch_size
    )
    
    try:
        if args.status:
            # Show status and exit
            status = daemon.get_status()
            print("Analysis Processing Daemon Status:")
            print(f"  Running: {status['running']}")
            print(f"  Process interval: {status['process_interval']}s")
            print(f"  Batch size: {status['batch_size']}")
            print(f"  Vector store enabled: {status['backends']['vector_store']}")
            print(f"  Graph DB enabled: {status['backends']['graph_db']}")
            print()
            print("Storage Statistics:")
            stats = status['storage_stats']
            print(f"  Total analyses: {stats.get('total_analyses', 0)}")
            print(f"  Processing task status: {stats.get('processing_task_status', {})}")
            
        elif args.once:
            # Process once and exit
            processed = daemon.process_once()
            print(f"Processed {processed} tasks")
            
        else:
            # Run as daemon
            daemon.start()
            
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)
    
    finally:
        daemon.close()


if __name__ == "__main__":
    main()
