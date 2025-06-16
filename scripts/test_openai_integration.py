#!/usr/bin/env python3
"""
Test script for OpenAI integration via Analysis Service
Tests the HTTP connectivity and basic OpenAI functionality
"""

import requests
import json
import time
import sys
from datetime import datetime
from typing import Dict, Any

class OpenAIIntegrationTester:
    """Test OpenAI service integration through analysis service"""
    
    def __init__(self, analysis_service_url: str = "http://localhost:8002"):
        self.analysis_service_url = analysis_service_url
        self.session = requests.Session()
        self.test_results = []
    
    def test_service_health(self) -> bool:
        """Test if analysis service is running"""
        try:
            response = self.session.get(f"{self.analysis_service_url}/health", timeout=10)
            if response.status_code == 200:
                print("✅ Analysis service is healthy")
                return True
            else:
                print(f"❌ Analysis service health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Cannot connect to analysis service: {e}")
            return False
    
    def test_basic_openai_connectivity(self) -> Dict[str, Any]:
        """Test basic OpenAI connectivity through analysis service"""
        print("\n🔍 Testing basic OpenAI connectivity...")
        
        test_request = {
            "analysis_type": "connectivity_test",
            "data_sources": {
                "question": "What is the capital of France?",
                "test_type": "basic_connectivity"
            },
            "analysis_parameters": {
                "task": "simple_response",
                "max_tokens": 100
            },
            "execution_tools": [],  # LLM only
            "llm_model": "gpt-4",
            "timeout": 60
        }
        
        start_time = time.time()
        try:
            response = self.session.post(
                f"{self.analysis_service_url}/analyze/integrated",
                json=test_request,
                timeout=70,
                headers={"Content-Type": "application/json"}
            )
            
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                
                test_result = {
                    "test_name": "basic_openai_connectivity",
                    "status": "SUCCESS" if result.get("status") == "completed" else "FAILED",
                    "response_time": response_time,
                    "execution_id": result.get("execution_id"),
                    "llm_response": result.get("llm_analysis"),
                    "error": result.get("error"),
                    "details": result
                }
                
                if test_result["status"] == "SUCCESS":
                    print(f"✅ OpenAI connectivity test passed ({response_time:.2f}s)")
                    if result.get("llm_analysis"):
                        print(f"📝 OpenAI Response: {str(result['llm_analysis'])[:100]}...")
                else:
                    print(f"❌ OpenAI connectivity test failed: {result.get('error', 'Unknown error')}")
                
                self.test_results.append(test_result)
                return test_result
                
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                print(f"❌ Analysis service request failed: {error_msg}")
                
                test_result = {
                    "test_name": "basic_openai_connectivity",
                    "status": "FAILED",
                    "response_time": response_time,
                    "error": error_msg
                }
                self.test_results.append(test_result)
                return test_result
                
        except Exception as e:
            response_time = time.time() - start_time
            error_msg = str(e)
            print(f"❌ OpenAI connectivity test failed: {error_msg}")
            
            test_result = {
                "test_name": "basic_openai_connectivity",
                "status": "FAILED",
                "response_time": response_time,
                "error": error_msg
            }
            self.test_results.append(test_result)
            return test_result
    
    def test_different_models(self) -> Dict[str, Any]:
        """Test different OpenAI models"""
        print("\n🔍 Testing different OpenAI models...")
        
        models_to_test = ["gpt-4", "gpt-3.5-turbo"]
        model_results = {}
        
        for model in models_to_test:
            print(f"  Testing model: {model}")
            
            test_request = {
                "analysis_type": "model_test",
                "data_sources": {
                    "question": "Explain the concept of machine learning in one sentence.",
                    "test_type": f"model_test_{model.replace('-', '_')}"
                },
                "analysis_parameters": {
                    "task": "concise_explanation",
                    "max_tokens": 50
                },
                "execution_tools": [],
                "llm_model": model,
                "timeout": 30
            }
            
            start_time = time.time()
            try:
                response = self.session.post(
                    f"{self.analysis_service_url}/analyze/integrated",
                    json=test_request,
                    timeout=40,
                    headers={"Content-Type": "application/json"}
                )
                
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("status") == "completed":
                        print(f"    ✅ {model} test passed ({response_time:.2f}s)")
                        model_results[model] = {
                            "status": "SUCCESS",
                            "response_time": response_time,
                            "response": result.get("llm_analysis")
                        }
                    else:
                        print(f"    ❌ {model} test failed: {result.get('error')}")
                        model_results[model] = {
                            "status": "FAILED",
                            "response_time": response_time,
                            "error": result.get("error")
                        }
                else:
                    print(f"    ❌ {model} test failed: HTTP {response.status_code}")
                    model_results[model] = {
                        "status": "FAILED",
                        "response_time": response_time,
                        "error": f"HTTP {response.status_code}"
                    }
                    
            except Exception as e:
                response_time = time.time() - start_time
                print(f"    ❌ {model} test failed: {e}")
                model_results[model] = {
                    "status": "FAILED",
                    "response_time": response_time,
                    "error": str(e)
                }
        
        test_result = {
            "test_name": "model_comparison",
            "results": model_results,
            "summary": f"Tested {len(models_to_test)} models, {sum(1 for r in model_results.values() if r['status'] == 'SUCCESS')} succeeded"
        }
        
        self.test_results.append(test_result)
        return test_result
    
    def test_error_handling(self) -> Dict[str, Any]:
        """Test error handling with invalid requests"""
        print("\n🔍 Testing error handling...")
        
        # Test with invalid model
        test_request = {
            "analysis_type": "error_test",
            "data_sources": {
                "question": "Test question",
                "test_type": "invalid_model_test"
            },
            "analysis_parameters": {
                "task": "simple_response"
            },
            "execution_tools": [],
            "llm_model": "invalid-model-name",
            "timeout": 30
        }
        
        try:
            response = self.session.post(
                f"{self.analysis_service_url}/analyze/integrated",
                json=test_request,
                timeout=40,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code in [200, 400, 422]:
                result = response.json()
                if result.get("status") == "failed" or result.get("error"):
                    print("✅ Error handling test passed - invalid model properly rejected")
                    error_test_result = {
                        "test_name": "error_handling",
                        "status": "SUCCESS",
                        "message": "Error properly handled",
                        "error_response": result
                    }
                else:
                    print("⚠️  Error handling test warning - invalid model not rejected")
                    error_test_result = {
                        "test_name": "error_handling",
                        "status": "WARNING",
                        "message": "Invalid model not properly rejected",
                        "response": result
                    }
            else:
                print(f"✅ Error handling test passed - HTTP error {response.status_code}")
                error_test_result = {
                    "test_name": "error_handling",
                    "status": "SUCCESS",
                    "message": f"HTTP error properly returned: {response.status_code}"
                }
                
        except Exception as e:
            print(f"❌ Error handling test failed: {e}")
            error_test_result = {
                "test_name": "error_handling",
                "status": "FAILED",
                "error": str(e)
            }
        
        self.test_results.append(error_test_result)
        return error_test_result
    
    def run_full_test_suite(self) -> Dict[str, Any]:
        """Run complete test suite"""
        print("🚀 Starting OpenAI Integration Test Suite")
        print(f"📍 Target: {self.analysis_service_url}")
        print(f"⏰ Started at: {datetime.now().isoformat()}")
        print("=" * 60)
        
        suite_start = time.time()
        
        # Test 1: Service Health
        if not self.test_service_health():
            print("\n❌ Cannot proceed - Analysis service is not available")
            return {"status": "ABORTED", "reason": "Service unavailable"}
        
        # Test 2: Basic OpenAI Connectivity
        basic_test = self.test_basic_openai_connectivity()
        
        # Test 3: Model Comparison (only if basic test passed)
        if basic_test.get("status") == "SUCCESS":
            model_test = self.test_different_models()
        else:
            print("\n⏭️  Skipping model tests - basic connectivity failed")
            model_test = {"status": "SKIPPED", "reason": "Basic connectivity failed"}
        
        # Test 4: Error Handling
        error_test = self.test_error_handling()
        
        suite_time = time.time() - suite_start
        
        # Generate summary
        successful_tests = sum(1 for result in self.test_results if result.get("status") == "SUCCESS")
        total_tests = len(self.test_results)
        
        summary = {
            "test_suite": "OpenAI Integration Tests",
            "timestamp": datetime.now().isoformat(),
            "duration": suite_time,
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "success_rate": (successful_tests / total_tests * 100) if total_tests > 0 else 0,
            "results": self.test_results
        }
        
        print("\n" + "=" * 60)
        print("📊 TEST SUITE SUMMARY")
        print(f"✅ Successful tests: {successful_tests}/{total_tests}")
        print(f"📈 Success rate: {summary['success_rate']:.1f}%")
        print(f"⏱️  Total time: {suite_time:.2f}s")
        
        if successful_tests == total_tests:
            print("🎉 All tests passed! OpenAI integration is working correctly.")
        elif successful_tests > 0:
            print("⚠️  Some tests failed. Check individual test results for details.")
        else:
            print("❌ All tests failed. OpenAI integration needs attention.")
        
        return summary

def main():
    """Main test execution"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test OpenAI integration via Analysis Service")
    parser.add_argument("--url", default="http://localhost:8002", 
                       help="Analysis service URL (default: http://localhost:8002)")
    parser.add_argument("--output", help="Save results to JSON file")
    parser.add_argument("--quiet", action="store_true", help="Suppress verbose output")
    
    args = parser.parse_args()
    
    # Redirect output if quiet mode
    if args.quiet:
        import io
        old_stdout = sys.stdout
        sys.stdout = io.StringIO()
    
    try:
        tester = OpenAIIntegrationTester(args.url)
        results = tester.run_full_test_suite()
        
        if args.quiet:
            sys.stdout = old_stdout
            # Only print summary in quiet mode
            print(f"OpenAI Integration Test: {results['successful_tests']}/{results['total_tests']} tests passed ({results['success_rate']:.1f}%)")
        
        # Save results if requested
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(results, f, indent=2, default=str)
            print(f"📁 Results saved to {args.output}")
        
        # Exit with appropriate code
        if results['success_rate'] == 100:
            sys.exit(0)
        elif results['success_rate'] > 0:
            sys.exit(1)  # Partial failure
        else:
            sys.exit(2)  # Complete failure
            
    except KeyboardInterrupt:
        if args.quiet:
            sys.stdout = old_stdout
        print("\n⏹️  Test interrupted by user")
        sys.exit(130)
    except Exception as e:
        if args.quiet:
            sys.stdout = old_stdout
        print(f"💥 Test suite failed with exception: {e}")
        sys.exit(3)

if __name__ == "__main__":
    main()
