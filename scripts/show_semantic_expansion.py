from neo4j import GraphDatabase
import os
import json

uri = os.environ.get('NEO4J_URI', 'bolt://localhost:7687')
user = os.environ.get('NEO4J_USER', 'neo4j')
password = os.environ.get('NEO4J_PASSWORD', 'password')

driver = GraphDatabase.driver(uri, auth=(user, password))

def print_semantic_expansion():
    with driver.session() as session:
        print("="*80)
        print("SEMANTIC EXPANSION OF AIRESPONSE NODE")
        print("="*80)
        
        # Show the AIResponse node and its semantic categories
        result = session.run("""
            MATCH (ai:AIResponse)-[:HAS_SEMANTIC_DATA]->(cat:SemanticCategory)
            RETURN ai.task_id as task_id, cat.category as category, cat.id as category_id
            ORDER BY cat.category
        """)
        
        for record in result:
            task_id = record["task_id"]
            category = record["category"]
            category_id = record["category_id"]
            
            print(f"\n📂 CATEGORY: {category.upper()}")
            print("-" * 40)
            
            # Get items in this category
            items_result = session.run("""
                MATCH (cat:SemanticCategory {id: $category_id})-[:CONTAINS_ITEM]->(item:SemanticItem)
                RETURN item.name as name, item.description as description
                ORDER BY item.name
            """, category_id=category_id)
            
            for item_record in items_result:
                name = item_record["name"]
                description = item_record["description"]
                print(f"  • {name}")
                print(f"    {description}")
                print()
        
        print("\n" + "="*80)
        print("SEMANTIC GRAPH STRUCTURE")
        print("="*80)
        
        # Show the complete graph structure
        result = session.run("""
            MATCH (ai:AIResponse)
            OPTIONAL MATCH (ai)-[:HAS_SEMANTIC_DATA]->(cat:SemanticCategory)
            OPTIONAL MATCH (cat)-[:CONTAINS_ITEM]->(item:SemanticItem)
            RETURN ai.task_id as task_id, 
                   count(DISTINCT cat) as categories, 
                   count(DISTINCT item) as total_items
        """)
        
        for record in result:
            print(f"Task ID: {record['task_id']}")
            print(f"Semantic Categories: {record['categories']}")
            print(f"Total Semantic Items: {record['total_items']}")
        
        print("\n📊 CATEGORY BREAKDOWN:")
        result = session.run("""
            MATCH (cat:SemanticCategory)-[:CONTAINS_ITEM]->(item:SemanticItem)
            RETURN cat.category as category, count(item) as item_count
            ORDER BY cat.category
        """)
        
        for record in result:
            print(f"  {record['category']}: {record['item_count']} items")

if __name__ == "__main__":
    print_semantic_expansion()
    driver.close()
