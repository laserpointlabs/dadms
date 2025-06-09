"""
Test script for running and monitoring the OpenAI Decision Process BPMN workflow.

This script will:
1. Deploy the BPMN process definition (if needed)
2. Start a process instance with test input
3. Monitor execution using the enhanced orchestrator
4. Collect performance metrics and task outputs
5. Generate a detailed execution report
"""
import os
import sys
import json
import time
import logging
from datetime import datetime

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='openai_decision_process_test.log'
)
console = logging.StreamHandler()
console.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console.setFormatter(formatter)
logging.getLogger('').addHandler(console)
logger = logging.getLogger(__name__)

# Import required modules
from config import camunda_config
from src.service_orchestrator import ServiceOrchestrator
from camunda.external_task.external_task_worker import ExternalTaskWorker
from camunda.external_task.external_task import ExternalTask

# Load service registry
from config.service_registry import SERVICE_REGISTRY

# Create orchestrator with metrics enabled
orchestrator = ServiceOrchestrator(
    service_registry=SERVICE_REGISTRY,
    debug=True,
    enable_metrics=True
)

def namespace_task_output_variables(topic_name, activity_id, output_variables):
    """
    Namespace task output variables to prevent conflicts when parallel streams converge.
    
    This function transforms task output variables to use unique names based on the task type,
    ensuring that when parallel analysis streams converge at a parallel gateway join,
    the variables from different tasks don't overwrite each other.
    
    Uses pattern-based matching for flexibility with new task types.
    
    Args:
        topic_name: The topic name of the task (e.g., 'TechnicalFeasibility')
        activity_id: The activity ID of the task (e.g., 'TechnicalFeasibilityTask') 
        output_variables: The original output variables from the task
        
    Returns:
        dict: Namespaced variables that won't conflict with other parallel tasks
    """
    if not output_variables:
        return output_variables
    
    def determine_namespace(topic_name, activity_id):
        """
        Determine the namespace for a task using pattern matching.
        This allows new tasks to be automatically categorized without hardcoding.
        """
        # Convert to lowercase for case-insensitive matching
        topic_lower = (topic_name or '').lower()
        activity_lower = (activity_id or '').lower()
        
        # Technical Analysis patterns
        technical_patterns = [
            'technical', 'performance', 'feasibility', 'engineering', 
            'architecture', 'implementation', 'system', 'technology'
        ]
        
        # Business Analysis patterns  
        business_patterns = [
            'business', 'cost', 'benefit', 'stakeholder', 'financial',
            'economic', 'market', 'commercial', 'budget', 'roi'
        ]
        
        # Risk Analysis patterns
        risk_patterns = [
            'risk', 'mitigation', 'security', 'threat', 'vulnerability',
            'compliance', 'audit', 'safety', 'regulatory'
        ]
        
        # Synthesis/Final patterns (should NOT be namespaced)
        synthesis_patterns = [
            'synthesis', 'synthesize', 'final', 'recommendation', 'whitepaper',
            'generate', 'summary', 'conclusion', 'initialize', 'initial'
        ]
        
        # Check synthesis patterns first (these should not be namespaced)
        for pattern in synthesis_patterns:
            if pattern in topic_lower or pattern in activity_lower:
                return None
        
        # Check technical patterns
        for pattern in technical_patterns:
            if pattern in topic_lower or pattern in activity_lower:
                return 'technical'
        
        # Check business patterns
        for pattern in business_patterns:
            if pattern in topic_lower or pattern in activity_lower:
                return 'business'
        
        # Check risk patterns
        for pattern in risk_patterns:
            if pattern in topic_lower or pattern in activity_lower:
                return 'risk'
        
        # For new tasks like "AssessTradeoffs", check for common analysis keywords
        analysis_patterns = ['assess', 'evaluate', 'analyze', 'compare', 'review']
        for pattern in analysis_patterns:
            if pattern in topic_lower or pattern in activity_lower:
                # Default to 'analysis' namespace for general analysis tasks
                return 'analysis'
        
        # If no pattern matches, don't namespace (safer default)
        return None
    
    # Get the namespace for this task using pattern matching
    namespace = determine_namespace(topic_name, activity_id)
    
    # If no namespace is defined (e.g., for synthesis tasks), return variables as-is
    if not namespace:
        return output_variables
    
    # Create namespaced variables
    namespaced_variables = {}
    
    # Variables that should always be preserved without namespacing (metadata)
    preserve_variables = {
        'task_name', 'processed_by', 'processed_at', 'assistant_id', 'thread_id',
        'decision_context', 'context_summary', 'error'
    }
    
    for key, value in output_variables.items():
        if key in preserve_variables:
            # Keep metadata variables without namespacing
            namespaced_variables[key] = value
        elif key in ['analysis', 'recommendation']:
            # Namespace the main content variables
            namespaced_key = f"{namespace}_{key}"
            namespaced_variables[namespaced_key] = value
        else:
            # For other variables, namespace them but also keep original for compatibility
            namespaced_key = f"{namespace}_{key}"
            namespaced_variables[namespaced_key] = value
            # Also keep the original key for backward compatibility
            namespaced_variables[key] = value
    
    return namespaced_variables

# Dictionary to store task outputs for the process
process_outputs = {}

def deploy_process_if_needed(bpmn_file_path):
    """Deploy the BPMN process definition if it's not already deployed"""
    import requests
    from scripts.deploy_bpmn import deploy_model
    
    # Check if process is already deployed
    base_url = camunda_config.CAMUNDA_ENGINE_URL
    if not base_url.endswith('/'):
        base_url += '/'
    
    process_definition_url = f"{base_url}process-definition/key/OpenAI_Decision_Process"
    try:
        response = requests.get(process_definition_url)
        if response.status_code == 200:
            logger.info("Process definition already deployed")
            return response.json().get('id')
        else:            # Deploy the process            logger.info(f"Deploying process from {bpmn_file_path}")
            result = deploy_model(bpmn_file_path, camunda_config.CAMUNDA_ENGINE_URL)
            if isinstance(result, dict) and 'id' in result:
                logger.info(f"Process deployed with id: {result['id']}")
                return result['id']
            else:
                logger.error("Failed to deploy process")
                return None
    except Exception as e:
        logger.error(f"Error checking/deploying process: {str(e)}")
        return None

def start_process_instance(variables=None):
    """Start a new process instance with the given variables"""
    import requests
    
    if variables is None:
        variables = {
            "decision_context": {
                "value": "We need to select an appropriate Unmanned Aircraft System (UAS) for disaster response operations in urban environments. The UAS will be used for search and rescue, damage assessment, and situation monitoring.",
                "type": "String"
            },
            "requirements": {
                "value": "- Flight endurance of at least 45 minutes\n- Ability to carry a payload of at least 500g\n- Weather resistance for light rain and moderate wind\n- HD camera with thermal imaging capability\n- Real-time video transmission\n- Ease of deployment in under 5 minutes\n- Compliance with FAA Part 107 regulations",
                "type": "String"
            },
            "budget": {
                "value": "The budget range is $5,000 to $15,000 for the complete system including the aircraft, controller, and essential accessories.",
                "type": "String"
            },
            "timeline": {
                "value": "The decision must be made within 2 weeks, and the system should be operational within 1 month of purchase.",
                "type": "String"
            }
        }
    
    base_url = camunda_config.CAMUNDA_ENGINE_URL
    if not base_url.endswith('/'):
        base_url += '/'
    
    start_instance_url = f"{base_url}process-definition/key/OpenAI_Decision_Process/start"
    payload = {
        "variables": variables,
        "businessKey": f"OpenAI_Decision_Test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    }
    
    try:
        response = requests.post(start_instance_url, json=payload)
        if response.status_code == 200:
            result = response.json()
            logger.info(f"Process instance started with ID: {result.get('id')}")
            return result
        else:
            logger.error(f"Failed to start process instance: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logger.error(f"Error starting process instance: {str(e)}")
        return None

def handle_task(task: ExternalTask) -> dict:
    """
    Process a task using the enhanced orchestrator
    
    Args:
        task: External task from Camunda
        
    Returns:
        dict: Variables to return to Camunda
    """
    task_start_time = time.time()
    task_name = task.get_variable("task_name") or task.get_activity_id()
    logger.info(f"Processing task: {task_name}")
    
    # Get task variables
    variables = {
        var_name: var_value.get('value', var_value) if isinstance(var_value, dict) else var_value
        for var_name, var_value in task.get_variables().items()
    }
    
    # Process the task with orchestrator
    result = orchestrator.route_task(task, variables)
    
    # Store the result for reporting
    process_outputs[task_name] = {
        "task_id": task.get_activity_id(),
        "variables_in": variables,
        "result": result,
        "processing_time": time.time() - task_start_time
    }
      # Create variables to complete the task with
    complete_variables = {
        # Preserve task tracking information
        "task_name": task_name,
        "processed_by": result.get("processed_by", "EnhancedOrchestrator"),
        "processed_at": result.get("processed_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    }
    
    # Add task-specific result fields
    if "recommendation" in result:
        complete_variables["recommendation"] = result["recommendation"]
    if "analysis" in result:
        complete_variables["analysis"] = result["analysis"]
    
    # Additional task-specific variables based on the task type
    if task_name == "FrameDecisionTask":
        complete_variables["decision_frame"] = result.get("recommendation", "")
    elif task_name == "IdentifyAlternativesTask":
        complete_variables["alternatives"] = result.get("recommendation", "")
    elif task_name == "EvaluateAlternativesTask":
        complete_variables["evaluation"] = result.get("recommendation", "")
    elif task_name == "RecommendationTask":
        complete_variables["final_recommendation"] = result.get("recommendation", "")
    
    # Apply namespacing to prevent variable conflicts in parallel streams
    topic_name = task.get_topic_name()
    activity_id = task.get_activity_id()
    namespaced_variables = namespace_task_output_variables(topic_name, activity_id, complete_variables)
    
    logger.info(f"Task {task_name} completed in {time.time() - task_start_time:.2f} seconds")
    return namespaced_variables

def process_task_handler(task: ExternalTask) -> dict:
    """Handler for all task types in the process"""
    try:
        result = handle_task(task)
        return result
    except Exception as e:
        logger.error(f"Error processing task {task.get_activity_id()}: {str(e)}")
        return {
            "error": str(e),
            "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

def monitor_process_execution():
    """Monitor and collect metrics during process execution"""
    # Create an external task worker for each task type
    topics = [
        "FrameDecision",
        "IdentifyAlternatives",
        "EvaluateAlternatives",
        "MakeRecommendation"
    ]
    
    # Configure the worker
    config = {
        "maxTasks": 1,
        "lockDuration": 10000,  # 10 seconds
        "asyncResponseTimeout": 5000,
        "retries": 3,
        "retryTimeout": 5000,
        "sleepSeconds": 1
    }
      # Create a worker for each topic
    workers = []
    for topic in topics:
        worker = ExternalTaskWorker(
            worker_id=f"test_worker_{topic}",
            base_url=camunda_config.CAMUNDA_ENGINE_URL,
            config=config
        )
        worker.subscribe([{"topicName": topic, "lockDuration": 10000}], process_task_handler)
        workers.append(worker)
    
    # Use a simple flag to control the monitoring
    monitoring = True
    
    try:
        # Monitor the process execution
        logger.info("Starting process monitoring...")
        
        # Wait for the process to complete or timeout
        timeout = 600  # 10 minutes
        start_time = time.time()
        
        while monitoring and (time.time() - start_time) < timeout:
            # Check if all tasks have been processed
            if len(process_outputs) >= 4:  # We expect 4 tasks
                monitoring = False
                logger.info("All tasks completed")
            
            time.sleep(5)  # Check every 5 seconds
        
        # Check if timed out
        if (time.time() - start_time) >= timeout:
            logger.warning("Process monitoring timed out")
    
    except KeyboardInterrupt:
        logger.info("Monitoring interrupted by user")
    finally:
        # Stop all workers
        for worker in workers:
            worker._exit = True  # Set the internal exit flag
        
        logger.info("Process monitoring completed")

def generate_execution_report():
    """Generate a detailed report of the process execution"""
    # Get orchestrator metrics
    metrics = orchestrator.get_metrics()
    
    # Create the report
    report = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "process_definition": "OpenAI_Decision_Process",
        "execution_summary": {
            "tasks_completed": len(process_outputs),
            "total_processing_time": sum(task["processing_time"] for task in process_outputs.values())
        },
        "task_details": process_outputs,
        "orchestrator_metrics": metrics,
        "issues_detected": []
    }
    
    # Analyze for potential issues
    if len(process_outputs) < 4:
        report["issues_detected"].append("Not all expected tasks were completed")
    
    # Check for long processing times
    for task_name, task_data in process_outputs.items():
        if task_data["processing_time"] > 30:  # Threshold of 30 seconds
            report["issues_detected"].append(f"Task {task_name} took longer than expected: {task_data['processing_time']:.2f} seconds")
    
    # Check for cache effectiveness
    cache_metrics_data = metrics.get("cache_metrics", {})
    if isinstance(cache_metrics_data, dict):
        for cache_name, cache_metrics in cache_metrics_data.items():
            hits = cache_metrics.get("hits", 0)
            misses = cache_metrics.get("misses", 0)
            if hits + misses > 0 and hits / (hits + misses) < 0.5:  # Hit rate less than 50%
                report["issues_detected"].append(f"Low cache hit rate for {cache_name}: {hits/(hits+misses)*100:.1f}%")
    
    # Save the report to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_filename = f"openai_decision_process_report_{timestamp}.json"
    
    with open(report_filename, "w") as f:
        json.dump(report, f, indent=2)
    
    logger.info(f"Execution report saved to {report_filename}")
    return report, report_filename

def analyze_task_outputs():
    """Analyze the quality and completeness of task outputs"""
    if len(process_outputs) < 4:
        logger.warning("Not all tasks completed, skipping output analysis")
        return
    
    # Check task output completeness
    analysis_results = {
        "FrameDecisionTask": {
            "completeness": 0,
            "issues": []
        },
        "IdentifyAlternativesTask": {
            "completeness": 0,
            "issues": []
        },
        "EvaluateAlternativesTask": {
            "completeness": 0,
            "issues": []
        },
        "RecommendationTask": {
            "completeness": 0,
            "issues": []
        }
    }
    
    # Check FrameDecisionTask output
    if "FrameDecisionTask" in process_outputs:
        recommendation = process_outputs["FrameDecisionTask"]["result"].get("recommendation", "")
        
        # Check for required elements
        checks = {
            "key decision": "decision" in recommendation.lower(),
            "stakeholders": "stakeholder" in recommendation.lower(),
            "criteria": "criteria" in recommendation.lower() or "criterion" in recommendation.lower(),
            "constraints": "constraint" in recommendation.lower() or "limitation" in recommendation.lower(),
            "timeline": "timeline" in recommendation.lower() or "time" in recommendation.lower()
        }
        
        # Calculate completeness score
        completeness = sum(1 for check in checks.values() if check) / len(checks) * 100
        analysis_results["FrameDecisionTask"]["completeness"] = completeness
        
        # Note missing elements
        for element, present in checks.items():
            if not present:
                analysis_results["FrameDecisionTask"]["issues"].append(f"Missing {element} in decision frame")
    
    # Check IdentifyAlternativesTask output
    if "IdentifyAlternativesTask" in process_outputs:
        recommendation = process_outputs["IdentifyAlternativesTask"]["result"].get("recommendation", "")
        
        # Count alternatives mentioned
        import re
        # Look for alternatives that seem to be UAS platforms
        alternatives = re.findall(r'\b((?:DJI|Autel|Parrot|Skydio|Yuneec|Freefly|PowerVision|Intel|senseFly|Wingtra)\s+[A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)?)\b', recommendation)
        
        # If we don't find specific brands, look for bullet points or numbered lists
        if len(alternatives) < 3:
            bullet_points = len(re.findall(r'\n[-*•]', recommendation))
            numbered_points = len(re.findall(r'\n\d+\.', recommendation))
            if bullet_points >= 3 or numbered_points >= 3:
                alternatives = ["Unnamed Alternative"] * max(bullet_points, numbered_points)
        
        if len(alternatives) < 3:
            analysis_results["IdentifyAlternativesTask"]["issues"].append(f"Found only {len(alternatives)} alternatives, expected at least 3")
        
        # Check for required elements for each alternative
        checks = {
            "specifications": "specification" in recommendation.lower() or "spec" in recommendation.lower(),
            "capabilities": "capabilit" in recommendation.lower(),
            "strengths": "strength" in recommendation.lower() or "advantage" in recommendation.lower(),
            "limitations": "limitation" in recommendation.lower() or "disadvantage" in recommendation.lower(),
            "cost": "cost" in recommendation.lower() or "price" in recommendation.lower() or "$" in recommendation,
            "regulatory": "regulat" in recommendation.lower() or "FAA" in recommendation or "compliance" in recommendation.lower()
        }
        
        # Calculate completeness score
        completeness = sum(1 for check in checks.values() if check) / len(checks) * 100
        # Adjust for number of alternatives
        if len(alternatives) >= 3:
            completeness = completeness
        else:
            completeness = completeness * (len(alternatives) / 3)
            
        analysis_results["IdentifyAlternativesTask"]["completeness"] = completeness
        
        # Note missing elements
        for element, present in checks.items():
            if not present:
                analysis_results["IdentifyAlternativesTask"]["issues"].append(f"Missing {element} information for alternatives")
    
    # Check EvaluateAlternativesTask output
    if "EvaluateAlternativesTask" in process_outputs:
        recommendation = process_outputs["EvaluateAlternativesTask"]["result"].get("recommendation", "")
        
        # Check for required elements
        checks = {
            "scoring system": "score" in recommendation.lower() or "rating" in recommendation.lower(),
            "criteria ratings": "criteria" in recommendation.lower() and any(str(i) in recommendation for i in range(1, 6)),
            "justification": "justification" in recommendation.lower() or "because" in recommendation.lower(),
            "summary": "summary" in recommendation.lower() or "overall" in recommendation.lower()
        }
        
        # Calculate completeness score
        completeness = sum(1 for check in checks.values() if check) / len(checks) * 100
        analysis_results["EvaluateAlternativesTask"]["completeness"] = completeness
        
        # Note missing elements
        for element, present in checks.items():
            if not present:
                analysis_results["EvaluateAlternativesTask"]["issues"].append(f"Missing {element} in evaluation")
    
    # Check RecommendationTask output
    if "RecommendationTask" in process_outputs:
        recommendation = process_outputs["RecommendationTask"]["result"].get("recommendation", "")
        
        # Check for required elements
        checks = {
            "recommended option": "recommend" in recommendation.lower(),
            "justification": "justification" in recommendation.lower() or "because" in recommendation.lower() or "due to" in recommendation.lower(),
            "advantages": "advantage" in recommendation.lower() or "benefit" in recommendation.lower(),
            "risks": "risk" in recommendation.lower() or "concern" in recommendation.lower(),
            "implementation": "implement" in recommendation.lower() or "deploy" in recommendation.lower(),
            "next steps": "next step" in recommendation.lower() or "procurement" in recommendation.lower()
        }
        
        # Calculate completeness score
        completeness = sum(1 for check in checks.values() if check) / len(checks) * 100
        analysis_results["RecommendationTask"]["completeness"] = completeness
        
        # Note missing elements
        for element, present in checks.items():
            if not present:
                analysis_results["RecommendationTask"]["issues"].append(f"Missing {element} in final recommendation")
    
    # Calculate overall completeness
    total_completeness = sum(task["completeness"] for task in analysis_results.values()) / len(analysis_results)
    
    logger.info(f"Task output analysis complete. Overall completeness: {total_completeness:.1f}%")
    
    # Save analysis results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    analysis_filename = f"openai_decision_process_analysis_{timestamp}.json"
    
    with open(analysis_filename, "w", encoding="utf-8") as f:
        json.dump({
            "overall_completeness": total_completeness,
            "task_analysis": analysis_results
        }, f, indent=2)
    
    logger.info(f"Task output analysis saved to {analysis_filename}")
    return analysis_results, total_completeness

def main():
    """Main function to run the test"""
    # 1. Deploy BPMN file if needed
    bpmn_file_path = os.path.join(project_root, "camunda_models", "openai_decision_process.bpmn")
    process_id = deploy_process_if_needed(bpmn_file_path)
    if not process_id:
        logger.error("Failed to deploy process, exiting")
        return
    
    # 2. Start a process instance
    instance = start_process_instance()
    if not instance:
        logger.error("Failed to start process instance, exiting")
        return
    
    # 3. Monitor the process execution
    monitor_process_execution()
    
    # 4. Generate execution report
    report, report_filename = generate_execution_report()
    
    # 5. Analyze task outputs
    result = analyze_task_outputs()
    if result is not None:
        analysis, completeness = result
    else:
        analysis, completeness = {}, 0
    
    # 6. Print summary
    print("\n" + "="*80)
    print("OPENAI DECISION PROCESS TEST SUMMARY")
    print("="*80)
    print(f"Process Definition ID: {process_id}")
    print(f"Process Instance ID: {instance.get('id')}")
    print(f"Tasks Completed: {len(process_outputs)} of 4")
    print(f"Total Processing Time: {report['execution_summary']['total_processing_time']:.2f} seconds")
    print(f"Output Completeness: {completeness:.1f}%")
    
    if report["issues_detected"]:
        print("\nPotential Issues Detected:")
        for issue in report["issues_detected"]:
            print(f"- {issue}")
    
    print("\nTask Completeness:")
    for task, details in analysis.items():
        print(f"- {task}: {details['completeness']:.1f}%")
    
    print("\nReports Generated:")
    print(f"- Execution Report: {report_filename}")
    print(f"- Output Analysis: openai_decision_process_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    
    print("\nOrchestrator Cache Performance:")
    for cache_name, metrics in report["orchestrator_metrics"].get("cache_metrics", {}).items():
        hits = metrics.get("hits", 0)
        misses = metrics.get("misses", 0)
        total = hits + misses
        hit_rate = (hits / total * 100) if total > 0 else 0
        print(f"- {cache_name}: {hit_rate:.1f}% hit rate ({hits}/{total})")
    
    # Close orchestrator session
    orchestrator.close()
    
    return report, analysis

if __name__ == "__main__":
    main()
