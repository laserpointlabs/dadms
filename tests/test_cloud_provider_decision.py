"""
Tests for the OpenAI Decision Process with a cloud provider selection scenario.

DEPRECATED: This test has an issue with the status field potentially being None.
Use test_cloud_provider_decision_fixed.py instead, which has the proper handling for this case.
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

class TestCloudProviderDecisionProcess(unittest.TestCase):
    """Test the OpenAI Decision Process workflow with a cloud provider selection scenario."""
    
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
# Cloud Provider Selection Decision Frame

## Key Decision
The key decision to be made is selecting the most appropriate cloud service provider (AWS, Azure, or Google Cloud) for our new enterprise application that requires high availability, scalability, and robust security.

## Stakeholders
1. **IT Department** - Responsible for implementation and ongoing maintenance
2. **Finance Department** - Concerned with cost optimization and predictable pricing
3. **Security Team** - Needs to ensure compliance with regulatory requirements
4. **Development Team** - Requires specific tools and services for application development
5. **Business Users** - Need reliable and fast access to the application
6. **Executive Leadership** - Interested in strategic alignment and long-term viability

## Evaluation Criteria
1. **Service Availability** - Uptime guarantees and global infrastructure
2. **Scalability** - Ability to handle varying workloads and growing user base
3. **Security Features** - Data protection, compliance certifications, network security
4. **Cost Structure** - Pricing models, discounts, and total cost of ownership
5. **Integration Capabilities** - Compatibility with existing systems
6. **Developer Tools** - Quality of development ecosystem and services
7. **Support Quality** - SLAs, technical support options, and community resources
8. **Performance** - Compute power, storage speed, and network latency
9. **Vendor Lock-in Risk** - Ease of migration to other providers if needed

## Constraints & Limitations
1. **Budget** - Maximum annual spend of $250,000
2. **Compliance** - Must meet GDPR, HIPAA, and SOC 2 compliance requirements
3. **Timeline** - Migration must be completed within 6 months
4. **Expertise** - Team has varying levels of familiarity with different cloud platforms
5. **Legacy Systems** - Must maintain integration with on-premises legacy systems

## Timeline
- Decision deadline: 3 weeks from now
- Implementation planning: 1 month after decision
- Full migration: 6 months after decision
                    """
                }
            },
            "IdentifyAlternativesTask": {
                "result": {
                    "processed_by": "Test OpenAI Service",
                    "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "recommendation": """
# Cloud Provider Alternatives

Based on the decision frame for selecting a cloud service provider for the new enterprise application, here are three primary alternatives with their respective specifications, strengths, limitations, costs, and compliance considerations.

## 1. Amazon Web Services (AWS)

**Description**: AWS is the market leader in cloud services with the broadest range of services and global infrastructure.

**Key Specifications and Capabilities**:
- 25 geographic regions with 81 availability zones
- 200+ fully-featured services including compute, storage, databases, analytics, networking, ML, AI
- 99.99% SLA for most core services
- Comprehensive security features including AWS Shield, GuardDuty, and IAM
- Extensive certification coverage (GDPR, HIPAA, SOC 1/2/3, ISO, etc.)
- Advanced features like Lambda serverless computing, EKS (Kubernetes), and Aurora database

**Strengths**:
- Most mature and comprehensive cloud platform
- Largest global infrastructure footprint
- Robust partner ecosystem
- Most extensive service catalog
- Proven enterprise-scale capabilities
- Strong security controls and compliance capabilities
- Extensive documentation and community support

**Limitations**:
- Complex pricing structure
- Steeper learning curve due to extensive options
- Higher costs for data transfer out of AWS
- Managing costs requires expertise
- More complex architecture decisions due to multiple options

**Approximate Cost**:
- Estimated annual cost based on requirements: $200,000-$240,000
- Reserved instance discounts available (up to 75% vs on-demand)
- Complex pricing model with per-service pricing
- Volume-based discounting available

**Regulatory Considerations**:
- Compliant with GDPR, HIPAA, SOC 1/2/3, ISO 27001, FedRAMP
- Comprehensive compliance reporting tools
- Shared responsibility model well-documented
- Regional data residency options

## 2. Microsoft Azure

**Description**: Microsoft's cloud platform with strong enterprise integration and hybrid cloud capabilities.

**Key Specifications and Capabilities**:
- 60+ regions worldwide
- Comprehensive service offering with 200+ services
- 99.99% SLA for key services
- Native integration with Microsoft ecosystem
- Strong hybrid cloud capabilities with Azure Arc
- Advanced Azure Active Directory for identity management
- Robust Kubernetes service (AKS)

**Strengths**:
- Seamless integration with Microsoft products (Office 365, Teams, etc.)
- Strong identity management with Azure Active Directory
- Excellent hybrid cloud capabilities
- Enterprise-friendly licensing and support
- Strong Windows workload support
- Integrated development tools with Visual Studio
- Strong SQL Server and .NET support

**Limitations**:
- Some services less mature than AWS equivalents
- Less extensive global reach compared to AWS
- Performance inconsistencies across regions
- Azure Portal can be complex to navigate
- Service naming and organization can be confusing

**Approximate Cost**:
- Estimated annual cost based on requirements: $210,000-$250,000
- Azure Hybrid Benefits for Windows Server/SQL Server licenses
- Enterprise Agreement discounts available
- Simplified pricing compared to AWS
- Dev/Test pricing specials

**Regulatory Considerations**:
- Compliant with GDPR, HIPAA, SOC 1/2, ISO 27001, FedRAMP
- Azure Policy for compliance management
- Strong in government cloud offerings
- Regional data residency guarantees

## 3. Google Cloud Platform (GCP)

**Description**: Google's cloud platform known for data analytics, machine learning capabilities, and innovative technology.

**Key Specifications and Capabilities**:
- 35+ regions with 106 availability zones
- 100+ services focusing on compute, storage, big data, ML/AI
- 99.95-99.99% SLAs depending on service
- Advanced networking with global private network
- Industry-leading Kubernetes service (GKE)
- Cutting-edge AI and ML capabilities
- BigQuery for massive-scale analytics

**Strengths**:
- Superior data analytics and machine learning tools
- Live migration of VMs (no downtime for maintenance)
- Innovative pricing models including sustained use discounts
- High-performance network infrastructure
- Strong open-source commitment
- Leading container technologies (Kubernetes originated at Google)
- Simple and transparent pricing

**Limitations**:
- Smaller global footprint than AWS or Azure
- Fewer services overall compared to competitors
- Less mature enterprise support and frameworks
- Smaller partner ecosystem
- Frequent service changes and rebranding
- Less extensive documentation

**Approximate Cost**:
- Estimated annual cost based on requirements: $190,000-$230,000
- Automatic sustained use discounts
- Simpler pricing structure compared to competitors
- Committed use discounts available (1 or 3 year)
- Free tier for many services for testing

**Regulatory Considerations**:
- Compliant with GDPR, HIPAA, SOC 1/2/3, ISO 27001
- Security Command Center for compliance monitoring
- Data residency controls
- VPC Service Controls for network isolation

Each of these cloud providers offers viable solutions for the enterprise application requirements, with differences in specific strengths, pricing models, and ecosystem integrations that will need to be evaluated against the organization's specific needs and constraints.
                    """
                }
            },
            "EvaluateAlternativesTask": {
                "result": {
                    "processed_by": "Test OpenAI Service",
                    "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "recommendation": """
# Evaluation of Cloud Provider Alternatives

## Evaluation Methodology
I'll evaluate each cloud provider (AWS, Azure, GCP) against the criteria established during decision framing using a 1-5 scale:
1 = Poor
2 = Fair
3 = Good
4 = Very Good
5 = Excellent

## Criteria Weighting
Given the enterprise application requirements, I've assigned the following weights to our criteria:
- Service Availability: 20% (critical for business operations)
- Scalability: 15% (important for growth)
- Security Features: 20% (essential for compliance)
- Cost Structure: 15% (significant budget impact)
- Integration Capabilities: 10% (important for existing systems)
- Developer Tools: 8% (affects development efficiency)
- Support Quality: 5% (important for issue resolution)
- Performance: 5% (affects user experience)
- Vendor Lock-in Risk: 2% (strategic consideration)

## Amazon Web Services (AWS)

1. **Service Availability** (5): Industry-leading with 25 regions, 81 availability zones, and 99.99% SLAs
   *Justification*: AWS has the most extensive global infrastructure and proven track record for reliability.

2. **Scalability** (5): Excellent auto-scaling capabilities across all service types
   *Justification*: AWS pioneered auto-scaling and offers the most mature scaling options.

3. **Security Features** (5): Comprehensive security services with AWS Shield, GuardDuty, IAM, and extensive compliance certifications
   *Justification*: Most mature security services with granular controls and comprehensive documentation.

4. **Cost Structure** (3): Complex pricing with potential for unexpected costs, but good discount options
   *Justification*: While offering competitive pricing, AWS has the most complex pricing structure requiring careful management.

5. **Integration Capabilities** (4): Extensive APIs and integration services, though requires specific knowledge
   *Justification*: AWS offers comprehensive integration options but requires more specific AWS knowledge.

6. **Developer Tools** (4): Comprehensive tooling with CodePipeline, CodeBuild, and CodeDeploy
   *Justification*: Mature CI/CD pipeline tools but with a steeper learning curve.

7. **Support Quality** (4): Multiple support tiers with fast response times, but expensive premium support
   *Justification*: Enterprise support is comprehensive but at a premium price point.

8. **Performance** (4): Consistent high performance with specialized instance types
   *Justification*: Offers specialized high-performance options for various workloads.

9. **Vendor Lock-in Risk** (2): High risk due to proprietary services and APIs
   *Justification*: Many AWS-specific services create significant switching costs.

**Weighted Score: 4.34/5**

## Microsoft Azure

1. **Service Availability** (4): Strong with 60+ regions but slightly fewer availability zones than AWS
   *Justification*: Extensive global presence but with some reliability history concerns.

2. **Scalability** (4): Robust scaling capabilities with Azure Autoscale
   *Justification*: Good autoscaling but occasionally less granular than AWS.

3. **Security Features** (5): Excellent security with Azure Active Directory, Security Center, and strong compliance
   *Justification*: Superior identity management and strong enterprise security features.

4. **Cost Structure** (4): More transparent than AWS, with strong enterprise agreements
   *Justification*: Better predictability and potential for license benefit discounts.

5. **Integration Capabilities** (5): Exceptional integration with Microsoft ecosystem and legacy systems
   *Justification*: Superior integration with existing Microsoft products and on-premises systems.

6. **Developer Tools** (4): Strong with Visual Studio integration and DevOps services
   *Justification*: Excellent for Microsoft-centric development environments.

7. **Support Quality** (5): Enterprise-grade support with Microsoft's established support infrastructure
   *Justification*: Long history of enterprise support with extensive knowledge base.

8. **Performance** (4): Strong performance with some regional variations
   *Justification*: Generally strong but with more inconsistency between regions.

9. **Vendor Lock-in Risk** (3): Moderate risk, especially for Microsoft-centric organizations
   *Justification*: Strong Microsoft ecosystem ties, but better standard compliance.

**Weighted Score: 4.29/5**

## Google Cloud Platform (GCP)

1. **Service Availability** (3): Smaller footprint with 35+ regions, solid but fewer availability zones
   *Justification*: Reliable but less extensive global coverage than competitors.

2. **Scalability** (5): Excellent scalability with Kubernetes origins and advanced autoscaling
   *Justification*: Superior container orchestration and autoscaling technology.

3. **Security Features** (4): Strong security model with solid compliance certifications
   *Justification*: Good security controls but less extensive than AWS and Azure.

4. **Cost Structure** (5): Most transparent pricing with automatic sustained use discounts
   *Justification*: Simplest pricing model with innovative discount structures.

5. **Integration Capabilities** (3): Good API coverage but less comprehensive than competitors
   *Justification*: Lacks some enterprise integration options compared to competitors.

6. **Developer Tools** (4): Strong with Cloud Build, Cloud Deploy, and open-source orientation
   *Justification*: Good developer experience with strong container support.

7. **Support Quality** (3): Improving but less mature enterprise support than competitors
   *Justification*: Less extensive support history for enterprise customers.

8. **Performance** (5): Superior network performance with Google's global fiber network
   *Justification*: Industry-leading network performance and live migration capabilities.

9. **Vendor Lock-in Risk** (4): Lower risk due to open-source commitment and standard technologies
   *Justification*: Stronger commitment to open standards and portable technologies.

**Weighted Score: 4.02/5**

## Comparative Analysis

| Criteria | Weight | AWS | Azure | GCP |
|----------|--------|-----|-------|-----|
| Service Availability | 20% | 5 | 4 | 3 |
| Scalability | 15% | 5 | 4 | 5 |
| Security Features | 20% | 5 | 5 | 4 |
| Cost Structure | 15% | 3 | 4 | 5 |
| Integration | 10% | 4 | 5 | 3 |
| Developer Tools | 8% | 4 | 4 | 4 |
| Support Quality | 5% | 4 | 5 | 3 |
| Performance | 5% | 4 | 4 | 5 |
| Vendor Lock-in | 2% | 2 | 3 | 4 |
| **Weighted Score** | **100%** | **4.34** | **4.29** | **4.02** |

## Summary

AWS leads with a score of 4.34/5, narrowly ahead of Azure at 4.29/5, with GCP at 4.02/5. AWS excels in infrastructure maturity, service breadth, and security. Azure shines in Microsoft integration and enterprise support. GCP stands out for performance, pricing transparency, and lower vendor lock-in.

The small score differences indicate that all three providers are viable options, with specific strengths aligned to different priorities. The final decision should consider the organization's specific technical requirements, existing investments, and team expertise.
                    """
                }
            },
            "RecommendationTask": {
                "result": {
                    "processed_by": "Test OpenAI Service",
                    "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "recommendation": """
# Final Recommendation: AWS with Multi-Cloud Strategy

## Recommendation Justification

Based on the comprehensive evaluation, I recommend **Amazon Web Services (AWS)** as the primary cloud provider for the new enterprise application, supplemented with a strategic multi-cloud approach to mitigate vendor lock-in risks.

AWS received the highest weighted score (4.34/5) in our evaluation, narrowly leading Microsoft Azure (4.29/5), with both substantially ahead of Google Cloud Platform (4.02/5). AWS is recommended as the primary platform for these key reasons:

1. **Superior Service Availability**: AWS's unmatched global infrastructure with 25 regions and 81 availability zones ensures the high availability required for mission-critical enterprise applications. This infrastructure breadth provides better resilience and disaster recovery capabilities.

2. **Comprehensive Security Ecosystem**: With the most mature security services and compliance certifications (including GDPR, HIPAA, and SOC 2), AWS best addresses the strict security and compliance requirements of the project.

3. **Unparalleled Service Breadth**: AWS offers the most comprehensive service catalog, providing all the required capabilities for the application without forcing compromises in architecture or functionality.

4. **Enterprise-Proven Scalability**: AWS pioneered cloud auto-scaling and provides the most sophisticated options for handling variable workloads, which directly addresses the scalability requirements.

5. **Market Leadership**: AWS's position as market leader means better long-term stability, more extensive documentation, larger community support, and a broader partner ecosystem.

## Key Advantages

1. **Maturity**: AWS services have been battle-tested at scale across numerous enterprises with similar requirements.

2. **Service Depth**: Each AWS service typically offers more features and configuration options than equivalents on other platforms.

3. **Ecosystem**: The extensive AWS partner network provides access to third-party tools, consulting services, and integration solutions.

4. **Documentation**: AWS provides the most comprehensive documentation and learning resources.

5. **Talent Availability**: Larger pool of AWS-experienced professionals in the job market for staffing the project.

## Potential Risks and Mitigation Strategies

1. **Cost Management Complexity**:
   - *Risk*: AWS's complex pricing structure could lead to unexpected costs.
   - *Mitigation*: Implement AWS Cost Explorer and Budgets from day one, establish a Cloud Center of Excellence (CCoE) focused on cost optimization, and consider engaging an AWS partner for cost optimization.

2. **Vendor Lock-in**:
   - *Risk*: Becoming overly dependent on AWS-specific services.
   - *Mitigation*: Adopt a multi-cloud design philosophy with containerization where possible, use infrastructure-as-code with provider-agnostic tools like Terraform, and implement a service abstraction layer for critical components.

3. **Learning Curve**:
   - *Risk*: Team may require significant training due to AWS complexity.
   - *Mitigation*: Invest in AWS certification training for the team, engage AWS professional services for initial architecture, and consider managed services to reduce operational complexity.

4. **Limited Microsoft Integration** (compared to Azure):
   - *Risk*: Less seamless integration with existing Microsoft technologies.
   - *Mitigation*: Use Azure Active Directory with AWS for identity management, and consider maintaining specific Microsoft-centric workloads in Azure as part of a multi-cloud strategy.

## Implementation Considerations

1. **Phased Approach**:
   - Months 1-2: Infrastructure setup, networking, and security foundations
   - Months 2-4: Core application migration and testing
   - Months 4-6: Performance optimization and full cutover

2. **Budget Allocation**:
   - Initial setup and training: $40,000
   - Annual infrastructure costs: ~$220,000
   - Professional services and support: $30,000
   - Total first year: ~$290,000 (including one-time costs)

3. **Required Expertise**:
   - AWS Solutions Architect to lead cloud architecture
   - DevOps engineer with AWS experience
   - Security specialist familiar with AWS security services
   - Consider AWS partner engagement for implementation support

4. **Governance Structure**:
   - Establish Cloud Center of Excellence (CCoE)
   - Implement tagging strategy for cost allocation
   - Define security standards and compliance controls
   - Create cloud usage policies and best practices

## Next Steps

1. **Immediate Actions** (Weeks 1-2):
   - Finalize AWS Enterprise Agreement
   - Engage AWS solutions architect for initial architecture review
   - Begin team training on AWS fundamentals
   - Set up AWS Organization with proper account structure

2. **Short-term Actions** (Weeks 3-6):
   - Create detailed migration plan with application dependencies
   - Deploy core networking and security infrastructure
   - Establish CI/CD pipelines for application deployment
   - Implement monitoring and logging framework

3. **Medium-term Actions** (Months 2-4):
   - Begin phased migration of application components
   - Implement automated testing in AWS environment
   - Conduct security assessments and compliance validation
   - Optimize initial deployments based on performance testing

4. **Long-term Strategy** (Months 4-6 and beyond):
   - Complete migration and decommission legacy systems
   - Implement cost optimization measures
   - Develop and test disaster recovery procedures
   - Begin exploration of multi-cloud capabilities for specific workloads

While AWS is recommended as the primary provider, maintaining a multi-cloud competency with strategic use of Azure (for Microsoft-specific workloads) and potentially GCP (for advanced analytics) will provide long-term flexibility and leverage each platform's unique strengths.

This recommendation balances immediate needs with long-term strategic considerations, providing both the stability of a primary cloud provider and the flexibility of a thoughtful multi-cloud approach.
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
                    "value": "We need to select a cloud provider for our new enterprise application requiring high availability, scalability, and robust security features."
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
        
        # Look for specific cloud providers
        providers_found = []
        for provider in ["AWS", "Amazon", "Azure", "Microsoft", "GCP", "Google"]:
            if provider in result["recommendation"]:
                providers_found.append(provider)
        
        self.assertTrue(len(providers_found) >= 3, f"Found only {len(providers_found)} providers: {providers_found}")
        
        # Print a summary
        print(f"\nIdentifyAlternativesTask Output:")
        print(f"- Providers identified: {', '.join(providers_found)}")
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
        recommended_provider = None
        for line in recommendation_result["recommendation"].split('\n'):
            if "recommend" in line.lower() and ":" in line:
                recommended_provider = line.split(":", 1)[1].strip()
                break
        
        self.assertIsNotNone(recommended_provider, "No clear recommendation found")
        print(f"\nFinal Recommended Cloud Provider: {recommended_provider}")
        
        # Verify the flow is logical (highest scored provider matches recommendation)
        highest_score = 0
        highest_provider = None
        
        # Extract scores from evaluation
        for line in evaluate_result["recommendation"].split('\n'):
            if "Weighted Score" in line and "AWS" in line:
                try:
                    score = float(line.split(":")[-1].strip())
                    if score > highest_score:
                        highest_score = score
                        highest_provider = "AWS"
                except ValueError:
                    pass
            elif "Weighted Score" in line and "Azure" in line:
                try:
                    score = float(line.split(":")[-1].strip())
                    if score > highest_score:
                        highest_score = score
                        highest_provider = "Azure"
                except ValueError:
                    pass                elif "Weighted Score" in line and "GCP" in line:
                    try:
                        score = float(line.split(":")[-1].strip())
                        if score > highest_score:
                            highest_score = score
                            highest_provider = "GCP"
                    except ValueError:
                        pass
            
            print(f"Highest scored provider: {highest_provider} with score {highest_score}")
            
            # Verify the recommended provider matches or includes the highest scored provider
        if highest_provider is not None and recommended_provider is not None:
            self.assertTrue(
                highest_provider in recommended_provider,
                f"Recommended provider '{recommended_provider}' doesn't match highest scored provider '{highest_provider}'"
            )
        else:
            # If no highest provider was determined, just check that we have a recommendation
            self.assertTrue(
                recommended_provider is not None and recommended_provider != "",
                f"No valid recommendation was produced: '{recommended_provider}'"
            )
        
        return recommendation_result


if __name__ == "__main__":
    unittest.main()
