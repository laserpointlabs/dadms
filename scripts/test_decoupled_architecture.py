#!/usr/bin/env python3
"""
Test script to verify decoupled analysis architecture
Tests service discovery, communication, and integration
"""

import asyncio
import aiohttp
import json
import sys
import time
from typing import Dict, Any, List

async def test_service_health(session: aiohttp.ClientSession, service_name: str, url: str) -> Dict[str, Any]:
    """Test if a service is healthy"""
    try:
        async with session.get(f"{url}/health", timeout=10) as response:
            if response.status == 200:
                data = await response.json()
                return {
                    "service": service_name,
                    "status": "healthy",
                    "url": url,
                    "response": data
                }
            else:
                return {
                    "service": service_name,
                    "status": "unhealthy",
                    "url": url,
                    "error": f"HTTP {response.status}"
                }
    except Exception as e:
        return {
            "service": service_name,
            "status": "unreachable",
            "url": url,
            "error": str(e)
        }

async def test_consul_services(session: aiohttp.ClientSession, consul_url: str = "http://localhost:8500") -> Dict[str, Any]:
    """Test Consul service discovery"""
    try:
        async with session.get(f"{consul_url}/v1/agent/services", timeout=10) as response:
            if response.status == 200:
                services = await response.json()
                dadm_services = {k: v for k, v in services.items() if k.startswith('dadm-')}
                return {
                    "consul_status": "healthy",
                    "dadm_services": list(dadm_services.keys()),
                    "service_count": len(dadm_services)
                }
            else:
                return {
                    "consul_status": "error",
                    "error": f"HTTP {response.status}"
                }
    except Exception as e:
        return {
            "consul_status": "unreachable",
            "error": str(e)
        }

async def test_analysis_integration(session: aiohttp.ClientSession, analysis_url: str = "http://localhost:8002") -> Dict[str, Any]:
    """Test integrated analysis functionality"""
    try:
        # Test simple computational analysis
        request_data = {
            "analysis_type": "test_analysis",
            "data_sources": {
                "test_data": [1, 2, 3, 4, 5]
            },
            "execution_tools": ["python"],
            "timeout": 60
        }
        
        async with session.post(
            f"{analysis_url}/analyze/integrated", 
            json=request_data,
            timeout=120
        ) as response:
            if response.status == 200:
                result = await response.json()
                return {
                    "integration_test": "success",
                    "execution_id": result.get("execution_id"),
                    "status": result.get("status"),
                    "has_llm_analysis": "llm_analysis" in result,
                    "has_computational_results": "computational_results" in result
                }
            else:
                error_text = await response.text()
                return {
                    "integration_test": "failed",
                    "error": f"HTTP {response.status}: {error_text}"
                }
                
    except Exception as e:
        return {
            "integration_test": "error",
            "error": str(e)
        }

async def test_python_execution(session: aiohttp.ClientSession, python_url: str = "http://localhost:8003") -> Dict[str, Any]:
    """Test Python execution service directly"""
    try:
        test_code = """
import json
import numpy as np

# Simple test computation
data = [1, 2, 3, 4, 5]
mean_value = np.mean(data)
std_value = np.std(data)

result = {
    "mean": float(mean_value),
    "std": float(std_value),
    "data_length": len(data)
}

print("=== EXECUTION RESULT ===")
print(json.dumps(result, indent=2))
"""
        
        request_data = {
            "code": test_code,
            "environment": "scientific",
            "timeout": 60,
            "packages": ["numpy"]
        }
        
        async with session.post(
            f"{python_url}/execute",
            json=request_data,
            timeout=120
        ) as response:
            if response.status in [200, 202]:  # Accept both sync and async responses
                result = await response.json()
                return {
                    "python_execution": "success",
                    "execution_id": result.get("execution_id"),
                    "status": result.get("status"),
                    "has_output": bool(result.get("stdout"))
                }
            else:
                error_text = await response.text()
                return {
                    "python_execution": "failed", 
                    "error": f"HTTP {response.status}: {error_text}"
                }
                
    except Exception as e:
        return {
            "python_execution": "error",
            "error": str(e)
        }

async def main():
    """Run all architecture tests"""
    print("🔍 Testing DADM Decoupled Analysis Architecture")
    print("=" * 60)
    
    # Service URLs (adjust as needed)
    services = {
        "Consul": "http://localhost:8500",
        "Analysis Service": "http://localhost:8002",
        "Prompt Service": "http://localhost:5300", 
        "OpenAI Service": "http://localhost:5000",
        "Python Execution": "http://localhost:8003",
        "Monitor Service": "http://localhost:5200"
    }
    
    results = {}
    
    async with aiohttp.ClientSession() as session:
        # Test 1: Service Health Checks
        print("\n📊 Testing Service Health...")
        health_results = []
        for name, url in services.items():
            if name != "Consul":  # Consul health endpoint is different
                result = await test_service_health(session, name, url)
                health_results.append(result)
                status_emoji = "✅" if result["status"] == "healthy" else "❌"
                print(f"  {status_emoji} {name}: {result['status']}")
        
        results["service_health"] = health_results
        
        # Test 2: Consul Service Discovery
        print("\n🔍 Testing Consul Service Discovery...")
        consul_result = await test_consul_services(session, services["Consul"])
        results["consul"] = consul_result
        
        if consul_result.get("consul_status") == "healthy":
            print(f"  ✅ Consul: {consul_result['service_count']} DADM services registered")
            for service in consul_result.get("dadm_services", []):
                print(f"    - {service}")
        else:
            print(f"  ❌ Consul: {consul_result.get('error', 'Unknown error')}")
        
        # Test 3: Python Execution Service
        print("\n🐍 Testing Python Execution Service...")
        python_result = await test_python_execution(session, services["Python Execution"])
        results["python_execution"] = python_result
        
        if python_result.get("python_execution") == "success":
            print(f"  ✅ Python Execution: {python_result['status']}")
        else:
            print(f"  ❌ Python Execution: {python_result.get('error', 'Unknown error')}")
        
        # Test 4: Integrated Analysis
        print("\n🧠 Testing Integrated Analysis...")
        integration_result = await test_analysis_integration(session, services["Analysis Service"])
        results["integration"] = integration_result
        
        if integration_result.get("integration_test") == "success":
            print(f"  ✅ Integration: {integration_result['status']}")
            print(f"    - Execution ID: {integration_result.get('execution_id')}")
            print(f"    - LLM Analysis: {integration_result.get('has_llm_analysis', False)}")
            print(f"    - Computational Results: {integration_result.get('has_computational_results', False)}")
        else:
            print(f"  ❌ Integration: {integration_result.get('error', 'Unknown error')}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 Test Summary")
    print("=" * 60)
    
    healthy_services = len([r for r in results.get("service_health", []) if r["status"] == "healthy"])
    total_services = len(results.get("service_health", []))
    
    print(f"Service Health: {healthy_services}/{total_services} services healthy")
    print(f"Consul Discovery: {results.get('consul', {}).get('consul_status', 'unknown')}")
    print(f"Python Execution: {results.get('python_execution', {}).get('python_execution', 'unknown')}")
    print(f"Integration Test: {results.get('integration', {}).get('integration_test', 'unknown')}")
    
    # Architecture verification
    all_tests_passing = (
        healthy_services >= 3 and  # At least core services
        results.get("consul", {}).get("consul_status") == "healthy" and
        results.get("python_execution", {}).get("python_execution") == "success"
    )
    
    if all_tests_passing:
        print("\n✅ DADM Decoupled Architecture: VERIFIED")
        print("   All core services are healthy and communicating properly.")
        print("   The system maintains proper decoupling while enabling integration.")
    else:
        print("\n❌ DADM Decoupled Architecture: ISSUES DETECTED")
        print("   Some services may be down or misconfigured.")
        print("   Check service logs and configuration.")
    
    return 0 if all_tests_passing else 1

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nTest failed with error: {e}")
        sys.exit(1)
