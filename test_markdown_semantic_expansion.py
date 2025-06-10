#!/usr/bin/env python3
"""
Test the enhanced markdown semantic expansion with actual DADM response data
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.data_persistence_manager import DataPersistenceManager
import json

def test_markdown_semantic_expansion():
    """Test the markdown parsing and semantic expansion with rich DADM content"""
    
    # Sample rich DADM response (similar to what you showed me)
    dadm_markdown_response = """
# Emergency Response Equipment Decision Analysis

## Key Decision
Selection of emergency response communication equipment for disaster preparedness operations.

## Stakeholders and Their Interests

**Emergency Response Teams**: Need reliable, robust communication systems that work in extreme conditions
**Procurement Officers**: Must balance performance requirements with budget constraints and vendor relationships  
**Technical Experts**: Focus on interoperability, maintenance requirements, and technical specifications
**Regulatory Authorities**: Ensure compliance with emergency communication standards and protocols

## Main Criteria for Evaluating Options

**Operational Requirements**: Range, battery life, durability in extreme weather conditions
**Technical Capabilities**: Frequency compatibility, encryption features, GPS integration
**Cost Constraints**: Initial purchase price, ongoing maintenance costs, training expenses
**Compliance Requirements**: FCC certification, emergency service standards, interoperability protocols
**Deployment Speed**: Time to implement, ease of training, integration with existing systems

## Alternatives

### 1. High-End Digital Radio System
Advanced digital radio with GPS, encryption, and long-range capabilities
Cost: $850 per unit, Total project: $425,000

### 2. Standard Analog Radio System  
Proven analog technology with good reliability and lower cost
Cost: $250 per unit, Total project: $125,000

### 3. Hybrid Communication Platform
Combination of digital radios with smartphone integration
Cost: $600 per unit, Total project: $300,000

## Constraints and Limitations

**Budget Constraint**: Maximum budget of $400,000 for equipment and training
**Timeline Constraint**: Must be deployed within 6 months
**Training Constraint**: Personnel must be fully trained within 3 months of deployment

## Timeline for the Decision
Decision required by end of Q2 to meet deployment timeline for peak emergency season.
"""

    print("=== Testing Markdown Semantic Expansion ===")
    
    # Initialize persistence manager
    persistence_manager = DataPersistenceManager()
    
    # Clear existing data for clean test
    persistence_manager.clear_graph_database()
    print("✓ Cleared existing graph data")
    
    # Test the markdown parsing
    print("\n=== Testing Markdown Parser ===")
    structured_data = persistence_manager._parse_markdown_response(dadm_markdown_response)
    
    print(f"Parsed structure keys: {list(structured_data.keys())}")
    
    if "stakeholders" in structured_data:
        print(f"Found {len(structured_data['stakeholders'])} stakeholders:")
        for stakeholder in structured_data["stakeholders"]:
            print(f"  - {stakeholder['name']}: {stakeholder['description'][:50]}...")
    
    if "criteria" in structured_data:
        print(f"Found {len(structured_data['criteria'])} criteria:")
        for criterion in structured_data["criteria"]:
            print(f"  - {criterion['name']}: {criterion['description'][:50]}...")
    
    if "alternatives" in structured_data:
        print(f"Found {len(structured_data['alternatives'])} alternatives:")
        for alt in structured_data["alternatives"]:
            print(f"  - {alt['name']}")
            if "costs" in alt:
                print(f"    Costs: {alt['costs']}")
    
    if "constraints" in structured_data:
        print(f"Found {len(structured_data['constraints'])} constraints:")
        for constraint in structured_data["constraints"]:
            print(f"  - {constraint['name']}: {constraint['description'][:50]}...")
    
    # Test the full semantic expansion
    print("\n=== Testing Full Semantic Expansion ===")
    
    # Create a test task data structure
    task_data = {
        "task_name": "emergency_equipment_decision",
        "recommendation": dadm_markdown_response  # This will trigger markdown parsing
    }
    
    # Store the interaction (this will trigger semantic expansion)
    success = persistence_manager.store_interaction(
        run_id="test_run_001",
        process_instance_id="test_process_001", 
        task_data=task_data
    )
    
    if success:
        print("✓ Successfully stored and expanded interaction")
        
        # Query the graph to see what was created
        print("\n=== Analyzing Created Graph Structure ===")
        
        # Count nodes by type
        node_counts = persistence_manager.query_graph("""
            MATCH (n)
            RETURN labels(n)[0] as node_type, count(n) as count
            ORDER BY count DESC
        """)
        
        print("Node counts by type:")
        total_nodes = 0
        for record in node_counts:
            count = record['count']
            node_type = record['node_type']
            print(f"  {node_type}: {count}")
            total_nodes += count
        
        print(f"Total nodes created: {total_nodes}")
        
        # Show stakeholder nodes
        stakeholder_nodes = persistence_manager.query_graph("""
            MATCH (s:Stakeholder)
            RETURN s.key as key, s.id as id
            LIMIT 10
        """)
        
        if stakeholder_nodes:
            print(f"\nStakeholder nodes created: {len(stakeholder_nodes)}")
            for node in stakeholder_nodes:
                print(f"  - {node['key']} ({node['id'][:8]}...)")
        
        # Show criterion nodes  
        criterion_nodes = persistence_manager.query_graph("""
            MATCH (c:Criterion)
            RETURN c.key as key, c.id as id
            LIMIT 10
        """)
        
        if criterion_nodes:
            print(f"\nCriterion nodes created: {len(criterion_nodes)}")
            for node in criterion_nodes:
                print(f"  - {node['key']} ({node['id'][:8]}...)")
        
        # Show alternative nodes
        alternative_nodes = persistence_manager.query_graph("""
            MATCH (a:Alternative)
            RETURN a.key as key, a.id as id
            LIMIT 10
        """)
        
        if alternative_nodes:
            print(f"\nAlternative nodes created: {len(alternative_nodes)}")
            for node in alternative_nodes:
                print(f"  - {node['key']} ({node['id'][:8]}...)")
        
        # Show relationships
        relationships = persistence_manager.query_graph("""
            MATCH ()-[r]->()
            RETURN type(r) as rel_type, count(r) as count
            ORDER BY count DESC
            LIMIT 10
        """)
        
        if relationships:
            print(f"\nRelationships created:")
            for rel in relationships:
                print(f"  {rel['rel_type']}: {rel['count']}")
        
        print("\n=== Test Results ===")
        print(f"✓ Markdown parsing: {'SUCCESS' if structured_data else 'FAILED'}")
        print(f"✓ Semantic expansion: {'SUCCESS' if total_nodes > 10 else 'FAILED'}")
        print(f"✓ Rich structure creation: {'SUCCESS' if stakeholder_nodes and criterion_nodes else 'FAILED'}")
        
    else:
        print("✗ Failed to store interaction")
    
    # Cleanup
    persistence_manager.close()
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    test_markdown_semantic_expansion()
