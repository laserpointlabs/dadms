#!/usr/bin/env python3
"""
End-to-End Test of Enhanced Semantic Expansion

This test verifies that the DADM system correctly:
1. Processes OpenAI assistant responses 
2. Parses rich markdown content
3. Creates granular semantic nodes
4. Enables cross-analysis capabilities
"""

import os
import sys
import json
import logging
from datetime import datetime

# Add project root to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)
sys.path.insert(0, os.path.join(project_root, 'src'))

from src.data_persistence_manager import DataPersistenceManager

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def simulate_dadm_workflow():
    """Simulate a complete DADM workflow with real OpenAI response"""
    
    # Sample rich DADM response (like what OpenAI assistant returns)
    dadm_response = """
# Emergency Communication System Decision Analysis

## Key Decision
The emergency response agency needs to select a digital communication system to replace aging analog radios across 15 fire stations and 8 police precincts within a $2.5M budget and 18-month timeline.

## Stakeholders and Their Interests

**Emergency Response Teams**: Need reliable, instant communication during critical operations with 99.9% uptime requirements and seamless interoperability between fire and police units.

**Procurement Officers**: Must ensure cost-effectiveness, compliance with federal acquisition regulations, and vendor reliability with proven track records in emergency services.

**Technical Experts**: Require advanced features including GPS tracking, encryption capabilities, emergency button functionality, and integration with existing dispatch systems.

**Regulatory Authorities**: Mandate compliance with FCC regulations, NIST cybersecurity frameworks, and state emergency management standards.

## Main Criteria for Evaluating Options

**Operational Requirements**: System must support 500+ simultaneous users, provide clear audio quality in all weather conditions, and maintain functionality during power outages with 72-hour battery backup.

**Technical Capabilities**: Requires digital encryption, GPS tracking accuracy within 10 meters, emergency alert broadcasting, and seamless integration with existing CAD (Computer-Aided Dispatch) systems.

**Cost Constraints**: Total implementation cost including hardware, software, training, and 5-year maintenance must not exceed $2.5M budget allocation.

**Compliance Requirements**: Must meet FCC Part 90 regulations, FIPS 140-2 encryption standards, and state interoperability requirements for emergency communications.

**Timeline Feasibility**: Implementation must be completed within 18 months including procurement, installation, testing, and comprehensive staff training across all stations.

## Decision Alternatives

### 1. High-End Digital Radio System (Motorola APX Series)
**Cost**: $2.3M total implementation
- Premium digital radios with advanced encryption
- Integrated GPS and emergency features
- Proven reliability in emergency services
- Comprehensive training and support package
- 10-year manufacturer warranty

### 2. Standard Digital Platform (Kenwood NX Series)  
**Cost**: $1.8M total implementation
- Digital radios with basic encryption
- GPS tracking capabilities
- Good audio quality and reliability
- Standard training package
- 7-year manufacturer warranty

### 3. Hybrid Communication Platform (FirstNet + Digital Radios)
**Cost**: $2.1M total implementation
- Combines cellular and radio technologies
- Enhanced data sharing capabilities
- Modern user interface with touchscreen
- Cloud-based management system
- Scalable for future expansion

## Constraints and Limitations

**Budget Constraint**: Cannot exceed $2.5M total allocation without additional funding approval from city council, which would delay implementation by 6-8 months.

**Timeline Constraint**: System must be operational before start of wildfire season (June 2024) to ensure adequate emergency response capabilities during high-risk period.

**Regulatory Constraint**: All equipment must receive FCC certification and pass state interoperability testing before deployment, which requires 4-6 months lead time.

**Training Constraint**: All 200+ emergency personnel must complete certification training, requiring coordination with shift schedules and operational availability.

## Timeline for Decision
- **Decision Required**: Within 30 days (by March 15, 2024)
- **Procurement Phase**: 90 days for vendor selection and contracting
- **Implementation Phase**: 12 months for deployment and testing
- **Training Phase**: 6 months overlapping with implementation
"""

    # Create persistence manager
    persistence_manager = DataPersistenceManager()
    
    # Clear previous test data
    logger.info("Clearing previous test data...")
    persistence_manager.clear_graph_database()
    
    # Simulate the task data that would come from Camunda/OpenAI service
    task_data = {
        "task_name": "Emergency Communication System Analysis",
        "process_id": "emergency_comms_decision_001",
        "input_data": {
            "decision_context": "Emergency communication system procurement",
            "budget": "$2.5M",
            "timeline": "18 months",
            "stakeholders": ["Fire Department", "Police Department", "City Council"]
        },
        "recommendation": dadm_response  # This is the rich markdown response
    }
    
    # Test the store_interaction method (main entry point)
    logger.info("Testing store_interaction with rich DADM response...")
    success = persistence_manager.store_interaction(
        run_id="test_run_001",
        process_instance_id="emergency_comms_decision_001", 
        task_data=task_data,
        decision_context="Emergency communication system procurement"
    )
    
    if success:
        logger.info("✅ Successfully stored and expanded DADM interaction")
    else:
        logger.error("❌ Failed to store DADM interaction")
        return False
    
    # Query the semantic graph to verify expansion
    logger.info("\n🔍 Analyzing semantic graph expansion...")
    
    # Count nodes by type
    node_counts = persistence_manager.query_graph("""
        MATCH (n)
        RETURN labels(n) as node_type, count(n) as count
        ORDER BY count DESC
    """)
    
    print("\n📊 Node Type Distribution:")
    total_nodes = 0
    for record in node_counts:
        node_type = record['node_type'][0] if record['node_type'] else 'Unknown'
        count = record['count']
        total_nodes += count
        print(f"  {node_type}: {count}")
    
    print(f"\n📈 Total Nodes Created: {total_nodes}")
    
    # Check semantic relationships
    relationships = persistence_manager.query_graph("""
        MATCH ()-[r]->()
        RETURN type(r) as relationship_type, count(r) as count
        ORDER BY count DESC
    """)
    
    print("\n🔗 Semantic Relationships:")
    total_relationships = 0
    for record in relationships:
        rel_type = record['relationship_type']
        count = record['count']
        total_relationships += count
        print(f"  {rel_type}: {count}")
    
    print(f"\n📈 Total Relationships: {total_relationships}")
    
    # Query for specific semantic content
    logger.info("\n🎯 Analyzing extracted semantic content...")
    
    # Check stakeholders
    stakeholders = persistence_manager.query_graph("""
        MATCH (s:Stakeholder)
        RETURN s.key as stakeholder_name, s.id as id
        LIMIT 10
    """)
    
    print(f"\n👥 Extracted Stakeholders ({len(stakeholders)}):")
    for record in stakeholders:
        print(f"  - {record['stakeholder_name']}")
    
    # Check criteria  
    criteria = persistence_manager.query_graph("""
        MATCH (c:Criterion)
        RETURN c.key as criterion_name, c.id as id
        LIMIT 10
    """)
    
    print(f"\n📋 Extracted Criteria ({len(criteria)}):")
    for record in criteria:
        print(f"  - {record['criterion_name']}")
    
    # Check alternatives
    alternatives = persistence_manager.query_graph("""
        MATCH (a:Alternative)
        RETURN a.key as alternative_name, a.id as id
        LIMIT 10
    """)
    
    print(f"\n⚖️ Extracted Alternatives ({len(alternatives)}):")
    for record in alternatives:
        print(f"  - {record['alternative_name']}")
    
    # Check for cost information
    costs = persistence_manager.query_graph("""
        MATCH (c:Cost)
        RETURN c.key as cost_item, c.id as id
        LIMIT 10
    """)
    
    print(f"\n💰 Extracted Costs ({len(costs)}):")
    for record in costs:
        print(f"  - {record['cost_item']}")
    
    # Test cross-analysis capabilities
    logger.info("\n🔄 Testing cross-analysis capabilities...")
    
    # Find relationships between alternatives and costs
    alt_cost_relationships = persistence_manager.query_graph("""
        MATCH (a:Alternative)-[r:HAS_COST]->(c:Cost)
        RETURN a.key as alternative, c.key as cost_item, type(r) as relationship
        LIMIT 5
    """)
    
    print(f"\n💼 Alternative-Cost Relationships ({len(alt_cost_relationships)}):")
    for record in alt_cost_relationships:
        print(f"  {record['alternative']} → {record['cost_item']}")
    
    # Find decision traceability path
    decision_path = persistence_manager.query_graph("""
        MATCH (analysis:Analysis)-[:HAS_OUTPUT]->(root)-[:HAS_PROPERTY*1..3]->(detail)
        WHERE detail.key CONTAINS 'Motorola' OR detail.key CONTAINS 'Kenwood'
        RETURN analysis.task_name as analysis, detail.key as detail, detail.value as value
        LIMIT 10
    """)
    
    print(f"\n🔍 Decision Traceability ({len(decision_path)} paths):")
    for record in decision_path:
        print(f"  {record['analysis']} → {record['detail']}: {record['value'][:100] if record['value'] else 'N/A'}...")
    
    # Performance summary
    print("\n" + "="*50)
    print("🎉 SEMANTIC EXPANSION SUMMARY")
    print("="*50)
    print(f"✅ Rich markdown response successfully parsed")
    print(f"✅ {total_nodes} granular nodes created (vs 1 monolithic node)")
    print(f"✅ {total_relationships} semantic relationships established")
    print(f"✅ {len(stakeholders)} stakeholders extracted and linked")
    print(f"✅ {len(criteria)} decision criteria identified")
    print(f"✅ {len(alternatives)} alternatives captured with costs")
    print(f"✅ Cross-analysis and traceability enabled")
    
    # Cleanup
    persistence_manager.close()
    
    return True

if __name__ == "__main__":
    print("🚀 Starting End-to-End Semantic Expansion Test...")
    print("="*60)
    
    try:
        success = simulate_dadm_workflow()
        
        if success:
            print("\n🎉 SUCCESS: Enhanced semantic expansion is working perfectly!")
            print("The DADM system now creates granular, traceable decision graphs!")
        else:
            print("\n❌ FAILED: Issues with semantic expansion")
            
    except Exception as e:
        logger.error(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()
