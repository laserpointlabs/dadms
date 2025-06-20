"""
BPMN Templates

This module provides template BPMN structures that can be used as starting points
for AI-generated process models.
"""

# Basic process template with start and end events
BASIC_PROCESS_TEMPLATE = '''<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  id="Definitions_1" 
                  targetNamespace="http://bpmn.io/schema/bpmn" 
                  exporter="DADM BPMN AI" 
                  exporterVersion="1.0">
  <bpmn:process id="Process_{process_id}" isExecutable="true">
    <bpmn:startEvent id="StartEvent_{start_id}" name="{start_name}">
      <bpmn:outgoing>Flow_{flow_id}</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:endEvent id="EndEvent_{end_id}" name="{end_name}">
      <bpmn:incoming>Flow_{flow_id}</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_{flow_id}" sourceRef="StartEvent_{start_id}" targetRef="EndEvent_{end_id}" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_{process_id}">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_{start_id}">
        <dc:Bounds x="179" y="79" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="172" y="122" width="51" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_{end_id}_di" bpmnElement="EndEvent_{end_id}">
        <dc:Bounds x="432" y="79" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="427" y="122" width="47" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_{flow_id}_di" bpmnElement="Flow_{flow_id}">
        <di:waypoint x="215" y="97" />
        <di:waypoint x="432" y="97" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>'''

# Simple approval process template
APPROVAL_PROCESS_TEMPLATE = '''<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  id="Definitions_1" 
                  targetNamespace="http://bpmn.io/schema/bpmn" 
                  exporter="DADM BPMN AI" 
                  exporterVersion="1.0">
  <bpmn:process id="Process_{process_id}" isExecutable="true">
    <bpmn:startEvent id="StartEvent_{start_id}" name="Request Submitted">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:userTask id="Task_Review" name="Review Request">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:exclusiveGateway id="Gateway_Decision" name="Approved?">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_Approved</bpmn:outgoing>
      <bpmn:outgoing>Flow_Rejected</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:endEvent id="EndEvent_Approved" name="Request Approved">
      <bpmn:incoming>Flow_Approved</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:endEvent id="EndEvent_Rejected" name="Request Rejected">
      <bpmn:incoming>Flow_Rejected</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_{start_id}" targetRef="Task_Review" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_Review" targetRef="Gateway_Decision" />
    <bpmn:sequenceFlow id="Flow_Approved" name="Yes" sourceRef="Gateway_Decision" targetRef="EndEvent_Approved" />
    <bpmn:sequenceFlow id="Flow_Rejected" name="No" sourceRef="Gateway_Decision" targetRef="EndEvent_Rejected" />
  </bpmn:process>
</bpmn:definitions>'''

# Process patterns and common structures
PROCESS_PATTERNS = {
    "sequential": {
        "description": "Linear sequence of activities",
        "template": "start -> activity1 -> activity2 -> end",
        "keywords": ["then", "next", "after", "followed by", "sequential", "linear"]
    },
    "parallel": {
        "description": "Parallel execution paths",
        "template": "start -> parallel_gateway -> [activity1, activity2] -> join_gateway -> end",
        "keywords": ["parallel", "simultaneously", "at the same time", "concurrent", "together"]
    },
    "decision": {
        "description": "Process with decision point",
        "template": "start -> activity -> decision -> [path1, path2] -> end",
        "keywords": ["if", "decision", "choice", "approve", "reject", "branch", "condition"]
    },
    "loop": {
        "description": "Process with iteration",
        "template": "start -> activity -> decision -> [continue, exit] -> end",
        "keywords": ["repeat", "loop", "until", "while", "iterate", "retry"]
    },
    "escalation": {
        "description": "Process with escalation path",
        "template": "start -> activity -> timer -> escalation -> end",
        "keywords": ["escalate", "timeout", "deadline", "emergency", "backup"]
    },
    "error_handling": {
        "description": "Process with error handling",
        "template": "start -> activity -> [success, error] -> end",
        "keywords": ["error", "exception", "fail", "catch", "handle", "recovery"]
    }
}

# BPMN element templates
ELEMENT_TEMPLATES = {
    "start_event": '''<bpmn:startEvent id="StartEvent_{id}" name="{name}">
      <bpmn:outgoing>{outgoing}</bpmn:outgoing>
    </bpmn:startEvent>''',
    
    "end_event": '''<bpmn:endEvent id="EndEvent_{id}" name="{name}">
      <bpmn:incoming>{incoming}</bpmn:incoming>
    </bpmn:endEvent>''',
    
    "user_task": '''<bpmn:userTask id="Task_{id}" name="{name}">
      <bpmn:incoming>{incoming}</bpmn:incoming>
      <bpmn:outgoing>{outgoing}</bpmn:outgoing>
    </bpmn:userTask>''',
    
    "service_task": '''<bpmn:serviceTask id="ServiceTask_{id}" name="{name}">
      <bpmn:incoming>{incoming}</bpmn:incoming>
      <bpmn:outgoing>{outgoing}</bpmn:outgoing>
    </bpmn:serviceTask>''',
    
    "exclusive_gateway": '''<bpmn:exclusiveGateway id="Gateway_{id}" name="{name}">
      <bpmn:incoming>{incoming}</bpmn:incoming>
      <bpmn:outgoing>{outgoing}</bpmn:outgoing>
    </bpmn:exclusiveGateway>''',
    
    "parallel_gateway": '''<bpmn:parallelGateway id="Gateway_{id}" name="{name}">
      <bpmn:incoming>{incoming}</bpmn:incoming>
      <bpmn:outgoing>{outgoing}</bpmn:outgoing>
    </bpmn:parallelGateway>''',
    
    "sequence_flow": '''<bpmn:sequenceFlow id="Flow_{id}" name="{name}" sourceRef="{source}" targetRef="{target}" />'''
}

# Common process types and their characteristics
PROCESS_TYPES = {
    "approval": {
        "description": "Process for approving requests or documents",
        "typical_elements": ["start", "review_task", "decision_gateway", "approved_end", "rejected_end"],
        "template": APPROVAL_PROCESS_TEMPLATE
    },
    "purchase_order": {
        "description": "Process for handling purchase orders",
        "typical_elements": ["start", "create_order", "approval", "send_order", "receive_goods", "end"],
        "keywords": ["purchase", "order", "buy", "procurement", "vendor"]
    },
    "customer_service": {
        "description": "Process for handling customer requests",
        "typical_elements": ["start", "receive_request", "analyze", "resolve", "follow_up", "end"],
        "keywords": ["customer", "service", "support", "ticket", "complaint", "inquiry"]
    },
    "onboarding": {
        "description": "Process for onboarding new employees or customers",
        "typical_elements": ["start", "collect_info", "setup_accounts", "training", "welcome", "end"],
        "keywords": ["onboard", "welcome", "setup", "training", "new", "employee", "customer"]
    }
}

def get_template_by_type(process_type: str) -> str:
    """Get BPMN template for a specific process type"""
    if process_type.lower() in PROCESS_TYPES:
        return PROCESS_TYPES[process_type.lower()].get("template", BASIC_PROCESS_TEMPLATE)
    return BASIC_PROCESS_TEMPLATE

def identify_process_pattern(user_input: str) -> str:
    """Identify process pattern based on user input keywords"""
    user_input_lower = user_input.lower()
    
    for pattern_name, pattern_info in PROCESS_PATTERNS.items():
        keywords = pattern_info["keywords"]
        if any(keyword in user_input_lower for keyword in keywords):
            return pattern_name
    
    return "sequential"  # Default pattern

def get_element_template(element_type: str) -> str:
    """Get template for a specific BPMN element"""
    return ELEMENT_TEMPLATES.get(element_type, "")

def generate_unique_id(prefix: str = "id") -> str:
    """Generate a unique ID for BPMN elements"""
    import time
    import random
    return f"{prefix}_{int(time.time())}_{random.randint(1000, 9999)}"
