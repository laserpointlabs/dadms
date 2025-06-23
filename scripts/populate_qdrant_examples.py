#!/usr/bin/env python3
"""
Script to populate Qdrant with multiple BPMN examples for testing vector search
"""

import os
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.services.enhanced_bpmn_ai_service import (
    EnhancedBPMNAIService, 
    BPMNExample, 
    BPMNComplexity
)

def create_sample_examples():
    """Create sample BPMN examples for testing"""
    examples = [
        BPMNExample(
            id="expense_approval_simple",
            name="Simple Expense Approval",
            description="A basic expense approval process for small amounts",
            natural_language="Create a simple expense approval workflow where employees submit expense reports, managers review them, and either approve or reject based on company policy",
            bpmn_xml="""<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="expense_approval" name="Expense Approval" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Submit Expense">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Manager Review">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_1" name="Approved?">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_2" name="Approve Expense">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_3" name="Reject Expense">
      <bpmn:incoming>Flow_4</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Expense Approved">
      <bpmn:incoming>Flow_5</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:endEvent id="EndEvent_2" name="Expense Rejected">
      <bpmn:incoming>Flow_6</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Gateway_1" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Gateway_1" targetRef="Task_2" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Gateway_1" targetRef="Task_3" />
    <bpmn:sequenceFlow id="Flow_5" sourceRef="Task_2" targetRef="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_3" targetRef="EndEvent_2" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="expense_approval">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="240" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_1_di" bpmnElement="Gateway_1">
        <dc:Bounds x="395" y="95" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_2_di" bpmnElement="Task_2">
        <dc:Bounds x="500" y="40" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_3_di" bpmnElement="Task_3">
        <dc:Bounds x="500" y="160" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="652" y="62" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_2_di" bpmnElement="EndEvent_2">
        <dc:Bounds x="652" y="182" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="188" y="120" />
        <di:waypoint x="240" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="340" y="120" />
        <di:waypoint x="395" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="420" y="95" />
        <di:waypoint x="420" y="80" />
        <di:waypoint x="500" y="80" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="420" y="145" />
        <di:waypoint x="420" y="200" />
        <di:waypoint x="500" y="200" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_5_di" bpmnElement="Flow_5">
        <di:waypoint x="600" y="80" />
        <di:waypoint x="652" y="80" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_6_di" bpmnElement="Flow_6">
        <di:waypoint x="600" y="200" />
        <di:waypoint x="652" y="200" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>""",
            complexity=BPMNComplexity.SIMPLE,
            tags=["expense", "approval", "simple", "workflow"]
        ),
        
        BPMNExample(
            id="project_approval_complex",
            name="Complex Project Approval",
            description="A multi-level project approval process with stakeholder review",
            natural_language="Create a complex project approval workflow with multiple approval levels including technical review, budget approval, and stakeholder sign-off with parallel review processes",
            bpmn_xml="""<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="project_approval" name="Project Approval">
    <bpmn:startEvent id="start" name="Submit Project"/>
    <bpmn:parallelGateway id="fork" name="Parallel Review"/>
    <bpmn:task id="tech_review" name="Technical Review"/>
    <bpmn:task id="budget_review" name="Budget Review"/>
    <bpmn:task id="stakeholder_review" name="Stakeholder Review"/>
    <bpmn:parallelGateway id="join" name="All Reviews Complete"/>
    <bpmn:exclusiveGateway id="decision" name="All Approved?"/>
    <bpmn:task id="approve" name="Approve Project"/>
    <bpmn:task id="reject" name="Reject Project"/>
    <bpmn:endEvent id="end_approve" name="Project Approved"/>
    <bpmn:endEvent id="end_reject" name="Project Rejected"/>
    <bpmn:sequenceFlow id="flow1" sourceRef="start" targetRef="fork"/>
    <bpmn:sequenceFlow id="flow2" sourceRef="fork" targetRef="tech_review"/>
    <bpmn:sequenceFlow id="flow3" sourceRef="fork" targetRef="budget_review"/>
    <bpmn:sequenceFlow id="flow4" sourceRef="fork" targetRef="stakeholder_review"/>
    <bpmn:sequenceFlow id="flow5" sourceRef="tech_review" targetRef="join"/>
    <bpmn:sequenceFlow id="flow6" sourceRef="budget_review" targetRef="join"/>
    <bpmn:sequenceFlow id="flow7" sourceRef="stakeholder_review" targetRef="join"/>
    <bpmn:sequenceFlow id="flow8" sourceRef="join" targetRef="decision"/>
    <bpmn:sequenceFlow id="flow9" sourceRef="decision" targetRef="approve"/>
    <bpmn:sequenceFlow id="flow10" sourceRef="decision" targetRef="reject"/>
    <bpmn:sequenceFlow id="flow11" sourceRef="approve" targetRef="end_approve"/>
    <bpmn:sequenceFlow id="flow12" sourceRef="reject" targetRef="end_reject"/>
  </bpmn:process>
</bpmn:definitions>""",
            complexity=BPMNComplexity.COMPLEX,
            tags=["project", "approval", "complex", "parallel", "stakeholder"]
        ),
        
        BPMNExample(
            id="order_processing_moderate",
            name="Order Processing Workflow",
            description="A moderate complexity order processing workflow with inventory check",
            natural_language="Create an order processing workflow that checks inventory, processes payment, and handles shipping with conditional logic for out-of-stock items",
            bpmn_xml="""<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_2" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="order_processing" name="Order Processing" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Receive Order">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Check Inventory">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_1" name="In Stock?">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_2" name="Process Payment">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_3" name="Ship Order">
      <bpmn:incoming>Flow_5</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_4" name="Notify Backorder">
      <bpmn:incoming>Flow_4</bpmn:incoming>
      <bpmn:outgoing>Flow_7</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Order Shipped">
      <bpmn:incoming>Flow_6</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:endEvent id="EndEvent_2" name="Backorder Created">
      <bpmn:incoming>Flow_7</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Gateway_1" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Gateway_1" targetRef="Task_2" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Gateway_1" targetRef="Task_4" />
    <bpmn:sequenceFlow id="Flow_5" sourceRef="Task_2" targetRef="Task_3" />
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_3" targetRef="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_7" sourceRef="Task_4" targetRef="EndEvent_2" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_2">
    <bpmndi:BPMNPlane id="BPMNPlane_2" bpmnElement="order_processing">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="240" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_1_di" bpmnElement="Gateway_1">
        <dc:Bounds x="395" y="95" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_2_di" bpmnElement="Task_2">
        <dc:Bounds x="500" y="40" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_3_di" bpmnElement="Task_3">
        <dc:Bounds x="650" y="40" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_4_di" bpmnElement="Task_4">
        <dc:Bounds x="500" y="160" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="802" y="62" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_2_di" bpmnElement="EndEvent_2">
        <dc:Bounds x="652" y="182" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="188" y="120" />
        <di:waypoint x="240" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="340" y="120" />
        <di:waypoint x="395" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="420" y="95" />
        <di:waypoint x="420" y="80" />
        <di:waypoint x="500" y="80" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="420" y="145" />
        <di:waypoint x="420" y="200" />
        <di:waypoint x="500" y="200" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_5_di" bpmnElement="Flow_5">
        <di:waypoint x="600" y="80" />
        <di:waypoint x="650" y="80" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_6_di" bpmnElement="Flow_6">
        <di:waypoint x="750" y="80" />
        <di:waypoint x="802" y="80" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_7_di" bpmnElement="Flow_7">
        <di:waypoint x="600" y="200" />
        <di:waypoint x="652" y="200" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>""",
            complexity=BPMNComplexity.MODERATE,
            tags=["order", "processing", "inventory", "payment", "shipping"]
        ),
        
        BPMNExample(
            id="employee_onboarding_simple",
            name="Employee Onboarding",
            description="A simple employee onboarding process",
            natural_language="Create a basic employee onboarding workflow that includes document collection, IT setup, and orientation scheduling",
            bpmn_xml="""<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_3" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="employee_onboarding" name="Employee Onboarding" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="New Hire">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Collect Documents">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_2" name="IT Setup">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_3" name="Schedule Orientation">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Onboarding Complete">
      <bpmn:incoming>Flow_4</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Task_2" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_2" targetRef="Task_3" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Task_3" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_3">
    <bpmndi:BPMNPlane id="BPMNPlane_3" bpmnElement="employee_onboarding">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="240" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_2_di" bpmnElement="Task_2">
        <dc:Bounds x="390" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_3_di" bpmnElement="Task_3">
        <dc:Bounds x="540" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="692" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="188" y="120" />
        <di:waypoint x="240" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="340" y="120" />
        <di:waypoint x="390" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="490" y="120" />
        <di:waypoint x="540" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="640" y="120" />
        <di:waypoint x="692" y="120" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>""",
            complexity=BPMNComplexity.SIMPLE,
            tags=["employee", "onboarding", "hr", "simple"]
        ),
        
        BPMNExample(
            id="incident_response_complex",
            name="Incident Response Process",
            description="A complex incident response workflow with escalation",
            natural_language="Create a comprehensive incident response process with multiple severity levels, automated notifications, escalation procedures, and resolution tracking including parallel response teams",
            bpmn_xml="""<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_4" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="incident_response" name="Incident Response" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Incident Reported">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Assess Severity">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_1" name="Severity Level">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_2" name="Low Priority Response">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_3" name="High Priority Response">
      <bpmn:incoming>Flow_4</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
    </bpmn:task>
    <bpmn:parallelGateway id="Gateway_2" name="Escalation Required">
      <bpmn:incoming>Flow_6</bpmn:incoming>
      <bpmn:outgoing>Flow_7</bpmn:outgoing>
      <bpmn:outgoing>Flow_8</bpmn:outgoing>
    </bpmn:parallelGateway>
    <bpmn:task id="Task_4" name="Notify Management">
      <bpmn:incoming>Flow_7</bpmn:incoming>
      <bpmn:outgoing>Flow_9</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_5" name="Assemble Response Team">
      <bpmn:incoming>Flow_8</bpmn:incoming>
      <bpmn:outgoing>Flow_10</bpmn:outgoing>
    </bpmn:task>
    <bpmn:parallelGateway id="Gateway_3" name="Escalation Complete">
      <bpmn:incoming>Flow_9</bpmn:incoming>
      <bpmn:incoming>Flow_10</bpmn:incoming>
      <bpmn:outgoing>Flow_11</bpmn:outgoing>
    </bpmn:parallelGateway>
    <bpmn:task id="Task_6" name="Resolve Incident">
      <bpmn:incoming>Flow_5</bpmn:incoming>
      <bpmn:incoming>Flow_11</bpmn:incoming>
      <bpmn:outgoing>Flow_12</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_7" name="Document Resolution">
      <bpmn:incoming>Flow_12</bpmn:incoming>
      <bpmn:outgoing>Flow_13</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Incident Resolved">
      <bpmn:incoming>Flow_13</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Gateway_1" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Gateway_1" targetRef="Task_2" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Gateway_1" targetRef="Task_3" />
    <bpmn:sequenceFlow id="Flow_5" sourceRef="Task_2" targetRef="Task_6" />
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_3" targetRef="Gateway_2" />
    <bpmn:sequenceFlow id="Flow_7" sourceRef="Gateway_2" targetRef="Task_4" />
    <bpmn:sequenceFlow id="Flow_8" sourceRef="Gateway_2" targetRef="Task_5" />
    <bpmn:sequenceFlow id="Flow_9" sourceRef="Task_4" targetRef="Gateway_3" />
    <bpmn:sequenceFlow id="Flow_10" sourceRef="Task_5" targetRef="Gateway_3" />
    <bpmn:sequenceFlow id="Flow_11" sourceRef="Gateway_3" targetRef="Task_6" />
    <bpmn:sequenceFlow id="Flow_12" sourceRef="Task_6" targetRef="Task_7" />
    <bpmn:sequenceFlow id="Flow_13" sourceRef="Task_7" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_4">
    <bpmndi:BPMNPlane id="BPMNPlane_4" bpmnElement="incident_response">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="240" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_1_di" bpmnElement="Gateway_1">
        <dc:Bounds x="395" y="95" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_2_di" bpmnElement="Task_2">
        <dc:Bounds x="500" y="40" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_3_di" bpmnElement="Task_3">
        <dc:Bounds x="500" y="160" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_2_di" bpmnElement="Gateway_2">
        <dc:Bounds x="655" y="175" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_4_di" bpmnElement="Task_4">
        <dc:Bounds x="760" y="120" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_5_di" bpmnElement="Task_5">
        <dc:Bounds x="760" y="220" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_3_di" bpmnElement="Gateway_3">
        <dc:Bounds x="915" y="195" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_6_di" bpmnElement="Task_6">
        <dc:Bounds x="1020" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_7_di" bpmnElement="Task_7">
        <dc:Bounds x="1170" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="1322" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="188" y="120" />
        <di:waypoint x="240" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="340" y="120" />
        <di:waypoint x="395" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="420" y="95" />
        <di:waypoint x="420" y="80" />
        <di:waypoint x="500" y="80" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="420" y="145" />
        <di:waypoint x="420" y="200" />
        <di:waypoint x="500" y="200" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_5_di" bpmnElement="Flow_5">
        <di:waypoint x="600" y="80" />
        <di:waypoint x="600" y="120" />
        <di:waypoint x="1020" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_6_di" bpmnElement="Flow_6">
        <di:waypoint x="600" y="200" />
        <di:waypoint x="655" y="200" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_7_di" bpmnElement="Flow_7">
        <di:waypoint x="680" y="175" />
        <di:waypoint x="680" y="160" />
        <di:waypoint x="760" y="160" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_8_di" bpmnElement="Flow_8">
        <di:waypoint x="680" y="225" />
        <di:waypoint x="680" y="260" />
        <di:waypoint x="760" y="260" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_9_di" bpmnElement="Flow_9">
        <di:waypoint x="860" y="160" />
        <di:waypoint x="915" y="160" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_10_di" bpmnElement="Flow_10">
        <di:waypoint x="860" y="260" />
        <di:waypoint x="915" y="260" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_11_di" bpmnElement="Flow_11">
        <di:waypoint x="940" y="220" />
        <di:waypoint x="940" y="160" />
        <di:waypoint x="1020" y="160" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_12_di" bpmnElement="Flow_12">
        <di:waypoint x="1120" y="120" />
        <di:waypoint x="1170" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_13_di" bpmnElement="Flow_13">
        <di:waypoint x="1270" y="120" />
        <di:waypoint x="1322" y="120" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>""",
            complexity=BPMNComplexity.COMPLEX,
            tags=["incident", "response", "escalation", "security", "complex"]
        )
    ]
    return examples

def populate_qdrant():
    """Populate Qdrant with sample BPMN examples"""
    print("🚀 Populating Qdrant with BPMN Examples")
    print("=" * 50)
    
    try:
        # Initialize the service
        service = EnhancedBPMNAIService()
        print("✅ Service initialized")
        
        # Clear existing collection
        print("🧹 Clearing existing collection...")
        if service.qdrant_client:
            try:
                # Delete the collection if it exists
                service.qdrant_client.delete_collection('bpmn_examples')
                print("   ✅ Deleted existing collection")
            except Exception as e:
                print(f"   ℹ️  Collection didn't exist or couldn't be deleted: {e}")
            
            # Recreate the collection
            from qdrant_client.models import VectorParams, Distance
            service.qdrant_client.create_collection(
                collection_name='bpmn_examples',
                vectors_config=VectorParams(size=384, distance=Distance.COSINE)
            )
            print("   ✅ Recreated collection")
        
        # Create sample examples
        examples = create_sample_examples()
        print(f"📝 Created {len(examples)} sample examples")
        
        # Add examples to Qdrant
        for i, example in enumerate(examples, 1):
            print(f"\n{i}. Adding: {example.name}")
            print(f"   - Complexity: {example.complexity.value}")
            print(f"   - Tags: {', '.join(example.tags)}")
            
            service.add_example(example)
            print(f"   ✅ Added to Qdrant")
        
        # Verify the examples are in Qdrant
        print(f"\n🔍 Verifying Qdrant contents...")
        if service.qdrant_client:
            count = service.qdrant_client.count('bpmn_examples').count
            print(f"   - Total points in Qdrant: {count}")
            
            # Test vector search
            print(f"\n🧪 Testing vector search...")
            search_results = service._vector_search_examples("expense approval workflow", max_results=3)
            print(f"   - Search results for 'expense approval': {len(search_results)} examples")
            for result in search_results:
                print(f"     • {result.name} ({result.complexity.value})")
        
        print(f"\n🎉 Qdrant population complete!")
        print(f"   - Added {len(examples)} examples")
        print(f"   - Examples cover: Simple, Moderate, and Complex workflows")
        print(f"   - Topics include: Approval, Processing, Onboarding, Incident Response")
        
    except Exception as e:
        print(f"❌ Error populating Qdrant: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    populate_qdrant() 