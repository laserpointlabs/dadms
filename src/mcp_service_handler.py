"""
MCP Service Handler

This module provides specialized handling for Model Context Protocol (MCP) services,
including tool discovery, property parsing, and enhanced routing capabilities.
"""

import json
import logging
import requests
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin

logger = logging.getLogger(__name__)


@dataclass
class MCPToolInfo:
    """Information about an available MCP tool."""
    name: str
    description: str
    parameters: Dict[str, Any] = field(default_factory=dict)
    server: str = ""
    service_endpoint: str = ""


@dataclass 
class MCPServiceInfo:
    """Information about an MCP service and its available tools."""
    name: str
    endpoint: str
    description: str = ""
    tools: Dict[str, MCPToolInfo] = field(default_factory=dict)
    server_type: str = ""
    last_discovery: float = 0


class MCPServiceHandler:
    """Handles MCP service operations including tool discovery and routing."""
    
    def __init__(self, timeout: int = 30):
        """
        Initialize the MCP service handler.
        
        Args:
            timeout: Timeout for service requests in seconds
        """
        self.timeout = timeout
        self._service_cache: Dict[str, MCPServiceInfo] = {}
        self._tool_cache_ttl = 300  # 5 minutes
        
    def discover_tools(self, service_config: Dict[str, Any]) -> MCPServiceInfo:
        """
        Discover available tools from an MCP service.
        
        Args:
            service_config: Service configuration from registry
            
        Returns:
            MCPServiceInfo: Information about the service and its tools
        """
        service_name = service_config.get("name", "unknown")
        endpoint = service_config.get("endpoint", "")
        
        # Check cache first
        if service_name in self._service_cache:
            cached_service = self._service_cache[service_name]
            if time.time() - cached_service.last_discovery < self._tool_cache_ttl:
                logger.debug(f"Using cached tool info for MCP service: {service_name}")
                return cached_service
        
        logger.info(f"Discovering tools for MCP service: {service_name} at {endpoint}")
        
        service_info = MCPServiceInfo(
            name=service_name,
            endpoint=endpoint,
            description=service_config.get("description", ""),
            last_discovery=time.time()
        )
        
        try:
            # Try to get tools from /tools endpoint
            tools_url = urljoin(endpoint, '/tools')
            response = requests.get(tools_url, timeout=self.timeout)
            
            if response.status_code == 200:
                tools_data = response.json()
                logger.info(f"Successfully discovered tools from {tools_url}")
                self._parse_tools_response(tools_data, service_info)
            else:
                logger.warning(f"Tools endpoint returned {response.status_code} for {service_name}")
                self._load_fallback_tools(service_config, service_info)
                
        except requests.RequestException as e:
            logger.warning(f"Failed to discover tools from {service_name}: {e}")
            self._load_fallback_tools(service_config, service_info)
        except Exception as e:
            logger.error(f"Error discovering tools for {service_name}: {e}")
            self._load_fallback_tools(service_config, service_info)
        
        # Cache the service info
        self._service_cache[service_name] = service_info
        return service_info
    
    def _parse_tools_response(self, tools_data: Dict[str, Any], service_info: MCPServiceInfo):
        """Parse tools response and populate service info."""
        tools = tools_data.get("tools", [])
        
        for tool_data in tools:
            if isinstance(tool_data, dict):
                tool_name = tool_data.get("name", "")
                if tool_name:
                    tool_info = MCPToolInfo(
                        name=tool_name,
                        description=tool_data.get("description", ""),
                        parameters=tool_data.get("parameters", {}),
                        server=service_info.name,
                        service_endpoint=service_info.endpoint
                    )
                    service_info.tools[tool_name] = tool_info
                    logger.debug(f"Added tool: {tool_name} for service {service_info.name}")
    
    def _load_fallback_tools(self, service_config: Dict[str, Any], service_info: MCPServiceInfo):
        """Load fallback tools from service configuration."""
        fallback_tools = service_config.get("tools", [])
        
        for tool_name in fallback_tools:
            tool_info = MCPToolInfo(
                name=tool_name,
                description=f"Tool from {service_info.name} service",
                server=service_info.name,
                service_endpoint=service_info.endpoint
            )
            service_info.tools[tool_name] = tool_info
            logger.debug(f"Added fallback tool: {tool_name} for service {service_info.name}")
    
    def extract_mcp_properties(self, properties: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract MCP-specific properties from service properties.
        
        Args:
            properties: Service properties from BPMN task
            
        Returns:
            Dictionary with extracted MCP properties
        """
        mcp_props = {}
        
        # Extract mcp.* properties
        for key, value in properties.items():
            if key.startswith("mcp."):
                mcp_props[key] = value
        
        # Add derived properties
        mcp_props["service_type"] = "mcp"
        mcp_props["server_name"] = properties.get("service.name", "")
        
        return mcp_props
    
    def route_mcp_task(self, task, variables: Dict[str, Any], service_config: Dict[str, Any], 
                       properties: Dict[str, Any]) -> Dict[str, Any]:
        """
        Route a task to an MCP service with enhanced handling.
        
        Args:
            task: Camunda external task object
            variables: Task variables
            service_config: Service configuration from registry
            properties: Service properties from BPMN
            
        Returns:
            Result from the MCP service
        """
        service_name = service_config.get("name", properties.get("service.name", "unknown"))
        endpoint = service_config.get("endpoint", "")
        
        logger.info(f"Routing task to MCP service: {service_name}")
        
        # Discover tools if not cached
        service_info = self.discover_tools(service_config)
        
        # Extract MCP properties
        mcp_props = self.extract_mcp_properties(properties)
        
        # Check if specific tool is requested
        requested_tool = mcp_props.get("mcp.tool")
        if requested_tool and requested_tool not in service_info.tools:
            logger.warning(f"Requested tool '{requested_tool}' not found in service {service_name}")
            logger.info(f"Available tools: {list(service_info.tools.keys())}")
        
        # Prepare enhanced payload for MCP service
        task_name = task.get_activity_id() if hasattr(task, 'get_activity_id') else "unknown_task"
        
        payload = {
            "task_name": task_name,
            "task_description": f"MCP task execution for {task_name}",
            "variables": variables or {},
            "service_properties": properties,
            "mcp_properties": mcp_props,
            "available_tools": list(service_info.tools.keys()),
            "requested_tool": requested_tool,
            "service_metadata": {
                "service_name": service_name,
                "service_type": "mcp",
                "tools_discovered": len(service_info.tools),
                "discovery_time": service_info.last_discovery
            }
        }
        
        # Make the request
        url = urljoin(endpoint, '/process_task')
        
        try:
            logger.info(f"Sending MCP request to {url}")
            logger.debug(f"MCP payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(url, json=payload, timeout=self.timeout)
            
            if response.status_code == 200:
                result = response.json().get("result", {})
                
                # Enhance result with MCP metadata
                result["mcp_service_info"] = {
                    "service_name": service_name,
                    "tools_available": list(service_info.tools.keys()),
                    "tool_used": result.get("mcp_tool_used", "unknown"),
                    "processing_time_ms": result.get("processing_time_ms", 0)
                }
                
                logger.info(f"MCP service {service_name} processed task successfully")
                return result
            else:
                error_msg = response.json().get("message", f"HTTP {response.status_code}")
                logger.error(f"MCP service request failed: {error_msg}")
                raise Exception(f"MCP service request failed: {error_msg}")
                
        except requests.RequestException as e:
            error_msg = f"Network error calling MCP service {service_name}: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
        except Exception as e:
            error_msg = f"Error routing task to MCP service {service_name}: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
    
    def get_available_tools(self, service_name: str) -> List[str]:
        """
        Get list of available tools for an MCP service.
        
        Args:
            service_name: Name of the MCP service
            
        Returns:
            List of available tool names
        """
        if service_name in self._service_cache:
            return list(self._service_cache[service_name].tools.keys())
        return []
    
    def get_tool_info(self, service_name: str, tool_name: str) -> Optional[MCPToolInfo]:
        """
        Get detailed information about a specific tool.
        
        Args:
            service_name: Name of the MCP service
            tool_name: Name of the tool
            
        Returns:
            MCPToolInfo if found, None otherwise
        """
        if service_name in self._service_cache:
            return self._service_cache[service_name].tools.get(tool_name)
        return None
    
    def list_all_tools(self) -> Dict[str, List[str]]:
        """
        List all tools from all cached MCP services.
        
        Returns:
            Dictionary mapping service names to their available tools
        """
        all_tools = {}
        for service_name, service_info in self._service_cache.items():
            all_tools[service_name] = list(service_info.tools.keys())
        return all_tools
