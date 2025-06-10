import logging
import os
from neo4j import GraphDatabase
import json
import uuid
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def expand_airesponse_nodes(neo4j_driver):
    """Expand AIResponse nodes in the Neo4j database with enhanced content extraction"""
    if not neo4j_driver:
        logger.warning("Neo4j not available")
        return False

    try:
        with neo4j_driver.session() as session:
            # Find all nodes that might contain AI response content
            result = session.run("MATCH (n) RETURN n LIMIT 100")
            records = list(result)

            if not records:
                print("No nodes found in the database.")
                return False

            print(f"Found {len(records)} nodes to process.")
            processed_count = 0
            
            for record in records:
                node = record["n"]
                node_properties = dict(node.items())
                node_labels = list(node.labels)
                
                # Get node identifier
                node_id = (node_properties.get("elementId") or 
                          node_properties.get("id") or 
                          str(node.element_id))
                
                print(f"Processing node {node_id} with labels: {node_labels}")
                
                # Extract content using enhanced extraction logic
                content = _extract_content_from_airesponse(node_properties)
                
                if content and len(str(content)) > 50:  # Process any substantial content
                    print(f"Expanding content for node {node_id} (length: {len(str(content))})")
                    try:
                        _expand_content_to_graph(session, content, str(node.element_id))
                        processed_count += 1
                        print(f"✅ Successfully expanded content for node: {node_id}")
                    except Exception as e:
                        print(f"❌ Error expanding node {node_id}: {e}")
                else:
                    print(f"No substantial content found for node {node_id}")

            print(f"Successfully processed {processed_count} nodes with content")
            return True

    except Exception as e:
        logger.error(f"Error expanding nodes: {e}")
        return False

def _extract_content_from_airesponse(node_properties):
    """Extract the main AI-generated content from node properties with enhanced logic"""
    
    # Step 1: Check for direct content field
    if "content" in node_properties:
        content = node_properties["content"]
        print(f"Found direct content field (length: {len(str(content))})")
        
        # If content is a JSON string, try to parse it and extract the response
        if isinstance(content, str) and content.strip().startswith('{'):
            try:
                parsed_content = json.loads(content)
                if isinstance(parsed_content, dict) and 'response' in parsed_content:
                    print("Extracted 'response' field from JSON content")
                    return parsed_content['response']
            except json.JSONDecodeError:
                pass
        return content
    
    # Step 2: Check metadata field for nested response content
    if "metadata" in node_properties:
        try:
            metadata_str = node_properties["metadata"]
            if isinstance(metadata_str, str):
                metadata = json.loads(metadata_str)
                
                # Look for nested response structure
                if isinstance(metadata, dict):
                    # Check for direct response field
                    if "response" in metadata:
                        print("Found 'response' in metadata")
                        response_data = metadata["response"]
                        
                        # If the response itself is a JSON string, parse it
                        if isinstance(response_data, str) and response_data.strip().startswith('{'):
                            try:
                                parsed_response = json.loads(response_data)
                                if isinstance(parsed_response, dict) and 'response' in parsed_response:
                                    print("Extracted nested 'response' from metadata")
                                    return parsed_response['response']
                            except json.JSONDecodeError:
                                pass
                        
                        return response_data
                    
                    # Check for other content fields in metadata
                    for field in ['content', 'text', 'message', 'recommendation', 'result']:
                        if field in metadata and metadata[field]:
                            print(f"Found '{field}' in metadata")
                            return str(metadata[field])
                            
        except Exception as e:
            print(f"Could not parse metadata: {e}")
    
    # Step 3: Check for direct response field
    if "response" in node_properties:
        response_data = node_properties["response"]
        print(f"Found direct response field (length: {len(str(response_data))})")
        
        # If response is a JSON string, try to extract the nested response
        if isinstance(response_data, str) and response_data.strip().startswith('{'):
            try:
                parsed_response = json.loads(response_data)
                if isinstance(parsed_response, dict) and 'response' in parsed_response:
                    print("Extracted nested 'response' from response field")
                    return parsed_response['response']
            except json.JSONDecodeError:
                pass
        
        return response_data
    
    # Step 4: Check other common fields
    for field in ['text', 'message', 'data', 'result', 'output']:
        if field in node_properties and node_properties[field]:
            print(f"Found '{field}' field")
            return str(node_properties[field])
    
    # Step 5: Look for any field that might contain JSON data
    for key, value in node_properties.items():
        if isinstance(value, str) and len(value) > 100 and value.strip().startswith('{'):
            try:
                parsed_data = json.loads(value)
                if isinstance(parsed_data, dict):
                    # Look for response-like fields in the parsed JSON
                    for response_field in ['response', 'content', 'text', 'recommendation', 'result']:
                        if response_field in parsed_data and parsed_data[response_field]:
                            print(f"Found '{response_field}' in parsed JSON field '{key}'")
                            return str(parsed_data[response_field])
            except json.JSONDecodeError:
                continue
    
    print("No substantial content found in any field")
    return None

def _expand_content_to_graph(session, content, parent_id):
    """Extract semantic information from content and create graph nodes"""
    
    # Parse the content to extract semantic elements
    semantic_data = _parse_content_for_semantics(content)
    
    for category, items in semantic_data.items():
        if items:
            # Create a category node
            category_id = str(uuid.uuid4())
            session.run("""
                CREATE (n:SemanticCategory {
                    id: $category_id,
                    category: $category,
                    parent_id: $parent_id,
                    created_at: datetime()
                })
            """, category_id=category_id, category=category, parent_id=parent_id)
            
            # Link to parent using elementId
            try:
                session.run("""
                    MATCH (parent) WHERE elementId(parent) = $parent_id
                    MATCH (child {id: $category_id})
                    CREATE (parent)-[:HAS_SEMANTIC_DATA]->(child)
                """, parent_id=parent_id, category_id=category_id)
                print(f"Linked semantic category {category} to parent {parent_id}")
            except Exception as e:
                print(f"Could not link to parent: {e}")
            
            # Create individual item nodes
            for item in items:
                item_id = str(uuid.uuid4())
                session.run("""
                    CREATE (n:SemanticItem {
                        id: $item_id,
                        name: $name,
                        description: $description,
                        category: $category,
                        created_at: datetime()
                    })
                """, 
                item_id=item_id, 
                name=item.get('name', ''), 
                description=item.get('description', ''),
                category=category)
                
                # Link to category
                session.run("""
                    MATCH (category {id: $category_id})
                    MATCH (item {id: $item_id})
                    CREATE (category)-[:CONTAINS_ITEM]->(item)
                """, category_id=category_id, item_id=item_id)

def _parse_content_for_semantics(content):
    """Parse content to extract semantic elements with enhanced patterns"""
    
    semantic_data = {
        'stakeholders': [],
        'criteria': [],
        'alternatives': [],
        'constraints': [],
        'decisions': [],
        'requirements': [],
        'recommendations': [],
        'platforms': [],
        'capabilities': []
    }
    
    content_str = str(content)
    
    # Enhanced stakeholder extraction
    stakeholder_patterns = [
        r'\*\*([^:]*(?:Teams?|Officers?|Experts?|Authorities?|Stakeholders?|Users?|Personnel|Staff))\*\*[:\s]*([^\.]*)',
        r'(?:### |## )?([^:\n]*(?:Teams?|Officers?|Experts?|Authorities?|Stakeholders?|Users?|Personnel|Staff))[:\s]*([^#\n]*)',
        r'- \*\*([^:]*(?:Teams?|Officers?|Experts?|Authorities?|Stakeholders?))\*\*[:\s]*([^\.]*)'
    ]
    
    for pattern in stakeholder_patterns:
        matches = re.findall(pattern, content_str, re.IGNORECASE)
        for name, description in matches:
            semantic_data['stakeholders'].append({
                'name': name.strip(),
                'description': description.strip()
            })
    
    # Enhanced criteria extraction
    criteria_patterns = [
        r'\*\*([^:]*(?:Requirements?|Capabilities?|Criteria|Criterion|Specifications?))\*\*[:\s]*([^\.]*)',
        r'(?:### |## )?([^:\n]*(?:Requirements?|Capabilities?|Criteria|Specifications?))[:\s]*([^#\n]*)',
        r'- ([^:]*(?:Requirements?|Capabilities?|Criteria))[:\s]*([^\.]*)'
    ]
    
    for pattern in criteria_patterns:
        matches = re.findall(pattern, content_str, re.IGNORECASE)
        for name, description in matches:
            semantic_data['criteria'].append({
                'name': name.strip(),
                'description': description.strip()
            })
    
    # Enhanced recommendation/platform extraction
    recommendation_patterns = [
        r'\*\*(?:Recommended?|Selected?)\s+([^:]*(?:Platform|System|Solution|Option))[:\s]*([^#]*?)(?=\*\*|\n##|\n###|\Z)',
        r'(?:### |## )?(\d+\.\s*Recommended?[^:\n]*)[:\s]*([^#]*?)(?=\n\d+\.|\n##|\n###|\Z)',
        r'\*\*([^:]*(?:Platform|System|Solution))\*\*[:\s]*([^#]*?)(?=\*\*|\n##|\n###|\Z)'
    ]
    
    for pattern in recommendation_patterns:
        matches = re.findall(pattern, content_str, re.IGNORECASE | re.DOTALL)
        for name, description in matches:
            semantic_data['recommendations'].append({
                'name': name.strip(),
                'description': description.strip()[:500]  # Limit description length
            })
    
    # Extract platform/system names specifically
    platform_patterns = [
        r'([A-Z][a-zA-Z]*\s*[A-Z]\d+)\s*(?:Platform|System|UAS)',
        r'\*\*([^*]*(?:Mapper|Drone|UAV|UAS)[^*]*)\*\*',
        r'(?:Platform|System):\s*([^.\n]*)'
    ]
    
    for pattern in platform_patterns:
        matches = re.findall(pattern, content_str)
        for match in matches:
            if isinstance(match, tuple):
                match = match[0]
            semantic_data['platforms'].append({
                'name': match.strip(),
                'description': ''
            })
    
    # Extract constraints
    constraint_patterns = [
        r'\*\*([^:]*(?:Constraints?|Limitations?|Restrictions?))\*\*[:\s]*([^\.]*)',
        r'(?:### |## )?([^:\n]*(?:Constraints?|Limitations?))[:\s]*([^#\n]*)'
    ]
    
    for pattern in constraint_patterns:
        matches = re.findall(pattern, content_str, re.IGNORECASE)
        for name, description in matches:
            semantic_data['constraints'].append({
                'name': name.strip(),
                'description': description.strip()
            })
    
    # Extract numbered sections as alternatives
    numbered_sections = re.findall(r'(?:### |## )?(\d+\.\s*[^#\n]+)\n(.*?)(?=\n\d+\.|\n##|\n###|\Z)', content_str, re.DOTALL)
    for title, description in numbered_sections:
        semantic_data['alternatives'].append({
            'name': title.strip(),
            'description': description.strip()[:300]  # Limit description length
        })
    
    # Extract key decisions
    decision_patterns = [
        r'\*\*([^:]*(?:Decision|Choice|Selection))\*\*[:\s]*([^\.]*)',
        r'(?:### |## )?([^:\n]*(?:Decision|Choice))[:\s]*([^#\n]*)'
    ]
    
    for pattern in decision_patterns:
        matches = re.findall(pattern, content_str, re.IGNORECASE)
        for name, description in matches:
            semantic_data['decisions'].append({
                'name': name.strip(),
                'description': description.strip()
            })
    
    return semantic_data

if __name__ == "__main__":
    uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
    user = os.environ.get("NEO4J_USER", "neo4j")
    password = os.environ.get("NEO4J_PASSWORD", "password")

    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        success = expand_airesponse_nodes(driver)
        driver.close()

        if success:
            print("✅ AIResponse nodes expanded successfully")
        else:
            print("❌ Failed to expand AIResponse nodes")
            exit(1)
    except Exception as e:
        print(f"❌ Error connecting to Neo4j: {e}")
        exit(1)
