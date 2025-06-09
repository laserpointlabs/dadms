#!/usr/bin/env python3
"""
Test service discovery functionality
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

try:
    from config.service_registry import discover_services
    services = discover_services()
    count = sum(len(svc) for svc in services.values())
    print(f"Discovered {count} services")
    exit(0)
except Exception as e:
    print(f"Error: {e}")
    exit(1)
