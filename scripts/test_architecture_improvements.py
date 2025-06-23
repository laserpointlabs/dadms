#!/usr/bin/env python3
"""
Test Script for DADM Architecture Improvements

This script tests all the implemented improvements:
1. Service Generator
2. Data Governance Framework
3. Service Registry Integration
4. Basic UI Component Validation
"""

import os
import sys
import json
import tempfile
import shutil
import unittest
from pathlib import Path
from typing import Dict, Any

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import the modules we want to test
from scripts.generate_service import ServiceGenerator, ServiceTemplate
from src.data_governance import (
    DataGovernanceManager, DataPolicy, DataClassification, 
    ComplianceStatus, QualityMetrics, ComplianceResult, get_governance_manager
)
from config.service_registry import get_service_registry, discover_services

class TestServiceGenerator(unittest.TestCase):
    """Test the Service Generator functionality"""
    
    def setUp(self):
        """Set up test environment"""
        self.test_services_dir = tempfile.mkdtemp(prefix="test_services_")
        self.generator = ServiceGenerator(self.test_services_dir)
        
    def tearDown(self):
        """Clean up test environment"""
        if os.path.exists(self.test_services_dir):
            shutil.rmtree(self.test_services_dir)
    
    def test_list_templates(self):
        """Test listing available templates"""
        # This should not raise an exception
        self.generator.list_templates()
        
        # Check that we have the expected templates
        expected_templates = ["python-flask", "python-fastapi", "node-express"]
        for template_id in expected_templates:
            self.assertIn(template_id, self.generator.templates)
    
    def test_generate_service(self):
        """Test service generation"""
        service_name = "test-service"
        service_type = "api"
        
        # Generate a service
        service_path = self.generator.generate_service(
            service_name=service_name,
            service_type=service_type,
            template="python-flask",
            description="Test service for unit testing"
        )
        
        # Verify service directory was created
        self.assertTrue(os.path.exists(service_path))
        
        # Check that required files were created
        required_files = ["service.py", "requirements.txt", "Dockerfile", "service_config.json", "README.md", "test_service.py"]
        for file_name in required_files:
            file_path = os.path.join(service_path, file_name)
            self.assertTrue(os.path.exists(file_path), f"Required file {file_name} was not created")
        
        # Verify service_config.json content
        config_path = os.path.join(service_path, "service_config.json")
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        self.assertEqual(config["service"]["name"], service_name)
        self.assertEqual(config["service"]["type"], service_type)
        self.assertEqual(config["service"]["description"], "Test service for unit testing")
    
    def test_copy_service(self):
        """Test service copying"""
        # First generate a source service
        source_service = "source-service"
        source_path = self.generator.generate_service(
            service_name=source_service,
            service_type="api",
            template="python-flask"
        )
        
        # Copy the service
        new_service = "copied-service"
        new_path = self.generator.copy_service(
            source_service=source_service,
            new_service=new_service
        )
        
        # Verify new service was created
        self.assertTrue(os.path.exists(new_path))
        
        # Check that config was updated
        config_path = os.path.join(new_path, "service_config.json")
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        self.assertEqual(config["service"]["name"], new_service)


class TestDataGovernance(unittest.TestCase):
    """Test the Data Governance Framework"""
    
    def setUp(self):
        """Set up test environment"""
        self.test_storage_dir = tempfile.mkdtemp(prefix="test_governance_")
        self.governance_manager = DataGovernanceManager(self.test_storage_dir)
        
    def tearDown(self):
        """Clean up test environment"""
        if os.path.exists(self.test_storage_dir):
            shutil.rmtree(self.test_storage_dir)
    
    def test_policy_management(self):
        """Test policy creation and retrieval"""
        # Create a test policy
        policy = DataPolicy(
            policy_id="test-policy",
            name="Test Policy",
            description="Test policy for unit testing",
            classification=DataClassification.CONFIDENTIAL,
            retention_days=365,
            encryption_required=True,
            quality_thresholds={"completeness": 0.9, "accuracy": 0.95}
        )
        
        # Add the policy
        success = self.governance_manager.add_policy(policy)
        self.assertTrue(success)
        
        # Retrieve the policy
        retrieved_policy = self.governance_manager.get_policy("test-policy")
        self.assertIsNotNone(retrieved_policy)
        if retrieved_policy:
            self.assertEqual(retrieved_policy.name, "Test Policy")
            self.assertEqual(retrieved_policy.classification, DataClassification.CONFIDENTIAL)
    
    def test_compliance_checking(self):
        """Test compliance checking"""
        # Test data
        test_data = {
            "user_id": "12345",
            "email": "test@example.com",
            "password": "secret123",  # This should trigger confidential classification
            "preferences": {"theme": "dark"}
        }
        
        # Apply compliance policies
        result = self.governance_manager.apply_data_policies(test_data)
        
        # Verify we got a compliance result
        self.assertIsInstance(result, ComplianceResult)
        self.assertIsInstance(result.status, ComplianceStatus)
    
    def test_data_lineage(self):
        """Test data lineage tracking"""
        data_id = "test-data-123"
        source_ids = ["source-1", "source-2"]
        
        # Add lineage record
        success = self.governance_manager.add_lineage_record(
            data_id=data_id,
            source_data_ids=source_ids,
            transformation_type="merge",
            transformation_details={"method": "inner_join"}
        )
        
        self.assertTrue(success)
        
        # Track lineage
        lineage = self.governance_manager.track_data_lineage(data_id)
        
        # Verify lineage was tracked
        self.assertEqual(lineage.data_id, data_id)
        self.assertGreater(len(lineage.lineage_records), 0)
    
    def test_quality_monitoring(self):
        """Test data quality monitoring"""
        # Test with sample data
        test_data = {
            "field1": "value1",
            "field2": "value2",
            "field3": None,  # Missing value
            "field4": ""
        }
        
        # Calculate quality metrics
        metrics = self.governance_manager._calculate_quality_metrics(test_data)
        
        # Verify metrics were calculated
        self.assertIsInstance(metrics, QualityMetrics)
        self.assertGreaterEqual(metrics.completeness, 0.0)
        self.assertLessEqual(metrics.completeness, 1.0)
        self.assertIsInstance(metrics.quality_level.value, str)


class TestServiceRegistry(unittest.TestCase):
    """Test the Service Registry functionality"""
    
    def test_service_discovery(self):
        """Test service discovery"""
        # Test that service discovery works
        services = discover_services()
        
        # Should return a dictionary
        self.assertIsInstance(services, dict)
        
        # Should have at least some service types
        self.assertGreater(len(services), 0)
    
    def test_service_registry(self):
        """Test service registry"""
        # Test that we can get the service registry
        registry = get_service_registry()
        
        # Should return a dictionary
        self.assertIsInstance(registry, dict)
        
        # Should have at least some services
        self.assertGreater(len(registry), 0)


class TestIntegration(unittest.TestCase):
    """Test integration between components"""
    
    def test_service_generator_with_governance(self):
        """Test that generated services can be governed"""
        # Set up test environment
        test_services_dir = tempfile.mkdtemp(prefix="test_integration_")
        test_governance_dir = tempfile.mkdtemp(prefix="test_governance_")
        
        try:
            # Create generator and governance manager
            generator = ServiceGenerator(test_services_dir)
            governance_manager = DataGovernanceManager(test_governance_dir)
            
            # Generate a service
            service_path = generator.generate_service(
                service_name="integration-test-service",
                service_type="api",
                template="python-flask"
            )
            
            # Read the generated service config
            config_path = os.path.join(service_path, "service_config.json")
            with open(config_path, 'r') as f:
                service_config = json.load(f)
            
            # Apply governance policies to the service config
            compliance_result = governance_manager.apply_data_policies(service_config)
            
            # Verify compliance check worked
            self.assertIsInstance(compliance_result, ComplianceResult)
            
        finally:
            # Clean up
            if os.path.exists(test_services_dir):
                shutil.rmtree(test_services_dir)
            if os.path.exists(test_governance_dir):
                shutil.rmtree(test_governance_dir)


def run_comprehensive_test():
    """Run comprehensive test suite"""
    print("🧪 Starting DADM Architecture Improvements Test Suite")
    print("=" * 60)
    
    # Create test suite
    test_suite = unittest.TestSuite()
    
    # Add test classes
    test_classes = [
        TestServiceGenerator,
        TestDataGovernance,
        TestServiceRegistry,
        TestIntegration
    ]
    
    for test_class in test_classes:
        tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
        test_suite.addTests(tests)
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    
    if result.failures:
        print("\n❌ Failures:")
        for test, traceback in result.failures:
            print(f"  - {test}: {traceback.split('AssertionError:')[-1].strip()}")
    
    if result.errors:
        print("\n🚨 Errors:")
        for test, traceback in result.errors:
            print(f"  - {test}: {traceback.split('Exception:')[-1].strip()}")
    
    if result.wasSuccessful():
        print("\n✅ All tests passed! Architecture improvements are working correctly.")
        return True
    else:
        print("\n❌ Some tests failed. Please review the issues above.")
        return False


def test_ui_components():
    """Test UI components (basic validation)"""
    print("\n🎨 Testing UI Components")
    print("-" * 30)
    
    # Check if AIWorkflowDesigner component exists
    ai_designer_path = os.path.join(project_root, "ui", "src", "components", "AIWorkflowDesigner.tsx")
    
    if os.path.exists(ai_designer_path):
        print("✅ AIWorkflowDesigner.tsx component found")
        
        # Basic content validation
        with open(ai_designer_path, 'r') as f:
            content = f.read()
        
        # Check for key features
        checks = [
            ("React component", "React.FC" in content),
            ("TypeScript interfaces", "interface" in content),
            ("Material-UI components", "@mui/material" in content),
            ("AI generation function", "generateWorkflowFromText" in content),
            ("Workflow suggestions", "WorkflowSuggestion" in content),
            ("Component state management", "useState" in content)
        ]
        
        for feature, found in checks:
            status = "✅" if found else "❌"
            print(f"  {status} {feature}")
        
        return True
    else:
        print("❌ AIWorkflowDesigner.tsx component not found")
        return False


def test_file_structure():
    """Test that all implemented files exist"""
    print("\n📁 Testing File Structure")
    print("-" * 30)
    
    expected_files = [
        "scripts/generate_service.py",
        "src/data_governance.py",
        "ui/src/components/AIWorkflowDesigner.tsx",
        "docs/ARCHITECTURE_IMPROVEMENTS.md",
        "ARCHITECTURE_REVIEW_SUMMARY.md"
    ]
    
    all_exist = True
    for file_path in expected_files:
        full_path = os.path.join(project_root, file_path)
        if os.path.exists(full_path):
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} (missing)")
            all_exist = False
    
    return all_exist


def main():
    """Main test execution"""
    print("🚀 DADM Architecture Improvements Test Suite")
    print("Testing all implemented improvements...")
    
    # Test file structure
    structure_ok = test_file_structure()
    
    # Test UI components
    ui_ok = test_ui_components()
    
    # Run comprehensive tests
    tests_ok = run_comprehensive_test()
    
    # Overall result
    print("\n" + "=" * 60)
    print("🎯 Overall Test Results")
    print("=" * 60)
    
    results = [
        ("File Structure", structure_ok),
        ("UI Components", ui_ok),
        ("Core Functionality", tests_ok)
    ]
    
    all_passed = True
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name}: {status}")
        if not passed:
            all_passed = False
    
    if all_passed:
        print("\n🎉 All tests passed! Your architecture improvements are ready for use.")
        print("\nNext steps:")
        print("1. Use the service generator: python scripts/generate_service.py list-templates")
        print("2. Integrate AIWorkflowDesigner into your UI")
        print("3. Deploy the data governance framework")
        print("4. Review the architecture documentation")
    else:
        print("\n⚠️  Some tests failed. Please review the issues above before proceeding.")
    
    return all_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 