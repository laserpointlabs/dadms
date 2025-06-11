#!/usr/bin/env python3
"""
Simple Data Persistence Manager for DADM

Captures analysis inputs and expands JSON responses into Neo4j semantic graph.
"""

import os
import json
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any

from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable, AuthError

# Set up logging
logger = logging.getLogger(__name__)

class DataPersistenceManager:
    """
    Simple data persistence for DADM OpenAI service interactions
    """
    
    def __init__(self, 
                 neo4j_uri: str = "bolt://localhost:7687",
                 neo4j_user: str = "neo4j",
                 neo4j_password: str = "password",
                 **kwargs):  # Accept other args for compatibility
        """Initialize the data persistence manager"""
        self.neo4j_uri = neo4j_uri
        self.neo4j_user = neo4j_user
        self.neo4j_password = neo4j_password
        self.neo4j_driver = None
        
        # Initialize Neo4j connection
        self._initialize_neo4j()
    
    def _initialize_neo4j(self):
        """Initialize Neo4j connection"""
        try:
            self.neo4j_driver = GraphDatabase.driver(
                self.neo4j_uri, 
                auth=(self.neo4j_user, self.neo4j_password)
            )
            # Test connection
            with self.neo4j_driver.session() as session:
                session.run("RETURN 1")
            logger.info(f"Connected to Neo4j at {self.neo4j_uri}")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            self.neo4j_driver = None

    def capture_analysis_start(self, task_name: str, task_input: Dict[str, Any], process_id: str) -> str:
        """
        Capture when analysis starts - create task node and input data
        
        Returns:
            analysis_id: Unique identifier for this analysis
        """
        if not self.neo4j_driver:
            logger.warning("Neo4j not available")
            return str(uuid.uuid4())
        
        analysis_id = str(uuid.uuid4())
        
        try:
            with self.neo4j_driver.session() as session:                # Create Analysis node with proper name
                session.run("""
                    CREATE (a:Analysis {
                        id: $analysis_id,
                        name: $name,
                        task_name: $task_name,
                        process_id: $process_id,
                        status: 'started',
                        created_at: datetime(),
                        input_data: $input_data
                    })
                """, 
                analysis_id=analysis_id,
                name=f"Analysis: {task_name}",
                task_name=task_name,
                process_id=process_id,
                input_data=json.dumps(task_input)
                )
                
                # Expand input data into semantic nodes
                self._expand_json_to_graph(session, task_input, analysis_id, "INPUT")
                
                logger.info(f"Captured analysis start: {analysis_id}")
                return analysis_id
                
        except Exception as e:
            logger.error(f"Error capturing analysis start: {e}")
            return analysis_id

    def capture_analysis_response(self, analysis_id: str, response_data: Dict[str, Any]):
        """
        Capture when analysis response is returned - expand JSON into semantic graph
        """
        if not self.neo4j_driver:
            logger.warning("Neo4j not available")
            return
        
        try:
            with self.neo4j_driver.session() as session:
                # Update Analysis node with response
                session.run("""
                    MATCH (a:Analysis {id: $analysis_id})
                    SET a.status = 'completed',
                        a.completed_at = datetime(),
                        a.response_data = $response_data
                """, 
                analysis_id=analysis_id,
                response_data=json.dumps(response_data)
                )
                  # Expand response data into semantic nodes
                self._expand_json_to_graph(session, response_data, analysis_id, "OUTPUT")
                
                # Special handling for recommendation field containing JSON strings
                if 'recommendation' in response_data:
                    recommendation_content = response_data['recommendation']
                    if isinstance(recommendation_content, str):
                        try:
                            # Try to parse as JSON
                            parsed_recommendation = json.loads(recommendation_content)
                            logger.info(f"Expanding parsed JSON recommendation with {len(str(parsed_recommendation))} characters")
                            self._expand_json_to_graph(session, parsed_recommendation, analysis_id, "RECOMMENDATION")
                        except json.JSONDecodeError:
                            logger.info(f"Recommendation is text, not JSON - storing as text value")
                    else:
                        # If it's already a dict/object, expand it
                        self._expand_json_to_graph(session, recommendation_content, analysis_id, "RECOMMENDATION")
                
                logger.info(f"Captured analysis response: {analysis_id}")
                
        except Exception as e:
            logger.error(f"Error capturing analysis response: {e}")

    def _expand_json_to_graph(self, session, data: Any, analysis_id: str, data_type: str, parent_id: Optional[str] = None, key: Optional[str] = None):
        """
        Recursively expand JSON data into semantic graph nodes
        """
        try:
            # Debug: Log the incoming data
            if parent_id is None:  # Only log top-level calls to avoid excessive logging
                try:
                    logger.info(f"=== EXPANDING JSON TO GRAPH ===")
                    logger.info(f"Data type: {data_type}, Key: {key}")
                    logger.info(f"Data structure type: {type(data).__name__}")
                    if isinstance(data, dict):
                        logger.info(f"Dict keys: {list(data.keys())}")
                    elif isinstance(data, list):
                        logger.info(f"List length: {len(data)}")
                    else:
                        logger.info(f"Value: {data}")
                except Exception as e:
                    logger.info(f"Error logging data: {e}")
            
            if isinstance(data, dict):
                # Create a node for this object
                node_id = str(uuid.uuid4())
                node_type = self._get_semantic_node_type(key, data)                
                
                # Generate meaningful node name based on content
                node_name = self._generate_node_name(key, data, node_type)
                logger.info(f"Generated node name: '{node_name}' for node_type: '{node_type}', key: '{key}'")
                
                # Use parameterized query to avoid f-string issues
                query = """
                    CREATE (n:{node_type} {{
                        id: $node_id,
                        name: $name,
                        analysis_id: $analysis_id,
                        data_type: $data_type,
                        key: $key,
                        created_at: datetime()
                    }})
                """.format(node_type=node_type)
                
                session.run(query, 
                    node_id=node_id,
                    name=node_name,
                    analysis_id=analysis_id,
                    data_type=data_type,
                    key=key or "root"
                )
                  # Connect to parent if exists
                if parent_id:
                    relationship = self._get_semantic_relationship(key)
                    query = """
                        MATCH (parent {{id: $parent_id}})
                        MATCH (child {{id: $node_id}})
                        CREATE (parent)-[:{relationship}]->(child)
                    """.format(relationship=relationship)
                    
                    session.run(query, 
                        parent_id=parent_id,
                        node_id=node_id
                    )
                else:
                    # Connect to Analysis root
                    query = """
                        MATCH (a:Analysis {{id: $analysis_id}})
                        MATCH (n {{id: $node_id}})
                        CREATE (a)-[:{rel_type}]->(n)
                    """.format(rel_type=f"HAS_{data_type}")
                    
                    session.run(query, 
                        analysis_id=analysis_id,
                        node_id=node_id
                    )
                
                # Recursively process dictionary items
                for k, v in data.items():
                    self._expand_json_to_graph(session, v, analysis_id, data_type, node_id, k)
                    
            elif isinstance(data, list):
                # Create nodes for list items
                for i, item in enumerate(data):
                    self._expand_json_to_graph(session, item, analysis_id, data_type, parent_id, f"{key}_item_{i}")
                    
            else:
                # Create a value node                
                if parent_id and data is not None:
                    value_id = str(uuid.uuid4())                    # Generate a descriptive name for the value
                    value_str = str(data)
                    # Note: Removed truncation as we now use PostgreSQL which can handle large text fields
                    clean_key = key.replace('_', ' ').title() if key else "Value"
                    value_name = f"{clean_key}: {value_str}"
                    logger.info(f"Generated value node name: '{value_name}' for key: '{key}', value length: {len(value_str)} characters")
                    
                    session.run("""
                        CREATE (v:Value {
                            id: $value_id,
                            name: $name,
                            analysis_id: $analysis_id,
                            data_type: $data_type,
                            key: $key,
                            value: $value,
                            value_type: $value_type,
                            created_at: datetime()
                        })
                    """, 
                    value_id=value_id,
                    name=value_name,
                    analysis_id=analysis_id,
                    data_type=data_type,
                    key=key,
                    value=str(data),
                    value_type=type(data).__name__
                    )
                      # Connect to parent
                    relationship = self._get_semantic_relationship(key)
                    query = """
                        MATCH (parent {{id: $parent_id}})
                        MATCH (value {{id: $value_id}})
                        CREATE (parent)-[:{relationship}]->(value)
                    """.format(relationship=relationship)
                    
                    session.run(query,
                        parent_id=parent_id,
                        value_id=value_id
                    )
              # Special handling for AIResponse nodes
            if key and key.upper() == "AIRESPONSE":
                node_id = str(uuid.uuid4())
                ai_response_name = "AI Response: " + key if key else "AI Response"
                logger.info(f"Creating AIResponse node with name: '{ai_response_name}'")
                
                session.run("""
                    CREATE (n:AIResponse {
                        id: $node_id,
                        name: $name,
                        analysis_id: $analysis_id,
                        data_type: $data_type,
                        key: $key,
                        created_at: datetime()
                    })
                """,
                node_id=node_id,
                name=ai_response_name,
                analysis_id=analysis_id,
                data_type=data_type,
                key=key
                )

                if parent_id:
                    session.run("""
                        MATCH (parent {id: $parent_id})
                        MATCH (child {id: $node_id})
                        CREATE (parent)-[:HAS_AI_RESPONSE]->(child)
                    """,
                    parent_id=parent_id,
                    node_id=node_id
                    )

                # Recursively expand the contents of AIResponse
                if isinstance(data, dict):
                    for k, v in data.items():
                        self._expand_json_to_graph(session, v, analysis_id, data_type, node_id, k)
                elif isinstance(data, list):
                    for i, item in enumerate(data):
                        self._expand_json_to_graph(session, item, analysis_id, data_type, node_id, f"item_{i}")
                return  # Skip further processing for this node
                
        except Exception as e:
            logger.error(f"Error expanding JSON to graph: {e}")

    def _generate_node_name(self, key: Optional[str], data: Any, node_type: str) -> str:
        """Generate a meaningful name for a node based on its content and type"""
        if not key:
            return f"{node_type}_Root"
        
        # Clean up the key to make it more readable
        clean_key = key.replace('_', ' ').title()
          # For specific node types, try to extract meaningful names from data
        if isinstance(data, dict):
            # Look for common name fields
            name_fields = ['name', 'title', 'label', 'primary_choice', 'methodology', 'task_type']
            for field in name_fields:
                if field in data and data[field]:
                    value = str(data[field])
                    # Note: Removed truncation as we now use PostgreSQL which can handle large text fields
                    return f"{clean_key}: {value}"
            
            # For stakeholders, try to get role or interests
            if node_type == "Stakeholder" and 'role' in data:
                return f"{clean_key}: {data['role']}"
            
            # For criteria, try to get the criterion name
            if node_type == "Criterion" and 'name' in data:
                return f"Criterion: {data['name']}"
              # For recommendations, use primary_choice if available
            if node_type == "Recommendation":
                if 'primary_choice' in data:
                    return f"Recommendation: {data['primary_choice']}"
                elif 'reasoning' in data:
                    reasoning = str(data['reasoning'])  # Note: Removed truncation as we now use PostgreSQL which can handle large text fields
                    return f"Recommendation: {reasoning}"
        
        # Default to using the cleaned key
        return clean_key

    def _get_semantic_node_type(self, key: Optional[str], data: Dict) -> str:
        """Get semantic node type based on key and data content"""
        if not key:
            return "DataObject"
        
        key_upper = key.upper()
        
        # Map common decision analysis terms to semantic node types
        if "STAKEHOLDER" in key_upper:
            return "Stakeholder"
        elif "ALTERNATIVE" in key_upper:
            return "Alternative"
        elif "CRITERIA" in key_upper or "CRITERION" in key_upper:
            return "Criterion"
        elif "COST" in key_upper:
            return "Cost"
        elif "RISK" in key_upper:
            return "Risk"
        elif "BENEFIT" in key_upper:
            return "Benefit"
        elif "RECOMMENDATION" in key_upper:
            return "Recommendation"
        elif "ANALYSIS" in key_upper:
            return "AnalysisComponent"
        elif "SPECIFICATION" in key_upper or "SPEC" in key_upper:
            return "Specification"
        elif "CAPABILITY" in key_upper:
            return "Capability"
        elif "AIRESPONSE" in key_upper:
            return "AIResponse"
        else:
            return "DecisionComponent"

    def _get_semantic_relationship(self, key: Optional[str]) -> str:
        """Get semantic relationship name based on key"""
        if not key:
            return "CONTAINS"
        
        key_upper = key.upper()
        
        # Map common terms to semantic relationships
        if "STAKEHOLDER" in key_upper:
            return "INVOLVES_STAKEHOLDER"
        elif "ALTERNATIVE" in key_upper:
            return "HAS_ALTERNATIVE"
        elif "CRITERIA" in key_upper or "CRITERION" in key_upper:
            return "EVALUATED_BY"
        elif "COST" in key_upper:
            return "HAS_COST"
        elif "RISK" in key_upper:
            return "HAS_RISK"
        elif "BENEFIT" in key_upper:
            return "HAS_BENEFIT"        
        elif "RECOMMENDATION" in key_upper:
            return "HAS_RECOMMENDATION"
        elif "SPECIFICATION" in key_upper:
            return "HAS_SPECIFICATION"
        elif "CAPABILITY" in key_upper:
            return "HAS_CAPABILITY"
        elif "AIRESPONSE" in key_upper:
            return "HAS_AI_RESPONSE"
        else:
            return "HAS_PROPERTY"

    def _parse_markdown_response(self, text: str) -> Dict[str, Any]:
        """Parse markdown text into structured data for semantic expansion"""
        import re
        
        structured_data = {
            "response_type": "markdown_analysis",
            "full_text": text
        }
        
        # Extract stakeholders
        stakeholders = []
        stakeholder_matches = re.findall(r'\*\*([^:]*(?:Teams?|Officers?|Experts?|Authorities?))\*\*[:\s]*([^\.]*)', text, re.IGNORECASE)
        for name, description in stakeholder_matches:
            stakeholders.append({
                "name": name.strip(),
                "description": description.strip(),
                "type": "stakeholder"
            })
        
        if stakeholders:
            structured_data["stakeholders"] = json.dumps(stakeholders)
        
        # Extract criteria
        criteria = []
        criteria_matches = re.findall(r'\*\*([^:]*(?:Requirements?|Capabilities?|Constraints?|Compliance|Speed))\*\*[:\s]*([^\.]*)', text, re.IGNORECASE)
        for name, description in criteria_matches:
            criteria.append({
                "name": name.strip(),
                "description": description.strip(),
                "type": "criterion"
            })
        
        if criteria:
            structured_data["criteria"] = json.dumps(criteria)
        
        # Extract alternatives (look for numbered lists or bullet points with specifications)
        alternatives = []
        alternative_matches = re.findall(r'### (\d+\.\s*[^#\n]+)\n(.*?)(?=###|\n##|\Z)', text, re.DOTALL)
        for title, content in alternative_matches:
            alt = {
                "name": title.strip(),
                "description": content.strip(),
                "type": "alternative"
            }
            
            # Extract costs from the content
            cost_matches = re.findall(r'\$([0-9,]+(?:\.[0-9]+)?[KMB]?)', content)
            if cost_matches:
                alt["costs"] = [{"amount": cost, "type": "budget"} for cost in cost_matches]
            
            alternatives.append(alt)
        
        if alternatives:
            structured_data["alternatives"] = json.dumps(alternatives)
        
        # Extract constraints
        constraints = []
        constraint_matches = re.findall(r'\*\*([^:]*(?:Constraint|Limitation))\*\*[:\s]*([^\.]*)', text, re.IGNORECASE)
        for name, description in constraint_matches:
            constraints.append({
                "name": name.strip(),
                "description": description.strip(),
                "type": "constraint"
            })
        
        if constraints:
            structured_data["constraints"] = json.dumps(constraints)
        
        # Extract budget information
        budget_matches = re.findall(r'\$([0-9,]+(?:\.[0-9]+)?[KMB]?)', text)
        if budget_matches:
            structured_data["budget"] = json.dumps({
                "amounts": budget_matches,
                "type": "budget_constraint"
            })
        
        return structured_data
    
    def store_interaction(self, run_id: str, process_instance_id: str, task_data: Dict[str, Any], decision_context: Optional[str] = None, supporting_files: Optional[List[str]] = None) -> bool:
        """
        Main method - captures analysis inputs and expands response JSON
        """
        try:
            # Extract task info
            task_name = task_data.get("task_name", "unknown")
            
            # Capture analysis start with input data
            analysis_id = self.capture_analysis_start(task_name, task_data, process_instance_id)
            
            # If there's a recommendation, capture it as response and expand
            if "recommendation" in task_data:
                recommendation_data = task_data["recommendation"]
                
                # Handle string JSON or markdown text
                if isinstance(recommendation_data, str):
                    try:
                        # Try to parse as JSON first
                        recommendation_data = json.loads(recommendation_data)
                    except:
                        # If not JSON, parse as markdown text
                        recommendation_data = self._parse_markdown_response(recommendation_data)
                
                # Expand the response into semantic graph
                self.capture_analysis_response(analysis_id, recommendation_data)
            
            logger.info(f"Successfully stored and expanded interaction: {analysis_id}")
            return True

        except Exception as e:
            logger.error(f"Error in store_interaction: {e}")
            return False

    def query_graph(self, cypher_query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Execute a Cypher query against the Neo4j graph database"""
        if not self.neo4j_driver:
            logger.warning("Neo4j not available for graph queries")
            return []
        
        try:
            with self.neo4j_driver.session() as session:
                # Use type: ignore to suppress Neo4j typing issue with dynamic queries
                result = session.run(cypher_query, parameters or {})  # type: ignore
                records = [record.data() for record in result]
                logger.info(f"Graph query returned {len(records)} records")
                return records
                
        except Exception as e:
            logger.error(f"Error executing graph query: {e}")
            return []

    def clear_graph_database(self) -> bool:
        """Clear all data from the Neo4j graph database"""
        if not self.neo4j_driver:
            logger.warning("Neo4j not available")
            return False
        
        try:
            with self.neo4j_driver.session() as session:
                session.run("MATCH (n) DETACH DELETE n")
                logger.info("Cleared Neo4j graph database")
                return True
                
        except Exception as e:
            logger.error(f"Error clearing graph database: {e}")
            return False

    def close(self):
        """Close database connections"""
        if self.neo4j_driver:
            self.neo4j_driver.close()
            logger.info("Closed Neo4j connection")

    # Legacy compatibility methods
    def generate_run_id(self, process_name: Optional[str] = None) -> str:
        """Generate a unique run ID"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_suffix = str(uuid.uuid4())[:8]
        
        if process_name:
            clean_name = "".join(c for c in process_name if c.isalnum() or c in "-_").lower()
            return f"{clean_name}_{timestamp}_{unique_suffix}"
        else:
            return f"dadm_run_{timestamp}_{unique_suffix}"
