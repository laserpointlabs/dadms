"""
Test case for the OpenAI Decision Process workflow.
This test verifies end-to-end execution of the process.
"""
import os
import sys
import unittest
from unittest.mock import MagicMock, patch
import json
import time
import requests
from datetime import datetime

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src import EnhancedServiceOrchestrator
from config import camunda_config
from camunda.external_task.external_task import ExternalTask

class TestOpenAIDecisionProcess(unittest.TestCase):
    """Test the OpenAI Decision Process workflow."""
    
    def setUp(self):
        """Setup test environment."""
        # Create a test service registry
        self.test_registry = {
            "assistant": {
                "openai": {
                    "endpoint": "http://test-openai-service:5000"
                }
            }
        }
        
        # Patch HTTP requests
        self.session_patcher = patch('requests.Session')
        self.mock_session_class = self.session_patcher.start()
        self.mock_session = MagicMock()
        self.mock_session_class.return_value = self.mock_session
        
        # Configure mock responses
        self.configure_mock_responses()
        
        # Create orchestrator
        self.orchestrator = EnhancedServiceOrchestrator(
            service_registry=self.test_registry,
            debug=True,
            enable_metrics=True
        )
        
        # Task outputs for validation
        self.task_outputs = {}
    
    def tearDown(self):
        """Clean up after tests."""
        self.session_patcher.stop()
        if hasattr(self, 'orchestrator'):
            self.orchestrator.close()
    
    def configure_mock_responses(self):
        """Configure mock HTTP responses."""
        
        def mock_get_response(url, **kwargs):
            mock_response = MagicMock()
            mock_response.status_code = 200
            
            if "process-instance" in url:
                # Mock response for process instance lookup
                mock_response.json.return_value = {"definitionId": "OpenAI_Decision_Process:1:123"}
            
            elif "process-definition" in url:
                # Mock response for process XML
                with open(os.path.join(project_root, "camunda_models", "openai_decision_process.bpmn"), "r") as f:
                    bpmn_xml = f.read()
                mock_response.json.return_value = {"bpmn20Xml": bpmn_xml}
            
            return mock_response
        
        # Configure mock GET
        self.mock_session.get.side_effect = mock_get_response
        
        # Mock responses for each task type
        self.mock_task_responses = {
            "FrameDecisionTask": {
                "result": {
                    "processed_by": "Test OpenAI Service",
                    "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "recommendation": """
# Decision Frame Analysis

## Key Decision
The key decision to be made is selecting the most appropriate Unmanned Aircraft System (UAS) for disaster response operations in urban environments, focusing on search and rescue, damage assessment, and situation monitoring capabilities.

## Stakeholders
1. **Emergency Response Teams** - Primary users requiring reliable, easy-to-use systems
2. **Disaster Victims** - Beneficiaries of quick and effective search and rescue operations
3. **Incident Commanders** - Need accurate situational awareness for decision-making
4. **Budget Authority** - Concerned with cost-effectiveness within $5,000-$15,000 range
5. **Technical Support Team** - Responsible for maintenance and operation
6. **Regulatory Authorities** - Ensure compliance with FAA Part 107 regulations

## Evaluation Criteria
1. **Flight Endurance** - Minimum 45 minutes of operational flight time
2. **Payload Capacity** - Ability to carry at least 500g of mission equipment
3. **Weather Resistance** - Operability in light rain and moderate wind conditions
4. **Imaging Capabilities** - HD video with thermal imaging functionality
5. **Data Transmission** - Real-time video feed to ground control
6. **Deployment Speed** - Setup and launch in under 5 minutes
7. **Regulatory Compliance** - Adherence to FAA Part 107 regulations
8. **Cost-Effectiveness** - Value proposition within budget constraints
9. **Support & Maintenance** - Availability of parts and service

## Constraints & Limitations
1. **Budget** - Limited to $5,000-$15,000 for complete system
2. **Regulatory** - Must comply with FAA Part 107 regulations
3. **Technical** - Must include specified payload capacity and imaging capabilities
4. **Operational** - Must deploy quickly and function in variable weather
5. **Training** - Must be operable with reasonable training requirements

## Timeline
- Decision deadline: 2 weeks from now
- Implementation deadline: System must be operational within 1 month of purchase
                    """
                }
            },
            "IdentifyAlternativesTask": {
                "result": {
                    "processed_by": "Test OpenAI Service",
                    "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "recommendation": """
# UAS Alternatives for Disaster Response

Based on the requirements for a disaster response UAS with at least 45 minutes flight time, 500g payload capacity, weather resistance, HD thermal imaging, real-time transmission, quick deployment, and FAA Part 107 compliance within a $5,000-$15,000 budget, here are five suitable alternatives:

## 1. DJI Matrice 300 RTK

**Description**: Professional-grade quadcopter designed for industrial applications and demanding missions.

**Specifications**:
- Flight Time: Up to 55 minutes
- Payload Capacity: 2.7 kg (5.95 lbs)
- Weather Resistance: IP45 rating (operates in light rain, snow, and winds up to 15 m/s)
- Camera: Compatible with Zenmuse H20T (includes thermal imaging)
- Transmission Range: Up to 15 km with 1080p video transmission

**Strengths**:
- Exceptional flight time exceeding requirements
- High payload capacity for multiple sensors
- Excellent weather resistance with IP45 rating
- Advanced obstacle avoidance system
- Hot-swappable batteries for extended operations

**Limitations**:
- High end of budget range
- Larger size may require more transportation space
- More complex operation requiring additional training

**Approximate Cost**: $13,000-$15,000 (including controller and H20T camera)

**Regulatory Considerations**: Compliant with FAA Part 107, but requires registration as it weighs more than 250g.

## 2. Autel Robotics EVO II Dual 640T

**Description**: Foldable drone with dual visible light and thermal cameras in a compact form factor.

**Specifications**:
- Flight Time: 40 minutes (slightly below requirement)
- Payload: Integrated cameras (no additional payload capacity)
- Weather Resistance: Can operate in light rain and winds up to 8 m/s
- Camera: Built-in 8K RGB camera and 640×512 thermal camera
- Transmission Range: 9 km with HD video feed

**Strengths**:
- Integrated thermal and visual cameras
- Compact, foldable design for easy transport
- Simple operation with minimal training
- No additional purchases needed for thermal capability
- 360° obstacle avoidance

**Limitations**:
- Flight time slightly below requirement (40 vs 45 minutes)
- No capacity for additional payload beyond built-in cameras
- Less weather resistant than other options

**Approximate Cost**: $9,000-$10,000

**Regulatory Considerations**: Compliant with FAA Part 107, requires registration.

## 3. Parrot ANAFI USA

**Description**: Compact, security-focused drone with thermal imaging designed for government and enterprise use.

**Specifications**:
- Flight Time: 32 minutes (below requirement)
- Payload: Integrated cameras (no additional payload)
- Weather Resistance: IP53 rating, operates in light rain and winds up to 14.7 m/s
- Camera: 4K HDR camera and FLIR Boson thermal camera
- Transmission Range: 4 km with secure, encrypted connection

**Strengths**:
- Made in USA (potential security advantage)
- Highly portable and deploys in under 55 seconds
- Extremely quiet operation (79dB at 1m)
- 32x zoom capability for detailed inspection
- Data security features with encrypted transmission

**Limitations**:
- Flight time below requirement (32 vs 45 minutes)
- Limited payload options
- Shorter transmission range than other alternatives

**Approximate Cost**: $7,000-$8,000

**Regulatory Considerations**: Fully compliant with FAA Part 107, designed with government regulations in mind.

## 4. Skydio X2E

**Description**: Autonomous drone with advanced obstacle avoidance and thermal imaging capabilities.

**Specifications**:
- Flight Time: 35 minutes (below requirement)
- Payload: Integrated dual-sensor payload
- Weather Resistance: Can operate in light rain and moderate wind
- Camera: 4K visual camera and 320x256 FLIR thermal camera
- Transmission Range: 6 km

**Strengths**:
- Industry-leading autonomous flight capabilities
- Extremely easy to operate, even for novice pilots
- Compact, foldable design with case
- Made in USA with security features
- GPS-denied navigation capability

**Limitations**:
- Flight time below requirement (35 vs 45 minutes)
- Higher learning curve for advanced features
- Limited customization options

**Approximate Cost**: $10,000-$12,000

**Regulatory Considerations**: Compliant with FAA Part 107, includes features to help maintain regulatory compliance.

## 5. Freefly Astro

**Description**: Enterprise drone with modular design for various mission profiles.

**Specifications**:
- Flight Time: Up to 50 minutes
- Payload Capacity: Up to 2 kg
- Weather Resistance: Can operate in light rain and winds up to 12 m/s
- Camera: Compatible with various payloads including FLIR Vue thermal cameras
- Transmission Range: 10 km with HD video

**Strengths**:
- Modular design allows for mission-specific configurations
- Excellent flight time meeting requirements
- High payload capacity for various sensors
- Made in USA
- Open platform for integration with custom solutions

**Limitations**:
- Requires more technical knowledge to operate
- Thermal camera is an additional purchase
- Less autonomous capabilities than Skydio

**Approximate Cost**: $8,000-$11,000 (depending on configuration)

**Regulatory Considerations**: Compliant with FAA Part 107, requires registration.
                    """
                }
            },
            "EvaluateAlternativesTask": {
                "result": {
                    "processed_by": "Test OpenAI Service",
                    "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "recommendation": """
# Evaluation of UAS Alternatives

Based on the criteria established during decision framing, I'll evaluate each alternative using a 1-5 scale (1=Poor, 2=Fair, 3=Good, 4=Very Good, 5=Excellent).

## Evaluation Criteria Weighting
Given the disaster response context, I'll assign the following weights to our criteria:
- Flight Endurance: 20% (critical for extended operations)
- Payload Capacity: 15% (important for versatility)
- Weather Resistance: 15% (essential for reliability)
- Imaging Capabilities: 15% (crucial for mission effectiveness)
- Data Transmission: 10% (necessary for real-time awareness)
- Deployment Speed: 10% (time-sensitive operations)
- Regulatory Compliance: 5% (mandatory but all options comply)
- Cost-Effectiveness: 10% (budget constraints)

## DJI Matrice 300 RTK
1. Flight Endurance (5): Exceeds requirement with 55 minutes
2. Payload Capacity (5): 2.7kg far exceeds the 500g requirement
3. Weather Resistance (5): IP45 rating handles light rain and strong winds
4. Imaging Capabilities (5): Zenmuse H20T provides excellent thermal and visual
5. Data Transmission (5): 15km range with 1080p transmission
6. Deployment Speed (3): More complex setup, likely around 5 minutes
7. Regulatory Compliance (5): Fully compliant with FAA Part 107
8. Cost-Effectiveness (2): At $13,000-$15,000, it's at the upper budget limit

**Weighted Score: 4.35/5**
**Justification**: The Matrice 300 RTK excels in almost all technical aspects, especially in flight time, payload, and weather resistance, which are critical for disaster response. Its primary drawback is the higher cost and slightly longer deployment time.

## Autel Robotics EVO II Dual 640T
1. Flight Endurance (3): 40 minutes is slightly below the 45-minute requirement
2. Payload Capacity (2): Limited to integrated cameras
3. Weather Resistance (3): Can handle light rain but less wind than others
4. Imaging Capabilities (4): Good integrated 8K and thermal cameras
5. Data Transmission (4): 9km range with HD feed
6. Deployment Speed (5): Quick unfolding design enables rapid deployment
7. Regulatory Compliance (5): Fully compliant with FAA Part 107
8. Cost-Effectiveness (3): $9,000-$10,000 is in the mid-range of budget

**Weighted Score: 3.40/5**
**Justification**: The EVO II offers good imaging and easy deployment but falls short on flight time and payload capacity, limiting mission flexibility.

## Parrot ANAFI USA
1. Flight Endurance (2): 32 minutes is significantly below requirement
2. Payload Capacity (2): Limited to integrated cameras
3. Weather Resistance (4): IP53 rating good for light rain
4. Imaging Capabilities (4): Good 4K HDR and FLIR thermal cameras
5. Data Transmission (3): 4km range is adequate but limited
6. Deployment Speed (5): Under 55 seconds is excellent
7. Regulatory Compliance (5): Fully compliant, with security features
8. Cost-Effectiveness (4): At $7,000-$8,000, good value in lower range

**Weighted Score: 3.25/5**
**Justification**: The ANAFI USA offers excellent deployment speed and good value but is limited by shorter flight time and transmission range, which could hamper extended operations.

## Skydio X2E
1. Flight Endurance (2): 35 minutes falls short of requirements
2. Payload Capacity (2): Limited to integrated payload
3. Weather Resistance (3): Adequate for light rain and moderate wind
4. Imaging Capabilities (4): Good 4K and thermal cameras
5. Data Transmission (3): 6km range is adequate
6. Deployment Speed (4): Quick deployment with minimal training needed
7. Regulatory Compliance (5): Fully compliant with built-in compliance features
8. Cost-Effectiveness (3): $10,000-$12,000 is in the upper-mid range

**Weighted Score: 3.00/5**
**Justification**: The Skydio's autonomous capabilities make it extremely easy to operate, but the shorter flight time and higher price reduce its overall score for this application.

## Freefly Astro
1. Flight Endurance (5): 50 minutes exceeds requirements
2. Payload Capacity (5): 2kg capacity exceeds requirements
3. Weather Resistance (4): Good performance in rain and moderate wind
4. Imaging Capabilities (4): Compatible with high-quality thermal cameras
5. Data Transmission (4): 10km range is very good
6. Deployment Speed (3): Modular design might require additional setup time
7. Regulatory Compliance (5): Fully compliant with FAA Part 107
8. Cost-Effectiveness (3): $8,000-$11,000 offers good value for capabilities

**Weighted Score: 4.15/5**
**Justification**: The Astro offers excellent flight time and payload capacity with good all-around performance. Its modularity provides mission flexibility but might require more setup time.

## Overall Comparison

| UAS Model | Weighted Score | Key Strengths | Key Limitations |
|-----------|----------------|---------------|-----------------|
| DJI Matrice 300 RTK | 4.35 | Flight time, payload, weather resistance | Cost, deployment time |
| Freefly Astro | 4.15 | Flight time, payload, modularity | Technical complexity |
| Autel EVO II Dual 640T | 3.40 | Imaging, deployment speed | Flight time, payload limitations |
| Parrot ANAFI USA | 3.25 | Deployment speed, cost | Flight time, transmission range |
| Skydio X2E | 3.00 | Autonomous capability, ease of use | Flight time, cost |

The DJI Matrice 300 RTK and Freefly Astro stand out as the top performers, with their excellent flight times and payload capacities being decisive factors for disaster response operations. The Matrice 300 RTK edges out the Astro primarily in weather resistance and transmission capabilities, though at a higher cost.
                    """
                }
            },
            "RecommendationTask": {
                "result": {
                    "processed_by": "Test OpenAI Service",
                    "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "recommendation": """
# Final Recommendation: DJI Matrice 300 RTK

## Recommendation Justification

After evaluating all alternatives against the established criteria, I recommend the **DJI Matrice 300 RTK** as the optimal UAS platform for disaster response operations. While both the Matrice 300 RTK and the Freefly Astro scored highly in our evaluation, the Matrice's superior specifications in critical areas make it the best choice for the demanding requirements of disaster response missions.

The Matrice 300 RTK received a weighted score of 4.35/5, outperforming all other alternatives across the most mission-critical parameters. This recommendation is based on:

1. **Superior Technical Performance**: With 55 minutes of flight time, 2.7kg payload capacity, and IP45 weather resistance, the Matrice 300 RTK exceeds all technical requirements for disaster response operations.

2. **Reliability in Adverse Conditions**: The IP45 rating ensures operation in light rain and winds up to 15 m/s, which is crucial for maintaining operational capability during disaster scenarios when weather conditions may be suboptimal.

3. **Mission Flexibility**: The high payload capacity allows for carrying multiple or heavier sensors, enabling adaptability to various mission profiles from search and rescue to structural assessment.

4. **Industry-Leading Imaging**: The compatible Zenmuse H20T camera provides exceptional thermal and visual imaging capabilities essential for locating victims and assessing damage.

5. **Extended Operational Range**: The 15km transmission range with 1080p video allows for operations across larger disaster zones while maintaining high-quality real-time video feeds.

## Key Advantages

- **Hot-Swappable Batteries**: Enables extended operations beyond the 55-minute flight time without significant downtime.
- **Obstacle Avoidance System**: Reduces risk of crashes in complex urban environments during disaster response.
- **Proven Platform**: DJI's well-established ecosystem provides reliability and support.
- **Integration Capabilities**: Ability to integrate with emergency management software and systems.
- **Durability**: Built for industrial applications with a robust design suited to demanding environments.

## Potential Risks and Mitigation

1. **Higher Cost**: 
   - *Risk*: At $13,000-$15,000, the Matrice 300 RTK is at the upper limit of the budget.
   - *Mitigation*: Consider a phased procurement approach or explore grant opportunities for emergency response equipment. The higher initial investment is justified by superior capabilities and potential for longer service life.

2. **Operational Complexity**: 
   - *Risk*: More complex setup and operation compared to consumer-grade alternatives.
   - *Mitigation*: Implement a comprehensive training program for operators. DJI offers training resources, and the investment in training will yield better operational outcomes.

3. **Deployment Time**: 
   - *Risk*: Slightly longer deployment time than some more compact alternatives.
   - *Mitigation*: Develop and practice standard operating procedures to optimize deployment. Pre-mission checklists and regular drills can minimize setup time.

4. **Maintenance Requirements**: 
   - *Risk*: More complex system may require more maintenance.
   - *Mitigation*: Establish a preventative maintenance schedule and keep essential spare parts on hand. Consider a service contract with an authorized DJI enterprise dealer.

## Implementation Considerations

1. **Procurement Timeline**: 
   - Week 1: Finalize specifications and place order with authorized DJI Enterprise dealer
   - Week 2-3: Delivery and initial inspection
   - Week 4: Operator training and system testing

2. **Training Requirements**:
   - Minimum of 16 hours of hands-on training for primary operators
   - Development of standard operating procedures for disaster response scenarios
   - Regular practice sessions and scenario-based training

3. **Accessories and Support Equipment**:
   - Additional batteries (recommend 4 total for extended operations)
   - Multi-battery charging hub
   - Rugged transport case
   - Field monitor for incident command viewing

4. **Maintenance Planning**:
   - 30-day inspection schedule
   - 6-month comprehensive maintenance check
   - Firmware update protocol

## Next Steps

1. **Immediate (Days 1-3)**:
   - Contact authorized DJI Enterprise dealers for final quotes
   - Verify availability of Matrice 300 RTK and Zenmuse H20T
   - Confirm compatibility with existing emergency management systems

2. **Short-term (Week 1)**:
   - Secure funding approval
   - Place purchase order
   - Identify personnel for operator training

3. **Medium-term (Weeks 2-3)**:
   - Prepare operating location and charging station
   - Develop standard operating procedures
   - Register aircraft with FAA

4. **Long-term (Week 4)**:
   - Conduct operator training
   - Perform initial test flights and capability verification
   - Integrate into emergency response protocols

The DJI Matrice 300 RTK represents the optimal balance of performance, reliability, and capability for disaster response operations within the specified parameters. While it requires a higher initial investment and more extensive training than some alternatives, its superior specifications in flight time, payload capacity, and weather resistance make it the most effective tool for the critical missions it will undertake.
                    """
                }
            }
        }
        
        def mock_post_response(url, json=None, **kwargs):
            mock_response = MagicMock()
            mock_response.status_code = 200
            
            # Check which task is being processed
            task_name = json.get("task_name", "")
            
            # Return the appropriate mock response based on task name
            if task_name in self.mock_task_responses:
                mock_response.json.return_value = self.mock_task_responses[task_name]
            else:
                # Default response if task not recognized
                mock_response.json.return_value = {
                    "result": {
                        "processed_by": "Test Service",
                        "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "recommendation": "Default test response"
                    }
                }
            
            return mock_response
        
        # Configure mock POST
        self.mock_session.post.side_effect = mock_post_response
    
    def create_mock_task(self, task_name, process_id="test_process_123", variables=None):
        """Create a mock Camunda task."""
        if variables is None:
            variables = {
                "decision_context": {
                    "value": "We need to select an appropriate UAS for disaster response operations."
                }
            }
        
        # Create a mock task object
        mock_task = MagicMock()
        mock_task.get_activity_id.return_value = task_name
        mock_task.get_process_instance_id.return_value = process_id
        mock_task.get_variables.return_value = variables
        
        return mock_task
    
    def test_frame_decision_task(self):
        """Test processing of the Frame Decision task."""
        # Create mock task
        task = self.create_mock_task("FrameDecisionTask")
        
        # Process the task
        result = self.orchestrator.route_task(task)
        
        # Store result for verification
        self.task_outputs["FrameDecisionTask"] = result
        
        # Check result
        self.assertIn("recommendation", result)
        self.assertIn("Key Decision", result["recommendation"])
        self.assertIn("Stakeholders", result["recommendation"])
        self.assertIn("Evaluation Criteria", result["recommendation"])
        
        # Print a summary
        print(f"\nFrameDecisionTask Output:")
        print(f"- Contains key decision: {'Key Decision' in result['recommendation']}")
        print(f"- Contains stakeholders: {'Stakeholders' in result['recommendation']}")
        print(f"- Contains criteria: {'Criteria' in result['recommendation']}")
        
        return result
    
    def test_identify_alternatives_task(self):
        """Test processing of the Identify Alternatives task."""
        # Use the output from the frame decision task as input
        frame_result = self.task_outputs.get("FrameDecisionTask")
        if not frame_result:
            frame_result = self.test_frame_decision_task()
        
        # Create variables with the frame decision result
        variables = {
            "task_name": "FrameDecisionTask",
            "recommendation": frame_result["recommendation"],
            "processed_by": frame_result.get("processed_by", "Test")
        }
        
        # Create mock task
        task = self.create_mock_task("IdentifyAlternativesTask", variables=variables)
        
        # Process the task
        result = self.orchestrator.route_task(task)
        
        # Store result for verification
        self.task_outputs["IdentifyAlternativesTask"] = result
        
        # Check result
        self.assertIn("recommendation", result)
        
        # Look for specific UAS platforms
        platforms_found = []
        for platform in ["DJI", "Autel", "Parrot", "Skydio", "Freefly"]:
            if platform in result["recommendation"]:
                platforms_found.append(platform)
        
        self.assertTrue(len(platforms_found) >= 3, f"Found only {len(platforms_found)} platforms: {platforms_found}")
        
        # Print a summary
        print(f"\nIdentifyAlternativesTask Output:")
        print(f"- Platforms identified: {', '.join(platforms_found)}")
        print(f"- Contains specifications: {'Specifications' in result['recommendation']}")
        print(f"- Contains strengths/limitations: {'Strengths' in result['recommendation'] and 'Limitations' in result['recommendation']}")
        
        return result
    
    def test_evaluate_alternatives_task(self):
        """Test processing of the Evaluate Alternatives task."""
        # Use the output from the previous task as input
        alternatives_result = self.task_outputs.get("IdentifyAlternativesTask")
        if not alternatives_result:
            alternatives_result = self.test_identify_alternatives_task()
        
        # Create variables with the previous results
        variables = {
            "task_name": "IdentifyAlternativesTask",
            "recommendation": alternatives_result["recommendation"],
            "processed_by": alternatives_result.get("processed_by", "Test")
        }
        
        # Create mock task
        task = self.create_mock_task("EvaluateAlternativesTask", variables=variables)
        
        # Process the task
        result = self.orchestrator.route_task(task)
        
        # Store result for verification
        self.task_outputs["EvaluateAlternativesTask"] = result
        
        # Check result
        self.assertIn("recommendation", result)
        
        # Check for evaluation elements
        self.assertTrue(any(str(i) in result["recommendation"] for i in range(1, 6)), "No rating scores found")
        self.assertIn("score", result["recommendation"].lower())
        
        # Print a summary
        print(f"\nEvaluateAlternativesTask Output:")
        print(f"- Contains scoring: {'score' in result['recommendation'].lower()}")
        print(f"- Contains justification: {'justification' in result['recommendation'].lower()}")
        print(f"- Contains comparison: {'comparison' in result['recommendation'].lower() or 'vs' in result['recommendation'].lower()}")
        
        return result
    
    def test_recommendation_task(self):
        """Test processing of the Recommendation task."""
        # Use the output from the previous task as input
        evaluate_result = self.task_outputs.get("EvaluateAlternativesTask")
        if not evaluate_result:
            evaluate_result = self.test_evaluate_alternatives_task()
        
        # Create variables with the previous results
        variables = {
            "task_name": "EvaluateAlternativesTask",
            "recommendation": evaluate_result["recommendation"],
            "processed_by": evaluate_result.get("processed_by", "Test")
        }
        
        # Create mock task
        task = self.create_mock_task("RecommendationTask", variables=variables)
        
        # Process the task
        result = self.orchestrator.route_task(task)
        
        # Store result for verification
        self.task_outputs["RecommendationTask"] = result
        
        # Check result
        self.assertIn("recommendation", result)
        
        # Check for recommendation elements
        self.assertIn("Recommendation", result["recommendation"])
        self.assertIn("Justification", result["recommendation"])
        self.assertIn("Next Steps", result["recommendation"])
        
        # Print a summary
        print(f"\nRecommendationTask Output:")
        print(f"- Contains clear recommendation: {'recommend' in result['recommendation'].lower()}")
        print(f"- Contains implementation plan: {'implementation' in result['recommendation'].lower()}")
        print(f"- Contains next steps: {'next steps' in result['recommendation'].lower()}")
        
        return result
    
    def test_full_process_flow(self):
        """Test the entire process flow from start to finish."""
        # Clear any previous outputs
        self.task_outputs = {}
        
        # Process each task in sequence
        frame_result = self.test_frame_decision_task()
        alternatives_result = self.test_identify_alternatives_task()
        evaluate_result = self.test_evaluate_alternatives_task()
        recommendation_result = self.test_recommendation_task()
        
        # Get orchestrator metrics
        metrics = self.orchestrator.get_metrics()
        
        # Print metrics summary
        print("\nOrchestrator Performance Metrics:")
        for cache_name, cache_metrics in metrics.get("cache_metrics", {}).items():
            hits = cache_metrics.get("hits", 0)
            misses = cache_metrics.get("misses", 0)
            total = hits + misses
            hit_rate = (hits / total * 100) if total > 0 else 0
            print(f"- {cache_name}: {hit_rate:.1f}% hit rate ({hits}/{total})")
        
        # Verify the full flow
        self.assertEqual(len(self.task_outputs), 4, "Not all tasks were processed")
        
        # Check that each task built on the previous one
        recommended_platform = None
        for line in recommendation_result["recommendation"].split('\n'):
            if "recommend" in line.lower() and ":" in line:
                recommended_platform = line.split(":", 1)[1].strip()
                break
        
        self.assertIsNotNone(recommended_platform, "No clear recommendation found")
        print(f"\nFinal Recommended Platform: {recommended_platform}")
        
        # Create a summary file with all outputs
        test_output = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "test_results": "PASS",
            "task_outputs": self.task_outputs,
            "metrics": metrics,
            "final_recommendation": recommended_platform
        }
        
        # Save test results
        with open("openai_decision_process_test_results.json", "w") as f:
            json.dump(test_output, f, indent=2)
        
        print("\nTest results saved to openai_decision_process_test_results.json")

if __name__ == "__main__":
    # Run the full process flow test
    test_case = TestOpenAIDecisionProcess()
    test_case.setUp()
    try:
        test_case.test_full_process_flow()
    finally:
        test_case.tearDown()
