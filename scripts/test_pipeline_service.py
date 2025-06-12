#!/usr/bin/env python3
"""
Test script for LLM-MCP Pipeline Service

This script tests the pipeline service functionality including:
1. Service health and info endpoints
2. Predefined pipeline execution 
3. Custom pipeline creation and validation
4. Error handling scenarios
"""

import json
import requests
import time
import sys
import os

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

class PipelineServiceTester:
    """Test suite for LLM-MCP Pipeline Service"""
    
    def __init__(self, base_url: str = "http://localhost:5204"):
        self.base_url = base_url
        self.test_results = {}
    
    def test_health_check(self):
        """Test service health endpoint"""
        print("🏥 Testing Health Check...")
        
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            
            if response.status_code == 200:
                health_data = response.json()
                print(f"✅ Service is healthy")
                print(f"   Service: {health_data.get('service')}")
                print(f"   Version: {health_data.get('version')}")
                print(f"   Available Pipelines: {health_data.get('available_pipelines')}")
                self.test_results["health_check"] = True
                return True
            else:
                print(f"❌ Health check failed: {response.status_code}")
                self.test_results["health_check"] = False
                return False
                
        except Exception as e:
            print(f"❌ Health check error: {e}")
            self.test_results["health_check"] = False
            return False
    
    def test_service_info(self):
        """Test service info endpoint"""
        print("\nℹ️ Testing Service Info...")
        
        try:
            response = requests.get(f"{self.base_url}/info", timeout=10)
            
            if response.status_code == 200:
                info_data = response.json()
                print(f"✅ Service info retrieved")
                print(f"   Description: {info_data.get('description')}")
                print(f"   Capabilities: {len(info_data.get('capabilities', []))}")
                print(f"   Available Pipelines: {len(info_data.get('available_pipelines', {}))}")
                
                # List available pipelines
                pipelines = info_data.get('available_pipelines', {})
                for name, config in pipelines.items():
                    print(f"   📋 {name}: {config.get('analysis_type')} using {config.get('mcp_service')}")
                
                self.test_results["service_info"] = True
                return True
            else:
                print(f"❌ Service info failed: {response.status_code}")
                self.test_results["service_info"] = False
                return False
                
        except Exception as e:
            print(f"❌ Service info error: {e}")
            self.test_results["service_info"] = False
            return False
    
    def test_list_pipelines(self):
        """Test pipeline listing endpoint"""
        print("\n📋 Testing Pipeline Listing...")
        
        try:
            response = requests.get(f"{self.base_url}/pipelines", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                pipelines = data.get('pipelines', {})
                
                print(f"✅ Found {len(pipelines)} pipelines:")
                for name, config in pipelines.items():
                    llm_service = config.get('llm_service', 'unknown')
                    mcp_service = config.get('mcp_service', 'unknown') 
                    tools = config.get('tools', [])
                    print(f"   🔧 {name}: {llm_service} + {mcp_service} ({len(tools)} tools)")
                
                self.test_results["list_pipelines"] = True
                return pipelines
            else:
                print(f"❌ Pipeline listing failed: {response.status_code}")
                self.test_results["list_pipelines"] = False
                return {}
                
        except Exception as e:
            print(f"❌ Pipeline listing error: {e}")
            self.test_results["list_pipelines"] = False
            return {}
    
    def test_decision_analysis_pipeline(self):
        """Test the decision_analysis predefined pipeline"""
        print("\n🔍 Testing Decision Analysis Pipeline...")
        
        # Sample decision analysis data
        test_data = {
            "task_name": "Test Decision Analysis",
            "task_description": "Test the decision analysis pipeline with sample data",
            "pipeline_name": "decision_analysis",
            "variables": {
                "alternatives": [
                    {"name": "Alternative A", "cost": 100000, "performance": 85, "risk": "medium"},
                    {"name": "Alternative B", "cost": 150000, "performance": 92, "risk": "low"},
                    {"name": "Alternative C", "cost": 80000, "performance": 78, "risk": "high"}
                ],
                "criteria": [
                    {"name": "cost", "weight": 0.3, "type": "minimize"},
                    {"name": "performance", "weight": 0.5, "type": "maximize"},
                    {"name": "risk", "weight": 0.2, "type": "minimize"}
                ],
                "data": [85, 92, 78, 88, 90, 85, 87, 89, 91, 86],  # Sample performance data
                "context": "Software system selection for enterprise deployment",
                "decision_description": "Select the best software system for our enterprise needs"
            },
            "process_instance_id": f"test_proc_{int(time.time())}"
        }
        
        try:
            print(f"   Sending request with {len(test_data['variables']['alternatives'])} alternatives...")
            response = requests.post(
                f"{self.base_url}/process_task", 
                json=test_data,
                timeout=120
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Decision analysis completed successfully")
                
                # Extract key results
                pipeline_info = result.get("pipeline_info", {})
                analysis_result = result.get("result", {})
                
                print(f"   Pipeline: {pipeline_info.get('pipeline_name')}")
                print(f"   Analysis Type: {analysis_result.get('analysis_type')}")
                
                # Check if both LLM and MCP analysis were performed
                llm_analysis = analysis_result.get("llm_analysis")
                mathematical_analysis = analysis_result.get("mathematical_analysis")
                
                if llm_analysis:
                    print(f"   ✅ LLM Analysis: Available")
                    processed_by = llm_analysis.get("processed_by", "Unknown")
                    print(f"      Processed by: {processed_by}")
                
                if mathematical_analysis:
                    print(f"   ✅ Mathematical Analysis: Available")
                    mcp_info = mathematical_analysis.get("mcp_service_info", {})
                    service_name = mcp_info.get("service_name", "Unknown")
                    tools_available = mcp_info.get("tools_available", [])
                    print(f"      MCP Service: {service_name}")
                    print(f"      Tools Available: {len(tools_available)}")
                
                metadata = analysis_result.get("metadata", {})
                print(f"   Services Used: {metadata.get('llm_service')} + {metadata.get('mcp_service')}")
                
                self.test_results["decision_analysis"] = True
                return True
            else:
                print(f"❌ Decision analysis failed: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('message', 'Unknown error')}")
                except:
                    print(f"   Response: {response.text}")
                self.test_results["decision_analysis"] = False
                return False
                
        except Exception as e:
            print(f"❌ Decision analysis error: {e}")
            self.test_results["decision_analysis"] = False
            return False
    
    def test_stakeholder_analysis_pipeline(self):
        """Test the stakeholder_analysis predefined pipeline"""
        print("\n👥 Testing Stakeholder Analysis Pipeline...")
        
        test_data = {
            "task_name": "Test Stakeholder Analysis",
            "task_description": "Test stakeholder network analysis capabilities",
            "pipeline_name": "stakeholder_analysis",
            "variables": {
                "stakeholders": [
                    {"name": "CEO", "influence": "high", "interest": "high"},
                    {"name": "CTO", "influence": "high", "interest": "high"},
                    {"name": "End Users", "influence": "medium", "interest": "high"},
                    {"name": "Finance Team", "influence": "medium", "interest": "medium"}
                ],
                "relationships": [
                    {"from": "CEO", "to": "CTO", "type": "reports_to"},
                    {"from": "CTO", "to": "End Users", "type": "serves"},
                    {"from": "Finance Team", "to": "CEO", "type": "advises"}
                ],
                "context": "Software system implementation project"
            }
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/process_task",
                json=test_data,
                timeout=120
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Stakeholder analysis completed")
                
                analysis_result = result.get("result", {})
                print(f"   Analysis Type: {analysis_result.get('analysis_type')}")
                
                # Check for graph analysis results
                mathematical_analysis = analysis_result.get("mathematical_analysis")
                if mathematical_analysis:
                    print(f"   ✅ Graph analysis performed")
                
                self.test_results["stakeholder_analysis"] = True
                return True
            else:
                print(f"❌ Stakeholder analysis failed: {response.status_code}")
                self.test_results["stakeholder_analysis"] = False
                return False
                
        except Exception as e:
            print(f"❌ Stakeholder analysis error: {e}")
            self.test_results["stakeholder_analysis"] = False
            return False
    
    def test_custom_pipeline_creation(self):
        """Test creating a custom pipeline"""
        print("\n🔧 Testing Custom Pipeline Creation...")
        
        custom_config = {
            "pipeline_name": "test_custom_pipeline",
            "llm_config": {
                "service_name": "dadm-openai-assistant",
                "service_type": "assistant",
                "endpoint": "http://localhost:5000",
                "timeout": 120
            },
            "mcp_config": {
                "server_name": "statistical",
                "service_name": "mcp-statistical-service",
                "tools": ["calculate_statistics"],
                "endpoint": "http://localhost:5201",
                "timeout": 60
            },
            "output_format": "structured",
            "analysis_type": "custom_test",
            "enable_reasoning": True,
            "enable_mathematical_analysis": True
        }
        
        try:
            # First validate the configuration
            print("   Validating custom configuration...")
            validate_response = requests.post(
                f"{self.base_url}/pipelines/validate",
                json=custom_config,
                timeout=30
            )
            
            if validate_response.status_code == 200:
                validation = validate_response.json().get("validation", {})
                is_valid = validation.get("valid", False)
                issues = validation.get("issues", [])
                warnings = validation.get("warnings", [])
                
                print(f"   Configuration Valid: {is_valid}")
                if issues:
                    print(f"   Issues: {len(issues)}")
                    for issue in issues:
                        print(f"      ⚠️ {issue}")
                if warnings:
                    print(f"   Warnings: {len(warnings)}")
                    for warning in warnings:
                        print(f"      ⚠️ {warning}")
                
                if is_valid:
                    # Create the pipeline
                    print("   Creating custom pipeline...")
                    create_response = requests.post(
                        f"{self.base_url}/pipelines/create",
                        json=custom_config,
                        timeout=30
                    )
                    
                    if create_response.status_code == 200:
                        create_result = create_response.json()
                        pipeline_id = create_result.get("pipeline_id")
                        print(f"✅ Custom pipeline created: {pipeline_id}")
                        
                        self.test_results["custom_pipeline"] = True
                        return True
                    else:
                        print(f"❌ Pipeline creation failed: {create_response.status_code}")
                        self.test_results["custom_pipeline"] = False
                        return False
                else:
                    print(f"⚠️ Pipeline configuration is invalid, skipping creation")
                    self.test_results["custom_pipeline"] = False
                    return False
            else:
                print(f"❌ Pipeline validation failed: {validate_response.status_code}")
                self.test_results["custom_pipeline"] = False
                return False
                
        except Exception as e:
            print(f"❌ Custom pipeline creation error: {e}")
            self.test_results["custom_pipeline"] = False
            return False
    
    def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n🚫 Testing Error Handling...")
        
        # Test invalid pipeline name
        try:
            invalid_data = {
                "task_name": "Invalid Pipeline Test",
                "pipeline_name": "nonexistent_pipeline",
                "variables": {"test": "data"}
            }
            
            response = requests.post(
                f"{self.base_url}/process_task",
                json=invalid_data,
                timeout=30
            )
            
            if response.status_code != 200:
                print(f"✅ Invalid pipeline properly rejected (status: {response.status_code})")
                self.test_results["error_handling"] = True
                return True
            else:
                print(f"❌ Invalid pipeline was accepted (should have failed)")
                self.test_results["error_handling"] = False
                return False
                
        except Exception as e:
            print(f"❌ Error handling test failed: {e}")
            self.test_results["error_handling"] = False
            return False
    
    def run_all_tests(self):
        """Run all tests and provide summary"""
        print("🧪 Starting LLM-MCP Pipeline Service Tests")
        print("=" * 60)
        
        # Basic connectivity tests
        if not self.test_health_check():
            print("\n❌ Service is not available. Please start the service first.")
            return False
        
        self.test_service_info()
        self.test_list_pipelines()
        
        # Functional tests
        self.test_decision_analysis_pipeline()
        self.test_stakeholder_analysis_pipeline()
        self.test_custom_pipeline_creation()
        self.test_error_handling()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 Test Results Summary")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result)
        
        for test_name, result in self.test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
        
        print(f"\nResults: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All tests passed! Pipeline service is working correctly.")
            return True
        else:
            print("⚠️ Some tests failed. Check the service configuration and dependencies.")
            return False


def main():
    """Main test execution"""
    tester = PipelineServiceTester()
    success = tester.run_all_tests()
    return 0 if success else 1


if __name__ == "__main__":
    exit(main())
