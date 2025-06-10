import os
from neo4j import GraphDatabase

def show_semantic_summary(neo4j_driver):
    """Show a summary of the semantic expansion results"""
    if not neo4j_driver:
        print("Neo4j not available")
        return

    try:
        with neo4j_driver.session() as session:
            print("=" * 80)
            print("SEMANTIC EXPANSION SUMMARY")
            print("=" * 80)
            
            # Count total nodes by type
            result = session.run("""
                MATCH (n:AIResponse) 
                RETURN count(n) as airesponse_count
            """)
            airesponse_count = result.single()["airesponse_count"]
            
            result = session.run("""
                MATCH (n:SemanticCategory) 
                RETURN count(n) as category_count
            """)
            category_count = result.single()["category_count"]
            
            result = session.run("""
                MATCH (n:SemanticItem) 
                RETURN count(n) as item_count
            """)
            item_count = result.single()["item_count"]
            
            print(f"📊 PROCESSING RESULTS:")
            print(f"   • AIResponse nodes: {airesponse_count}")
            print(f"   • Semantic categories created: {category_count}")
            print(f"   • Semantic items extracted: {item_count}")
            print()
            
            # Show category breakdown
            result = session.run("""
                MATCH (cat:SemanticCategory)-[:CONTAINS_ITEM]->(item:SemanticItem)
                RETURN cat.category as category, count(item) as item_count
                ORDER BY item_count DESC
            """)
            
            print("📂 CATEGORY BREAKDOWN:")
            for record in result:
                print(f"   • {record['category']}: {record['item_count']} items")
            print()
            
            # Show sample extracted content for each category
            result = session.run("""
                MATCH (cat:SemanticCategory)-[:CONTAINS_ITEM]->(item:SemanticItem)
                RETURN cat.category as category, 
                       collect(item.name)[0..3] as sample_items
                ORDER BY cat.category
            """)
            
            print("🔍 SAMPLE EXTRACTED CONTENT:")
            for record in result:
                category = record['category']
                sample_items = record['sample_items']
                print(f"\n   📁 {category.upper()}:")
                for item in sample_items:
                    if item and len(item.strip()) > 0:
                        # Truncate long items for display
                        display_item = item[:80] + "..." if len(item) > 80 else item
                        print(f"      • {display_item}")
            print()
            
            # Show relationship structure
            result = session.run("""
                MATCH (ai:AIResponse)-[:HAS_SEMANTIC_DATA]->(cat:SemanticCategory)
                RETURN count(DISTINCT ai) as ai_nodes_with_semantics,
                       count(cat) as linked_categories
            """)
            
            if result.peek():
                record = result.single()
                print("🔗 RELATIONSHIP STRUCTURE:")
                print(f"   • AIResponse nodes with semantic data: {record['ai_nodes_with_semantics']}")
                print(f"   • Category-to-AIResponse links: {record['linked_categories']}")
                print()
            
            # Show most semantically rich responses
            result = session.run("""
                MATCH (ai:AIResponse)-[:HAS_SEMANTIC_DATA]->(cat:SemanticCategory)-[:CONTAINS_ITEM]->(item:SemanticItem)
                RETURN ai.id as ai_id, 
                       count(DISTINCT cat) as categories,
                       count(item) as total_items
                ORDER BY total_items DESC
                LIMIT 3
            """)
            
            print("🏆 MOST SEMANTICALLY RICH RESPONSES:")
            for i, record in enumerate(result, 1):
                ai_id = record['ai_id'] or "Unknown"
                categories = record['categories']
                total_items = record['total_items']
                print(f"   {i}. AI Response: {ai_id[:20]}...")
                print(f"      Categories: {categories}, Items: {total_items}")
            
            print()
            print("✅ Semantic expansion completed successfully!")
            print("   The AIResponse nodes have been expanded into structured semantic data")
            print("   including stakeholders, criteria, alternatives, constraints, and more.")

    except Exception as e:
        print(f"❌ Error generating summary: {e}")

if __name__ == "__main__":
    uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
    user = os.environ.get("NEO4J_USER", "neo4j")
    password = os.environ.get("NEO4J_PASSWORD", "password")

    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        show_semantic_summary(driver)
        driver.close()
    except Exception as e:
        print(f"❌ Error connecting to Neo4j: {e}")
