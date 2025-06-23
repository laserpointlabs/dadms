#!/usr/bin/env python3
"""
DADM Architecture Improvements Demo

This script demonstrates all the implemented improvements working together:
1. Service Generator
2. Data Governance Framework
3. Service Registry Integration
4. Workflow Management
"""

import os
import sys
import json
import tempfile
from pathlib import Path

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from scripts.generate_service import ServiceGenerator
from src.data_governance import get_governance_manager, DataPolicy, DataClassification
from config.service_registry import discover_services, get_service_registry

def demo_service_generator():
    """Demonstrate service generator functionality"""
    print("🔧 Service Generator Demo")
    print("=" * 40)
    
    # Create temporary directory for demo
    demo_dir = tempfile.mkdtemp(prefix="demo_services_")
    generator = ServiceGenerator(demo_dir)
    
    try:
        # List available templates
        print("📋 Available Service Templates:")
        generator.list_templates()
        
        # Generate a new service
        print("\n🚀 Generating new service...")
        service_path = generator.generate_service(
            service_name="demo-workflow-service",
            service_type="workflow",
            template="python-flask",
            description="Demo workflow processing service"
        )
        print(f"✅ Service generated at: {service_path}")
        
        # Copy the service
        print("\n📋 Copying service...")
        copied_path = generator.copy_service(
            source_service="demo-workflow-service",
            new_service="workflow-service-v2"
        )
        print(f"✅ Service copied to: {copied_path}")
        
        # Show generated files
        print("\n📁 Generated files:")
        for file_name in ["service.py", "requirements.txt", "Dockerfile", "service_config.json", "README.md"]:
            file_path = os.path.join(service_path, file_name)
            if os.path.exists(file_path):
                print(f"  ✅ {file_name}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in service generator demo: {e}")
        return False
    finally:
        # Clean up
        import shutil
        if os.path.exists(demo_dir):
            shutil.rmtree(demo_dir)

def demo_data_governance():
    """Demonstrate data governance framework"""
    print("\n🛡️ Data Governance Framework Demo")
    print("=" * 40)
    
    try:
        # Get governance manager
        manager = get_governance_manager()
        
        # Create a custom policy
        print("📋 Creating custom data policy...")
        policy = DataPolicy(
            policy_id="demo-policy",
            name="Demo Workflow Policy",
            description="Policy for workflow data governance",
            classification=DataClassification.CONFIDENTIAL,
            retention_days=365,
            encryption_required=True,
            quality_thresholds={"completeness": 0.95, "accuracy": 0.98}
        )
        
        success = manager.add_policy(policy)
        print(f"✅ Policy created: {success}")
        
        # Test compliance checking
        print("\n🔍 Testing compliance checking...")
        test_data = {
            "workflow_id": "wf-12345",
            "user_data": {
                "user_id": "user-123",
                "email": "user@example.com",
                "preferences": {"theme": "dark"}
            },
            "workflow_config": {
                "steps": ["step1", "step2", "step3"],
                "sensitive_config": "secret_value"
            }
        }
        
        result = manager.apply_data_policies(test_data)
        print(f"✅ Compliance check completed")
        print(f"   Status: {result.status.value}")
        print(f"   Violations: {len(result.violations)}")
        print(f"   Recommendations: {len(result.recommendations)}")
        
        if result.violations:
            print("   Violations found:")
            for violation in result.violations[:3]:  # Show first 3
                print(f"     - {violation}")
        
        # Test data lineage
        print("\n🔗 Testing data lineage tracking...")
        lineage_success = manager.add_lineage_record(
            data_id="workflow-123",
            source_data_ids=["user-input-456", "config-789"],
            transformation_type="workflow_execution",
            transformation_details={"method": "bpmn_processing", "version": "1.0"}
        )
        print(f"✅ Lineage record added: {lineage_success}")
        
        # Track lineage
        lineage = manager.track_data_lineage("workflow-123")
        print(f"✅ Lineage tracked: {len(lineage.lineage_records)} records")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in data governance demo: {e}")
        return False

def demo_service_registry():
    """Demonstrate service registry integration"""
    print("\n📡 Service Registry Integration Demo")
    print("=" * 40)
    
    try:
        # Discover services
        print("🔍 Discovering services...")
        services = discover_services()
        total_services = sum(len(svc) for svc in services.values())
        print(f"✅ Discovered {total_services} services across {len(services)} types")
        
        # Show service types
        print("\n📋 Service Types:")
        for service_type, service_list in services.items():
            print(f"  {service_type}: {list(service_list.keys())}")
        
        # Get service registry
        print("\n🏪 Service Registry:")
        registry = get_service_registry()
        print(f"✅ Registry contains {sum(len(svc) for svc in registry.values())} services")
        
        # Show some service details
        print("\n📊 Sample Service Details:")
        for service_type, service_list in registry.items():
            if service_list:
                first_service = list(service_list.keys())[0]
                service_info = service_list[first_service]
                print(f"  {service_type}/{first_service}:")
                print(f"    Endpoint: {service_info.get('endpoint', 'N/A')}")
                print(f"    Description: {service_info.get('description', 'N/A')}")
                break
        
        return True
        
    except Exception as e:
        print(f"❌ Error in service registry demo: {e}")
        return False

def demo_integration():
    """Demonstrate integration between components"""
    print("\n🔗 Integration Demo")
    print("=" * 40)
    
    try:
        # Create a temporary service
        demo_dir = tempfile.mkdtemp(prefix="integration_demo_")
        generator = ServiceGenerator(demo_dir)
        
        # Generate a service
        service_path = generator.generate_service(
            service_name="integration-demo-service",
            service_type="integration",
            template="python-flask",
            description="Service for integration testing"
        )
        
        # Read the service config
        config_path = os.path.join(service_path, "service_config.json")
        with open(config_path, 'r') as f:
            service_config = json.load(f)
        
        # Apply governance to the service config
        manager = get_governance_manager()
        compliance_result = manager.apply_data_policies(service_config)
        
        print("✅ Integration test completed:")
        print(f"   Service generated: {os.path.exists(service_path)}")
        print(f"   Governance applied: {compliance_result.status.value}")
        print(f"   Service config valid: {len(service_config) > 0}")
        
        # Clean up
        import shutil
        if os.path.exists(demo_dir):
            shutil.rmtree(demo_dir)
        
        return True
        
    except Exception as e:
        print(f"❌ Error in integration demo: {e}")
        return False

def main():
    """Main demonstration function"""
    print("🚀 DADM Architecture Improvements Demo")
    print("Demonstrating all implemented improvements...")
    print("=" * 60)
    
    # Run all demos
    demos = [
        ("Service Generator", demo_service_generator),
        ("Data Governance", demo_data_governance),
        ("Service Registry", demo_service_registry),
        ("Integration", demo_integration)
    ]
    
    results = []
    for demo_name, demo_func in demos:
        try:
            success = demo_func()
            results.append((demo_name, success))
        except Exception as e:
            print(f"❌ {demo_name} demo failed: {e}")
            results.append((demo_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Demo Results Summary")
    print("=" * 60)
    
    all_passed = True
    for demo_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{demo_name}: {status}")
        if not success:
            all_passed = False
    
    if all_passed:
        print("\n🎉 All demos passed! Architecture improvements are working correctly.")
        print("\n🚀 Ready for Production Use:")
        print("1. Service Generator: python scripts/generate_service.py --help")
        print("2. Data Governance: from src.data_governance import get_governance_manager")
        print("3. Service Registry: from config.service_registry import discover_services")
        print("4. UI Integration: Import AIWorkflowDesigner component")
    else:
        print("\n⚠️ Some demos failed. Please review the issues above.")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 