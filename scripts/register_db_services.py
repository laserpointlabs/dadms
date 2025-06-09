#!/usr/bin/env python3
"""
Database Service Registration Script

This script registers database services (Qdrant and Neo4j) with Consul.
It's designed to be run after the containers are up and healthy.
"""

import requests
import json
import time
import sys
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("db_registration")

# Consul API endpoint
CONSUL_HOST = os.environ.get("CONSUL_HOST", "localhost")
CONSUL_PORT = os.environ.get("CONSUL_PORT", "8500")
CONSUL_API = f"http://{CONSUL_HOST}:{CONSUL_PORT}/v1"

# Database services to register
DB_SERVICES = [
    {
        "name": "dadm-qdrant",
        "id": "dadm-qdrant",
        "address": "qdrant",
        "port": 6333,
        "tags": ["database", "vector-store", "qdrant"],
        "meta": {
            "version": "v1.8.1",
            "type": "database",
            "description": "Vector database for semantic search"
        },
        "checks": [
            {
                "http": "http://qdrant:6333/readiness",
                "interval": "10s",
                "timeout": "5s"
            }
        ]
    },
    {
        "name": "dadm-neo4j",
        "id": "dadm-neo4j", 
        "address": "neo4j",
        "port": 7687,
        "tags": ["database", "graph-database", "neo4j"],
        "meta": {
            "version": "5.16.0",
            "type": "database",
            "description": "Graph database for relationship modeling"
        },
        "checks": [
            {
                "tcp": "neo4j:7687",
                "interval": "10s",
                "timeout": "5s" 
            },
            {
                "http": "http://neo4j:7474",
                "interval": "30s",
                "timeout": "10s"
            }
        ]
    }
]

def register_service(service):
    """Register a service with Consul."""
    url = f"{CONSUL_API}/agent/service/register"
    try:
        response = requests.put(url, json=service)
        response.raise_for_status()
        logger.info(f"Successfully registered service {service['name']} with Consul")
        return True
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to register service {service['name']}: {e}")
        return False

def wait_for_consul():
    """Wait for Consul to be ready."""
    url = f"{CONSUL_API}/status/leader"
    max_attempts = 10
    attempt = 0
    
    while attempt < max_attempts:
        try:
            response = requests.get(url)
            if response.status_code == 200:
                logger.info("Consul is ready")
                return True
            else:
                logger.warning(f"Consul not ready yet, status code: {response.status_code}")
        except requests.exceptions.RequestException as e:
            logger.warning(f"Could not connect to Consul: {e}")
        
        attempt += 1
        logger.info(f"Waiting for Consul... Attempt {attempt}/{max_attempts}")
        time.sleep(5)
    
    logger.error("Consul not available after maximum attempts")
    return False

def main():
    """Main function to register database services."""
    if not wait_for_consul():
        sys.exit(1)
    
    success_count = 0
    for service in DB_SERVICES:
        if register_service(service):
            success_count += 1
    
    if success_count == len(DB_SERVICES):
        logger.info("All database services registered successfully")
    else:
        logger.warning(f"Registered {success_count}/{len(DB_SERVICES)} database services")

if __name__ == "__main__":
    main()
