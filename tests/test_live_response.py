#!/usr/bin/env python3
"""
Test our persistence manager with the ACTUAL live response data from the DADM run
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from data_persistence_manager import DataPersistenceManager

def test_live_response():
    """Test with the actual response from the DADM run"""
    
    # Initialize persistence manager
    persistence = DataPersistenceManager()
    
    # This is the ACTUAL task data from the successful DADM run
    task_data = {
        "task_name": "FrameDecisionTask",
        "assistant_id": "asst_V7LvGWmIHWS0r91hGd5dMb5e",
        "processed_at": "2025-06-05 21:49:52", 
        "processed_by": "OpenAI Assistant (DADM Decision Analysis Assistant)",
        "thread_id": "thread_AuhW6eT5i6I0QHR3pBgxbGml",
        "recommendation": """## Decision Context Analysis: Selecting a Suitable UAS Platform for Disaster Response

### 1. Key Decision
- **Selection of the Appropriate UAS Platform**: The agency needs to choose a UAS platform that can be rapidly deployed in disaster response scenarios. This decision involves evaluating different UAS platforms against specified criteria and within given constraints.

### 2. Stakeholders and Their Interests
- **Emergency Response Teams**: They require a UAS that enhances their operational effectiveness by delivering timely and high-quality data, even in unfavorable weather conditions.
- **Procurement Officers**: Focused on ensuring the choice aligns with budget constraints ($2M cap) and conforms to procurement guidelines.
- **Technical Experts**: They are interested in the technical specifications, including payload and endurance capabilities, and how well these integrate with existing systems.
- **Regulatory Authorities**: Their interest lies in ensuring compliance with aviation and safety regulations for operating UAS in disaster contexts.

### 3. Main Criteria for Evaluating Options
- **Operational Requirements**: The UAS must be able to operate effectively in diverse disaster scenarios and withstand different weather conditions.
- **Technical Capabilities**: Includes assessment of payload capacity, endurance, data quality, and the reliability of the UAS.
- **Cost Constraints**: Must remain within the $2M budget allocated for this acquisition.
- **Regulatory Compliance**: It should meet all necessary aviation and safety regulatory standards.
- **Deployment Speed**: Quick deployment capabilities are essential to support fast-paced emergency responses.

### 4. Constraints or Limitations
- **Budgetary Constraint**: A maximum budget of $2M is set for the purchase.
- **Regulatory Limitations**: Compliance with stringent aviation and safety laws could restrict certain UAS features.
- **Environmental Conditions**: The selected UAS should maintain performance across a wide range of weather conditions without compromising data quality.

### 5. Timeline for the Decision
- **Immediate Priority**: The decision is urgent to ensure readiness and effective integration of the selected UAS into the emergency response workflow ahead of upcoming disaster periods.

This analysis will help guide the decision-making process to select a UAS platform that aligns with the agency's strategic goals, operational needs, and regulatory requirements."""
    }
    
    print("🧪 Testing with ACTUAL live DADM response data...")
    print(f"Task: {task_data['task_name']}")
    print(f"Assistant: {task_data['assistant_id']}")
    print(f"Processed at: {task_data['processed_at']}")
    print()
    
    # Test our persistence manager
    success = persistence.store_interaction(
        run_id="test_live_response_20250610",
        process_instance_id="fa1b9e86-4256-11f0-a7d7-0242ac140005",
        task_data=task_data,
        decision_context="UAS Platform Selection for Disaster Response"
    )
    
    if success:
        print("✅ Successfully stored and expanded live response data!")
    else:
        print("❌ Failed to store live response data")
        return
    
    # Now query the results
    print("\n📊 Querying the semantic graph...")
    
    # Check what nodes were created
    nodes_query = """
        MATCH (n) 
        RETURN labels(n) as node_types, count(n) as count
        ORDER BY count DESC
    """
    
    results = persistence.query_graph(nodes_query)
    print(f"\nNode types created:")
    for result in results:
        print(f"  - {result['node_types']}: {result['count']}")
    
    # Check relationships
    relations_query = """
        MATCH ()-[r]->()
        RETURN type(r) as relationship_type, count(r) as count
        ORDER BY count DESC
    """
    
    results = persistence.query_graph(relations_query)
    print(f"\nRelationship types created:")
    for result in results:
        print(f"  - {result['relationship_type']}: {result['count']}")
    
    # Check for stakeholders specifically
    stakeholder_query = """
        MATCH (s:Stakeholder)
        RETURN s.key as stakeholder_key, s.value as stakeholder_value
    """
    
    results = persistence.query_graph(stakeholder_query)
    print(f"\nStakeholders found:")
    for result in results:
        print(f"  - {result['stakeholder_key']}: {result['stakeholder_value']}")
    
    # Check for criteria
    criteria_query = """
        MATCH (c:Criterion)
        RETURN c.key as criterion_key, c.value as criterion_value
    """
    
    results = persistence.query_graph(criteria_query)
    print(f"\nCriteria found:")
    for result in results:
        print(f"  - {result['criterion_key']}: {result['criterion_value']}")
    
    print(f"\n🎉 Live response data successfully expanded into semantic graph!")
    persistence.close()

if __name__ == "__main__":
    test_live_response()
