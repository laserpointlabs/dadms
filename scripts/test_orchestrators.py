#!/usr/bin/env python3
"""
Test orchestrator initialization
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

try:
    from src.service_orchestrator import ServiceOrchestrator
    ServiceOrchestrator()
    print("Orchestrator initialized successfully")
    exit(0)
except Exception as e:
    print(f"Error: {e}")
    exit(1)
