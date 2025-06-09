#!/usr/bin/env python3
"""
Reset Databases and Docker Volumes Script
This script clears Neo4j, Qdrant databases and resets Docker volumes for clean testing
"""

import os
import sys
import time
import argparse
import subprocess
import tempfile
from datetime import datetime
from pathlib import Path

# Add the project root to the path so we can import our modules
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

try:
    from qdrant_client import QdrantClient
    QDRANT_AVAILABLE = True
except ImportError:
    QDRANT_AVAILABLE = False

try:
    from neo4j import GraphDatabase
    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False

# ANSI color codes for cross-platform colored output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def write_status(message, status_type="info"):
    """Write a status message with timestamp and color"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    color_map = {
        "success": f"{Colors.GREEN}✅",
        "warning": f"{Colors.YELLOW}⚠️ ",
        "error": f"{Colors.RED}❌",
        "info": f"{Colors.CYAN}ℹ️ "
    }
    
    color = color_map.get(status_type, "")
    print(f"[{timestamp}] {color} {message}{Colors.ENDC}")

def test_docker_running():
    """Test if Docker is running"""
    try:
        result = subprocess.run(['docker', 'version'], 
                              capture_output=True, 
                              text=True, 
                              timeout=10)
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False

def clear_neo4j_database():
    """Clear Neo4j database"""
    write_status("Clearing Neo4j database...", "info")
    
    if not NEO4J_AVAILABLE:
        write_status("Neo4j driver not available, skipping Neo4j clear", "warning")
        return False
    
    try:
        # Get connection details from environment or use defaults
        uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
        user = os.environ.get("NEO4J_USER", "neo4j")
        password = os.environ.get("NEO4J_PASSWORD", "password")
        
        driver = GraphDatabase.driver(uri, auth=(user, password))
        
        with driver.session() as session:
            # Delete ALL nodes and relationships
            session.run("MATCH (n) DETACH DELETE n")
            # Clear query caches explicitly
            session.run("CALL db.clearQueryCaches()")
        
        driver.close()
        write_status("Neo4j database cleared successfully", "success")
        return True
        
    except Exception as e:
        write_status(f"Failed to clear Neo4j database: {e}", "warning")
        return False

def clear_qdrant_database():
    """Clear Qdrant database"""
    write_status("Clearing Qdrant database...", "info")
    
    if not QDRANT_AVAILABLE:
        write_status("Qdrant client not available, skipping Qdrant clear", "warning")
        return False
    
    try:
        # Get connection details from environment or use defaults
        host = os.environ.get("QDRANT_HOST", "localhost")
        port = int(os.environ.get("QDRANT_PORT", "6333"))
        
        client = QdrantClient(host=host, port=port)
        
        # Get all collections
        collections = client.get_collections()
        
        if collections.collections:
            for collection in collections.collections:
                collection_name = collection.name
                print(f"  Deleting collection: {collection_name}")
                client.delete_collection(collection_name)
            write_status(f"Cleared {len(collections.collections)} collections from Qdrant", "success")
        else:
            write_status("No collections found in Qdrant", "info")
        
        return True
        
    except Exception as e:
        write_status(f"Failed to clear Qdrant database: {e}", "warning")
        return False

def stop_docker_services():
    """Stop Docker services"""
    write_status("Stopping Docker services...", "info")
    
    try:
        # Try from docker directory first
        docker_dir = project_root / "docker"
        if (docker_dir / "docker-compose.yml").exists():
            result = subprocess.run(['docker-compose', 'down'], 
                                  cwd=docker_dir, 
                                  capture_output=True, 
                                  text=True)
        else:
            # Try from root directory
            result = subprocess.run(['docker-compose', 'down'], 
                                  cwd=project_root, 
                                  capture_output=True, 
                                  text=True)
        
        if result.returncode == 0:
            write_status("Docker services stopped", "success")
            return True
        else:
            write_status(f"Failed to stop Docker services: {result.stderr}", "warning")
            return False
            
    except Exception as e:
        write_status(f"Failed to stop Docker services: {e}", "warning")
        return False

def remove_docker_volumes():
    """Remove Docker volumes"""
    write_status("Removing Docker volumes...", "info")
    
    try:
        # Get all volumes
        result = subprocess.run(['docker', 'volume', 'ls', '--format', '{{.Name}}'], 
                              capture_output=True, 
                              text=True)
        
        if result.returncode == 0:
            all_volumes = result.stdout.strip().split('\n')
            # Filter for DADM-related volumes
            dadm_volumes = [v for v in all_volumes if v and any(keyword in v.lower() for keyword in 
                           ['dadm', 'neo4j', 'qdrant', 'postgres', 'camunda'])]
            
            if dadm_volumes:
                write_status(f"Found volumes to remove: {', '.join(dadm_volumes)}", "info")
                
                for volume in dadm_volumes:
                    try:
                        vol_result = subprocess.run(['docker', 'volume', 'rm', volume], 
                                                  capture_output=True, 
                                                  text=True)
                        if vol_result.returncode == 0:
                            write_status(f"Removed volume: {volume}", "success")
                        else:
                            write_status(f"Failed to remove volume {volume}: {vol_result.stderr}", "warning")
                    except Exception as e:
                        write_status(f"Failed to remove volume {volume}: {e}", "warning")
            else:
                write_status("No DADM-related volumes found", "info")
        
        return True
        
    except Exception as e:
        write_status(f"Failed to remove Docker volumes: {e}", "error")
        return False

def remove_docker_images(force=False):
    """Remove Docker images"""
    write_status("Removing Docker images...", "info")
    
    try:
        # Get all images
        result = subprocess.run(['docker', 'images', '--format', '{{.Repository}}:{{.Tag}}'], 
                              capture_output=True, 
                              text=True)
        
        if result.returncode == 0:
            all_images = result.stdout.strip().split('\n')
            # Filter for DADM-related images
            dadm_images = [img for img in all_images if img and any(keyword in img.lower() for keyword in 
                          ['dadm', 'openai-service', 'echo-service'])]
            
            if dadm_images:
                write_status(f"Found images to remove: {', '.join(dadm_images)}", "info")
                
                for image in dadm_images:
                    try:
                        cmd = ['docker', 'rmi']
                        if force:
                            cmd.append('-f')
                        cmd.append(image)
                        
                        img_result = subprocess.run(cmd, capture_output=True, text=True)
                        if img_result.returncode == 0:
                            write_status(f"Removed image: {image}", "success")
                        else:
                            write_status(f"Failed to remove image {image}: {img_result.stderr}", "warning")
                    except Exception as e:
                        write_status(f"Failed to remove image {image}: {e}", "warning")
            else:
                write_status("No DADM-related images found", "info")
        
        return True
        
    except Exception as e:
        write_status(f"Failed to remove Docker images: {e}", "error")
        return False

def start_docker_services():
    """Start Docker services"""
    write_status("Starting Docker services...", "info")
    
    try:
        # Try from docker directory first
        docker_dir = project_root / "docker"
        if (docker_dir / "docker-compose.yml").exists():
            result = subprocess.run(['docker-compose', 'up', '-d'], 
                                  cwd=docker_dir, 
                                  capture_output=True, 
                                  text=True)
        else:
            # Try from root directory
            result = subprocess.run(['docker-compose', 'up', '-d'], 
                                  cwd=project_root, 
                                  capture_output=True, 
                                  text=True)
        
        if result.returncode == 0:
            # Wait for services to start
            write_status("Waiting 30 seconds for services to initialize...", "info")
            time.sleep(30)
            write_status("Docker services started", "success")
            return True
        else:
            write_status(f"Failed to start Docker services: {result.stderr}", "error")
            return False
            
    except Exception as e:
        write_status(f"Failed to start Docker services: {e}", "error")
        return False

def show_service_status():
    """Show service status"""
    write_status("Checking service status...", "info")
    
    try:
        # Check Docker containers
        print(f"\n{Colors.CYAN}=== Docker Container Status ==={Colors.ENDC}")
        result = subprocess.run(['docker', 'ps', '--format', 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print(result.stdout)
        
        # Check Docker volumes
        print(f"\n{Colors.CYAN}=== Docker Volumes ==={Colors.ENDC}")
        result = subprocess.run(['docker', 'volume', 'ls', '--format', 'table {{.Name}}\t{{.Driver}}'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print(result.stdout)
        
        return True
        
    except Exception as e:
        write_status(f"Failed to get service status: {e}", "error")
        return False

def main():
    parser = argparse.ArgumentParser(description="Reset DADM databases and Docker volumes")
    parser.add_argument('--skip-confirmation', action='store_true', 
                       help='Skip confirmation prompt')
    parser.add_argument('--keep-containers', action='store_true', 
                       help='Stop services but do not restart them')
    parser.add_argument('--verbose', action='store_true', 
                       help='Enable verbose output')
    
    args = parser.parse_args()
    
    print("=" * 80)
    print(f"{Colors.GREEN}DADM Database and Docker Reset Script{Colors.ENDC}")
    print("=" * 80)
    
    # Check if Docker is running
    if not test_docker_running():
        write_status("Docker is not running or not accessible", "error")
        write_status("Please start Docker and try again", "error")
        sys.exit(1)
    
    # Confirmation prompt
    if not args.skip_confirmation:
        print(f"\n{Colors.YELLOW}This script will:")
        print("  1. Clear Neo4j database (all nodes and relationships)")
        print("  2. Clear Qdrant database (all collections)")
        print("  3. Stop all Docker services")
        print("  4. Remove Docker volumes (data will be lost)")
        print("  5. Remove Docker images (will need to rebuild)")
        if not args.keep_containers:
            print("  6. Restart Docker services")
        print(f"{Colors.ENDC}")
        
        response = input("Are you sure you want to proceed? (yes/no): ")
        if response.lower() not in ['yes', 'y']:
            write_status("Operation cancelled by user", "info")
            sys.exit(0)
    
    write_status("Starting database and Docker reset process...", "info")
    
    # Step 1: Clear databases before stopping services
    databases_cleared = False
    
    write_status("Attempting to clear databases while services are running...", "info")
    neo4j_cleared = clear_neo4j_database()
    qdrant_cleared = clear_qdrant_database()
    
    if neo4j_cleared and qdrant_cleared:
        databases_cleared = True
        write_status("Both databases cleared successfully while running", "success")
    else:
        write_status("Some databases could not be cleared while running, will retry after restart", "warning")
    
    # Step 2: Stop Docker services
    stop_docker_services()
    
    # Step 3: Remove volumes and images
    remove_docker_volumes()
    remove_docker_images(force=True)
    
    # Step 4: Restart services if requested
    if not args.keep_containers:
        start_docker_services()
        
        # Step 5: Clear databases again if they weren't cleared initially
        if not databases_cleared:
            write_status("Retrying database clearing after restart...", "info")
            time.sleep(10)  # Give services more time to start
            
            neo4j_cleared = clear_neo4j_database()
            qdrant_cleared = clear_qdrant_database()
            
            if neo4j_cleared and qdrant_cleared:
                write_status("Databases cleared successfully after restart", "success")
            else:
                write_status("Some databases still could not be cleared", "warning")
    
    # Step 6: Show final status
    show_service_status()
    
    print(f"\n{'=' * 80}")
    write_status("Database and Docker reset process completed!", "success")
    print("=" * 80)
    
    if args.keep_containers:
        write_status("Note: Docker services were stopped but not restarted (--keep-containers flag)", "info")
        write_status("Run 'docker-compose up -d' to restart services when ready", "info")
    
    write_status("You can now run tests with a clean environment", "info")

if __name__ == "__main__":
    main()
