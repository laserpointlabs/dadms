import logging
import os
from neo4j import GraphDatabase
import json
import uuid
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def expand_airesponse_nodes(neo4j_driver):
    """Expand AIResponse nodes in the Neo4j database"""
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
                
                # Look for content in various possible fields
                content = None
                  # Check for direct content field
                if "content" in node_properties:
                    content = node_properties["content"]
                    print(f"Found content field for node {node_id} (length: {len(str(content))})")
                
                # Check metadata field for response content
                elif "metadata" in node_properties:
                    try:
                        metadata_str = node_properties["metadata"]
                        if isinstance(metadata_str, str):
                            metadata = json.loads(metadata_str)
                            if "response" in metadata:
                                content = metadata["response"]
                                print(f"Found response in metadata for node {node_id}")
                    except Exception as e:
                        print(f"Could not parse metadata for node {node_id}: {e}")
                  # Check for other response-related fields
                elif "response" in node_properties:
                    content = node_properties["response"]
                    print(f"Found response field for node {node_id}")
                
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
                # Create standalone node if linking fails
                pass
            
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
    """Parse content to extract semantic elements like stakeholders, criteria, etc."""
    
    semantic_data = {
        'stakeholders': [],
        'criteria': [],
        'alternatives': [],
        'constraints': [],
        'decisions': [],
        'requirements': []
    }
    
    content_str = str(content)
    
    # Extract stakeholders (looking for patterns like "**Stakeholder Name**:")
    stakeholder_matches = re.findall(r'\*\*([^:]*(?:Teams?|Officers?|Experts?|Authorities?|Stakeholders?))\*\*[:\s]*([^\.]*)', content_str, re.IGNORECASE)
    for name, description in stakeholder_matches:
        semantic_data['stakeholders'].append({
            'name': name.strip(),
            'description': description.strip()
        })
    
    # Extract criteria and requirements
    criteria_matches = re.findall(r'\*\*([^:]*(?:Requirements?|Capabilities?|Criteria|Criterion))\*\*[:\s]*([^\.]*)', content_str, re.IGNORECASE)
    for name, description in criteria_matches:
        semantic_data['criteria'].append({
            'name': name.strip(),
            'description': description.strip()
        })
    
    # Extract constraints
    constraint_matches = re.findall(r'\*\*([^:]*(?:Constraints?|Limitations?))\*\*[:\s]*([^\.]*)', content_str, re.IGNORECASE)
    for name, description in constraint_matches:
        semantic_data['constraints'].append({
            'name': name.strip(),
            'description': description.strip()
        })
    
    # Extract numbered decisions/alternatives
    decision_matches = re.findall(r'(?:### )?(\d+\.\s*[^#\n]+)\n(.*?)(?=\n\d+\.|###|\n##|\Z)', content_str, re.DOTALL)
    for title, description in decision_matches:
        semantic_data['alternatives'].append({
            'name': title.strip(),
            'description': description.strip()
        })
    
    # Extract key decisions
    key_decision_matches = re.findall(r'\*\*([^:]*(?:Decision|Choice))\*\*[:\s]*([^\.]*)', content_str, re.IGNORECASE)
    for name, description in key_decision_matches:
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
