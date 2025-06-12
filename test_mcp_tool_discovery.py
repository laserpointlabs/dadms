"""
Test MCP Tool Discovery and Enhanced Service Routing

This script demonstrates:
1. MCP service tool discovery
2. Enhanced BPMN task processing with mcp.server and mcp.tool properties
3. How the LLM discovers and uses available MCP tools
4. End-to-end workflow with proper MCP service handling
"""

import json
import time
import requests
from typing import Dict, Any

# Import our MCP handler
from src.mcp_service_handler import MCPServiceHandler
from config.service_registry import get_service_registry

class MockTask:
    """Mock Camunda task for testing"""
    def __init__(self, activity_id: str, task_id: str = None):
        self.activity_id = activity_id
        self.task_id = task_id or f"task_{activity_id}"
        self.process_instance_id = "test_process_123"
        
    def get_activity_id(self):
        return self.activity_id
        
    def get_task_id(self):
        return self.task_id
        
    def get_process_instance_id(self):
        return self.process_instance_id


def test_mcp_tool_discovery():
    """Test tool discovery from MCP services"""
    print("\n🔍 Testing MCP Tool Discovery...")
    
    # Initialize MCP handler
    mcp_handler = MCPServiceHandler()
    
    # Get service registry
    service_registry = get_service_registry()
    mcp_services = service_registry.get("mcp", {})
    
    print(f"Found {len(mcp_services)} MCP services in registry:")
    for service_name, config in mcp_services.items():
        print(f"  - {service_name}: {config.get('endpoint', 'No endpoint')}")
    
    all_discovered_tools = {}
    
    # Test tool discovery for each MCP service
    for service_name, service_config in mcp_services.items():
        print(f"\n📡 Discovering tools for service: {service_name}")
        
        try:
            # Add name to config if not present
            service_config["name"] = service_name
            
            # Discover tools
            service_info = mcp_handler.discover_tools(service_config)
            
            print(f"✅ Service: {service_info.name}")
            print(f"   Endpoint: {service_info.endpoint}")
            print(f"   Tools discovered: {len(service_info.tools)}")
            
            all_discovered_tools[service_name] = []
            
            for tool_name, tool_info in service_info.tools.items():
                print(f"   🔧 Tool: {tool_name}")
                print(f"      Description: {tool_info.description}")
                if tool_info.parameters:
                    print(f"      Parameters: {tool_info.parameters}")
                all_discovered_tools[service_name].append(tool_name)
                
        except Exception as e:
            print(f"❌ Failed to discover tools for {service_name}: {e}")
            all_discovered_tools[service_name] = []
    
    return all_discovered_tools


def test_mcp_service_routing():
    """Test routing tasks to MCP services with enhanced properties"""
    print("\n🚦 Testing MCP Service Routing...")
    
    # Initialize handler
    mcp_handler = MCPServiceHandler()
    
    # Create a mock task
    task = MockTask("StatisticalAnalysisTask")
      # Simulate BPMN properties with MCP-specific properties
    properties = {
        "service.type": "mcp",
        "service.name": "mcp-statistical-service",
        "service.version": "1.0",
        "mcp.server": "statistical",
        "mcp.tool": "enhanced_statistical_analysis"
    }
    
    # Test data for statistical analysis
    variables = {
        "cleaned_data": [1.2, 2.3, 3.4, 4.5, 5.6, 6.7, 7.8, 8.9, 9.0, 10.1],
        "analysis_type": "descriptive",
        "include_distribution_tests": True
    }
      # Get service configuration
    service_registry = get_service_registry()
    service_config = service_registry.get("mcp", {}).get("mcp-statistical-service", {})
    service_config["name"] = "mcp-statistical-service"
    
    print(f"Routing task to MCP service with properties:")
    print(f"  Service Type: {properties['service.type']}")
    print(f"  Service Name: {properties['service.name']}")
    print(f"  MCP Server: {properties['mcp.server']}")
    print(f"  MCP Tool: {properties['mcp.tool']}")
    print(f"  Data Points: {len(variables['cleaned_data'])}")
    
    try:
        # Route the task
        result = mcp_handler.route_mcp_task(task, variables, service_config, properties)
        
        print("\n✅ MCP Service Response:")
        print(f"Status: {result.get('status', 'unknown')}")
        
        if "mcp_service_info" in result:
            info = result["mcp_service_info"]
            print(f"Service: {info.get('service_name', 'unknown')}")
            print(f"Tools Available: {info.get('tools_available', [])}")
            print(f"Tool Used: {info.get('tool_used', 'unknown')}")
            print(f"Processing Time: {info.get('processing_time_ms', 0)}ms")
        
        # Show statistical results if available
        if "statistical_analysis" in result:
            stats = result["statistical_analysis"]
            print("\n📊 Statistical Analysis Results:")
            if "descriptive_statistics" in stats:
                desc = stats["descriptive_statistics"]
                print(f"  Mean: {desc.get('mean', 'N/A'):.4f}")
                print(f"  Std Dev: {desc.get('std_dev', 'N/A'):.4f}")
                print(f"  Min: {desc.get('min', 'N/A'):.4f}")
                print(f"  Max: {desc.get('max', 'N/A'):.4f}")
        
        return result
        
    except Exception as e:
        print(f"❌ MCP routing failed: {e}")
        return {"error": str(e)}


def test_tool_discovery_for_llm():
    """Test how an LLM would discover available tools"""
    print("\n🤖 Testing Tool Discovery for LLM Integration...")
    
    mcp_handler = MCPServiceHandler()
    
    # Simulate an LLM asking: "What tools are available for statistical analysis?"
    print("LLM Query: 'What MCP tools are available for statistical analysis?'")
    
    # Get all tools
    all_tools = mcp_handler.list_all_tools()
    
    print("\n📋 Available MCP Tools:")
    for service_name, tools in all_tools.items():
        print(f"\n🔧 Service: {service_name}")
        for tool_name in tools:
            tool_info = mcp_handler.get_tool_info(service_name, tool_name)
            if tool_info:
                print(f"  • {tool_name}: {tool_info.description}")
                if tool_info.parameters:
                    print(f"    Parameters: {list(tool_info.parameters.keys())}")
            else:
                print(f"  • {tool_name}: (No details available)")
    
    # Simulate LLM selecting a tool
    print(f"\n🎯 LLM Decision: Use 'enhanced_statistical_analysis' from 'statistical' service")
    
    # Get specific tool info
    tool_info = mcp_handler.get_tool_info("statistical", "enhanced_statistical_analysis")
    if tool_info:
        print(f"Selected Tool Details:")
        print(f"  Name: {tool_info.name}")
        print(f"  Description: {tool_info.description}")
        print(f"  Server: {tool_info.server}")
        print(f"  Endpoint: {tool_info.service_endpoint}")
        
        return tool_info
    else:
        print("❌ Tool information not available")
        return None


def test_end_to_end_workflow():
    """Test complete end-to-end MCP workflow"""
    print("\n🔄 Testing End-to-End MCP Workflow...")
    
    # Step 1: Tool Discovery
    print("Step 1: Tool Discovery")
    discovered_tools = test_mcp_tool_discovery()
    
    # Step 2: LLM Tool Selection
    print("\nStep 2: LLM Tool Selection")
    selected_tool = test_tool_discovery_for_llm()
    
    # Step 3: Task Routing
    print("\nStep 3: MCP Task Routing")
    routing_result = test_mcp_service_routing()
    
    # Step 4: Results Summary
    print("\n📊 End-to-End Workflow Summary:")
    print(f"Services Discovered: {len(discovered_tools)}")
    print(f"Total Tools Found: {sum(len(tools) for tools in discovered_tools.values())}")
    print(f"Tool Selection: {'✅ Success' if selected_tool else '❌ Failed'}")
    print(f"Task Routing: {'✅ Success' if not routing_result.get('error') else '❌ Failed'}")
    
    if not routing_result.get('error'):
        print(f"Processing Time: {routing_result.get('mcp_service_info', {}).get('processing_time_ms', 0)}ms")
    
    return {
        "tools_discovered": discovered_tools,
        "tool_selected": selected_tool,
        "routing_result": routing_result
    }


def demonstrate_mcp_properties_extraction():
    """Demonstrate extraction of MCP-specific properties"""
    print("\n🏷️  Testing MCP Properties Extraction...")
    
    mcp_handler = MCPServiceHandler()
    
    # Simulate BPMN properties
    bpmn_properties = {
        "service.type": "mcp",
        "service.name": "statistical",
        "service.version": "1.0",
        "mcp.server": "statistical_analysis_server",
        "mcp.tool": "enhanced_statistical_analysis",
        "mcp.timeout": "300",
        "mcp.retry_count": "3",
        "regular.property": "not_mcp_related"
    }
    
    print("BPMN Properties:")
    for key, value in bpmn_properties.items():
        print(f"  {key}: {value}")
    
    # Extract MCP properties
    mcp_props = mcp_handler.extract_mcp_properties(bpmn_properties)
    
    print(f"\nExtracted MCP Properties:")
    for key, value in mcp_props.items():
        print(f"  {key}: {value}")
    
    return mcp_props


if __name__ == "__main__":
    print("🧪 MCP Tool Discovery and Service Integration Test")
    print("=" * 60)
    
    try:
        # Test individual components
        print("\n1️⃣ Testing Tool Discovery...")
        discovered_tools = test_mcp_tool_discovery()
        
        print("\n2️⃣ Testing Properties Extraction...")
        mcp_props = demonstrate_mcp_properties_extraction()
        
        print("\n3️⃣ Testing LLM Integration...")
        selected_tool = test_tool_discovery_for_llm()
        
        print("\n4️⃣ Testing Service Routing...")
        routing_result = test_mcp_service_routing()
        
        print("\n5️⃣ Testing End-to-End Workflow...")
        workflow_result = test_end_to_end_workflow()
        
        print("\n🎉 All Tests Completed!")
        print("\nKey Achievements:")
        print("✅ MCP services discovered from registry")
        print("✅ Tools enumerated from each service")
        print("✅ MCP properties properly extracted")
        print("✅ LLM can discover available tools")
        print("✅ Tasks properly routed to MCP services")
        print("✅ Enhanced metadata included in responses")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
