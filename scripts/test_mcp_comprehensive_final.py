#!/usr/bin/env python3
"""
DADM MCP Services - COMPREHENSIVE FINAL INTEGRATION TEST
========================================================

This comprehensive test suite validates the complete MCP integration by:
1. Creating realistic decision-making scenarios with real data
2. Testing statistical analysis on complex datasets
3. Building decision networks in Neo4j
4. Generating and executing mathematical validation scripts
5. Performing end-to-end decision analysis workflows
6. Generating detailed performance and capability reports

Author: DADM System Integration Team
Date: June 11, 2025
"""

import asyncio
import json
import requests
import time
import logging
import os
import sys
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from neo4j import GraphDatabase
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(f'mcp_comprehensive_test_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class TestScenario:
    """Represents a comprehensive test scenario"""
    name: str
    description: str
    data: Dict[str, Any]
    expected_outcomes: Dict[str, Any]

@dataclass 
class ServiceResult:
    """Results from a service test"""
    service_name: str
    success: bool
    response_time_ms: float
    data: Dict[str, Any]
    errors: List[str]

class ComprehensiveMCPTester:
    """Comprehensive MCP Integration Test Suite"""
    
    def __init__(self):
        self.services = {
            "statistical": "http://localhost:5201",
            "neo4j": "http://localhost:5202", 
            "script_execution": "http://localhost:5203"
        }
        self.test_results = {
            "start_time": datetime.now().isoformat(),
            "scenarios": {},
            "service_performance": {},
            "integration_results": {},
            "summary": {}
        }
        
        # Neo4j connection for direct data operations
        self.neo4j_driver = None
        self._initialize_neo4j()
        
    def _initialize_neo4j(self):
        """Initialize Neo4j connection for test data setup"""
        try:
            uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
            user = os.environ.get("NEO4J_USER", "neo4j")
            password = os.environ.get("NEO4J_PASSWORD", "password")
            
            self.neo4j_driver = GraphDatabase.driver(uri, auth=(user, password))
            with self.neo4j_driver.session() as session:
                session.run("RETURN 1")
            logger.info("✅ Neo4j connection established for test setup")
        except Exception as e:
            logger.warning(f"⚠️ Neo4j connection failed: {e}")
            self.neo4j_driver = None

    def create_comprehensive_test_scenarios(self) -> List[TestScenario]:
        """Create realistic decision-making test scenarios"""
        
        scenarios = []
        
        # Scenario 1: Emergency Communication System Selection
        scenarios.append(TestScenario(
            name="emergency_communication_system",
            description="Municipal emergency communication system procurement decision",
            data={
                "decision_context": "Emergency Communication System Procurement",
                "budget_limit": "$2.5M",
                "timeline": "18 months",
                "alternatives": {
                    "digital_radio_system": {
                        "cost": 1850000,
                        "implementation_time": 14,
                        "coverage_radius": 50,
                        "user_capacity": 500,
                        "reliability_score": 9.2,
                        "interoperability": "High",
                        "maintenance_cost_annual": 125000
                    },
                    "cellular_based_system": {
                        "cost": 950000,
                        "implementation_time": 8,
                        "coverage_radius": 75,
                        "user_capacity": 1000,
                        "reliability_score": 7.8,
                        "interoperability": "Medium", 
                        "maintenance_cost_annual": 85000
                    },
                    "hybrid_solution": {
                        "cost": 2200000,
                        "implementation_time": 16,
                        "coverage_radius": 85,
                        "user_capacity": 750,
                        "reliability_score": 9.5,
                        "interoperability": "High",
                        "maintenance_cost_annual": 150000
                    }
                },
                "stakeholders": {
                    "fire_department": {"priority": "reliability", "weight": 0.35},
                    "police_department": {"priority": "coverage", "weight": 0.30},
                    "ems": {"priority": "response_time", "weight": 0.25},
                    "city_council": {"priority": "cost", "weight": 0.10}
                },
                "criteria": {
                    "cost_effectiveness": {"weight": 0.25, "maximize": False},
                    "reliability": {"weight": 0.30, "maximize": True},
                    "coverage": {"weight": 0.25, "maximize": True},
                    "implementation_speed": {"weight": 0.20, "maximize": False}
                },
                "constraints": {
                    "budget_hard_limit": 2500000,
                    "implementation_deadline": 18,
                    "minimum_reliability": 8.0,
                    "required_coverage": 40
                }
            },
            expected_outcomes={
                "statistical_data_points": 20,
                "graph_nodes": 15,
                "script_validation": True,
                "decision_confidence": 0.80
            }
        ))
        
        # Scenario 2: Supply Chain Optimization
        scenarios.append(TestScenario(
            name="supply_chain_optimization",
            description="Multi-facility supply chain optimization with risk analysis",
            data={
                "decision_context": "Supply Chain Network Optimization",
                "facilities": {
                    "warehouse_east": {
                        "capacity": 50000,
                        "operating_cost": 125000,
                        "location_score": 8.5,
                        "risk_factor": 0.15,
                        "efficiency_rating": 0.92
                    },
                    "warehouse_west": {
                        "capacity": 75000,
                        "operating_cost": 185000,
                        "location_score": 9.2,
                        "risk_factor": 0.08,
                        "efficiency_rating": 0.88
                    },
                    "warehouse_central": {
                        "capacity": 60000,
                        "operating_cost": 145000,
                        "location_score": 7.8,
                        "risk_factor": 0.12,
                        "efficiency_rating": 0.95
                    }
                },
                "demand_patterns": {
                    "region_north": {"demand": 25000, "seasonality": 1.2, "growth_rate": 0.08},
                    "region_south": {"demand": 35000, "seasonality": 0.9, "growth_rate": 0.12},
                    "region_central": {"demand": 40000, "seasonality": 1.1, "growth_rate": 0.05}
                },
                "transportation_costs": {
                    "east_to_north": 2.50,
                    "east_to_south": 4.25,
                    "east_to_central": 3.10,
                    "west_to_north": 3.80,
                    "west_to_south": 2.90,
                    "west_to_central": 3.45,
                    "central_to_north": 2.20,
                    "central_to_south": 2.80,
                    "central_to_central": 1.50
                },
                "performance_metrics": {
                    "service_level_target": "95%",
                    "cost_reduction_goal": "15%",
                    "risk_tolerance": "Medium"
                }
            },
            expected_outcomes={
                "statistical_data_points": 25,
                "graph_nodes": 20,
                "optimization_script": True,
                "cost_savings": 0.12
            }
        ))
        
        # Scenario 3: Technology Investment Portfolio
        scenarios.append(TestScenario(
            name="technology_investment_portfolio",
            description="Strategic technology investment portfolio optimization with ROI analysis",
            data={
                "decision_context": "Technology Investment Portfolio Strategy",
                "investment_budget": 5000000,
                "time_horizon": 36,
                "technologies": {
                    "ai_platform": {
                        "initial_investment": 1200000,
                        "expected_roi": 2.8,
                        "risk_level": "High",
                        "payback_period": 24,
                        "strategic_value": 9.5,
                        "technical_complexity": 8.2
                    },
                    "cloud_infrastructure": {
                        "initial_investment": 800000,
                        "expected_roi": 1.9,
                        "risk_level": "Medium",
                        "payback_period": 18,
                        "strategic_value": 8.8,
                        "technical_complexity": 6.5
                    },
                    "automation_suite": {
                        "initial_investment": 1500000,
                        "expected_roi": 3.2,
                        "risk_level": "Medium",
                        "payback_period": 20,
                        "strategic_value": 9.2,
                        "technical_complexity": 7.8
                    },
                    "cybersecurity_platform": {
                        "initial_investment": 600000,
                        "expected_roi": 1.5,
                        "risk_level": "Low",
                        "payback_period": 15,
                        "strategic_value": 9.8,
                        "technical_complexity": 5.5
                    },
                    "data_analytics": {
                        "initial_investment": 900000,
                        "expected_roi": 2.4,
                        "risk_level": "Medium",
                        "payback_period": 22,
                        "strategic_value": 8.9,
                        "technical_complexity": 7.2
                    }
                },
                "portfolio_constraints": {
                    "max_high_risk": 0.30,
                    "min_strategic_value": 8.0,
                    "max_payback_period": 30,
                    "diversification_requirement": True
                },
                "market_conditions": {
                    "economic_outlook": "Stable",
                    "technology_maturity": "Growing",
                    "competitive_pressure": "High",
                    "regulatory_changes": "Low"
                }
            },
            expected_outcomes={
                "statistical_data_points": 30,
                "graph_nodes": 25,
                "portfolio_optimization": True,
                "expected_portfolio_roi": 2.1
            }
        ))
        
        return scenarios

    def clear_and_setup_neo4j_test_data(self, scenario: TestScenario) -> bool:
        """Clear Neo4j and set up scenario-specific test data"""
        if not self.neo4j_driver:
            logger.warning("Neo4j not available for test data setup")
            return False
            
        try:
            with self.neo4j_driver.session() as session:
                # Clear existing data
                logger.info(f"🧹 Clearing Neo4j for scenario: {scenario.name}")
                session.run("MATCH (n) DETACH DELETE n")
                
                # Create scenario-specific nodes based on the scenario type
                if scenario.name == "emergency_communication_system":
                    self._create_emergency_system_nodes(session, scenario)
                elif scenario.name == "supply_chain_optimization":
                    self._create_supply_chain_nodes(session, scenario)
                elif scenario.name == "technology_investment_portfolio":
                    self._create_investment_nodes(session, scenario)
                
                # Get final counts
                result = session.run("MATCH (n) RETURN count(n) as node_count")
                node_count = result.single()["node_count"]
                
                result = session.run("MATCH ()-[r]->() RETURN count(r) as rel_count")
                rel_count = result.single()["rel_count"]
                
                logger.info(f"✅ Created {node_count} nodes and {rel_count} relationships for {scenario.name}")
                return True
                
        except Exception as e:
            logger.error(f"❌ Error setting up Neo4j test data: {e}")
            return False

    def _create_emergency_system_nodes(self, session, scenario):
        """Create emergency communication system specific nodes"""
        data = scenario.data
        
        # Create decision nodes
        session.run("""
            CREATE (d:Decision {
                id: 'emergency_comm_decision',
                name: 'Emergency Communication System Selection',
                budget: $budget,
                timeline: $timeline,
                created_at: datetime()
            })
        """, budget=data.get("budget_limit"), timeline=data.get("timeline"))
        
        # Create alternative nodes
        for alt_name, alt_data in data["alternatives"].items():
            session.run("""
                CREATE (a:Alternative {
                    id: $alt_id,
                    name: $name,
                    cost: $cost,
                    implementation_time: $impl_time,
                    reliability_score: $reliability,
                    coverage_radius: $coverage,
                    created_at: datetime()
                })
            """, 
            alt_id=alt_name,
            name=alt_name.replace('_', ' ').title(),
            cost=alt_data["cost"],
            impl_time=alt_data["implementation_time"], 
            reliability=alt_data["reliability_score"],
            coverage=alt_data["coverage_radius"])
        
        # Create stakeholder nodes
        for stakeholder, stake_data in data["stakeholders"].items():
            session.run("""
                CREATE (s:Stakeholder {
                    id: $stake_id,
                    name: $name,
                    priority: $priority,
                    weight: $weight,
                    created_at: datetime()
                })
            """,
            stake_id=stakeholder,
            name=stakeholder.replace('_', ' ').title(),
            priority=stake_data["priority"],
            weight=stake_data["weight"])
        
        # Create criteria nodes
        for criterion, crit_data in data["criteria"].items():
            session.run("""
                CREATE (c:Criterion {
                    id: $crit_id,
                    name: $name,
                    weight: $weight,
                    maximize: $maximize,
                    created_at: datetime()
                })
            """,
            crit_id=criterion,
            name=criterion.replace('_', ' ').title(),
            weight=crit_data["weight"],
            maximize=crit_data["maximize"])
        
        # Create relationships
        session.run("""
            MATCH (d:Decision {id: 'emergency_comm_decision'})
            MATCH (a:Alternative)
            CREATE (d)-[:HAS_ALTERNATIVE]->(a)
        """)
        
        session.run("""
            MATCH (d:Decision {id: 'emergency_comm_decision'})
            MATCH (s:Stakeholder)
            CREATE (d)-[:INVOLVES_STAKEHOLDER]->(s)
        """)
        
        session.run("""
            MATCH (d:Decision {id: 'emergency_comm_decision'})
            MATCH (c:Criterion)
            CREATE (d)-[:EVALUATED_BY]->(c)
        """)

    def _create_supply_chain_nodes(self, session, scenario):
        """Create supply chain optimization specific nodes"""
        data = scenario.data
        
        # Create supply chain decision node
        session.run("""
            CREATE (d:Decision {
                id: 'supply_chain_optimization',
                name: 'Supply Chain Network Optimization',
                context: $context,
                created_at: datetime()
            })
        """, context=data["decision_context"])
        
        # Create facility nodes
        for facility_name, facility_data in data["facilities"].items():
            session.run("""
                CREATE (f:Facility {
                    id: $facility_id,
                    name: $name,
                    capacity: $capacity,
                    operating_cost: $op_cost,
                    location_score: $location_score,
                    risk_factor: $risk_factor,
                    efficiency_rating: $efficiency,
                    created_at: datetime()
                })
            """,
            facility_id=facility_name,
            name=facility_name.replace('_', ' ').title(),
            capacity=facility_data["capacity"],
            op_cost=facility_data["operating_cost"],
            location_score=facility_data["location_score"],
            risk_factor=facility_data["risk_factor"],
            efficiency=facility_data["efficiency_rating"])
        
        # Create demand region nodes
        for region_name, region_data in data["demand_patterns"].items():
            session.run("""
                CREATE (r:Region {
                    id: $region_id,
                    name: $name,
                    demand: $demand,
                    seasonality: $seasonality,
                    growth_rate: $growth_rate,
                    created_at: datetime()
                })
            """,
            region_id=region_name,
            name=region_name.replace('_', ' ').title(),
            demand=region_data["demand"],
            seasonality=region_data["seasonality"],
            growth_rate=region_data["growth_rate"])
        
        # Create transportation cost relationships
        transport_costs = data["transportation_costs"]
        for route, cost in transport_costs.items():
            parts = route.split('_to_')
            if len(parts) == 2:
                from_facility = parts[0]
                to_region = parts[1]
                session.run("""
                    MATCH (f:Facility {id: $from_id})
                    MATCH (r:Region {id: $to_id})
                    CREATE (f)-[:SERVES {cost_per_unit: $cost, route: $route}]->(r)
                """,
                from_id=f"warehouse_{from_facility}",
                to_id=f"region_{to_region}",
                cost=cost,
                route=route)

    def _create_investment_nodes(self, session, scenario):
        """Create technology investment portfolio specific nodes"""
        data = scenario.data
        
        # Create portfolio decision node
        session.run("""
            CREATE (p:Portfolio {
                id: 'tech_investment_portfolio',
                name: 'Technology Investment Portfolio',
                total_budget: $budget,
                time_horizon: $horizon,
                created_at: datetime()
            })
        """, 
        budget=data["investment_budget"],
        horizon=data["time_horizon"])
        
        # Create technology investment nodes
        for tech_name, tech_data in data["technologies"].items():
            session.run("""
                CREATE (t:Technology {
                    id: $tech_id,
                    name: $name,
                    initial_investment: $investment,
                    expected_roi: $roi,
                    risk_level: $risk,
                    payback_period: $payback,
                    strategic_value: $strategic,
                    technical_complexity: $complexity,
                    created_at: datetime()
                })
            """,
            tech_id=tech_name,
            name=tech_name.replace('_', ' ').title(),
            investment=tech_data["initial_investment"],
            roi=tech_data["expected_roi"],
            risk=tech_data["risk_level"],
            payback=tech_data["payback_period"],
            strategic=tech_data["strategic_value"],
            complexity=tech_data["technical_complexity"])
        
        # Create constraint nodes
        constraints = data["portfolio_constraints"]
        session.run("""
            CREATE (c:Constraint {
                id: 'portfolio_constraints',
                name: 'Portfolio Constraints',
                max_high_risk: $max_risk,
                min_strategic_value: $min_strategic,
                max_payback_period: $max_payback,
                diversification_required: $diversification,
                created_at: datetime()
            })
        """,
        max_risk=constraints["max_high_risk"],
        min_strategic=constraints["min_strategic_value"],
        max_payback=constraints["max_payback_period"],
        diversification=constraints["diversification_requirement"])
        
        # Create relationships
        session.run("""
            MATCH (p:Portfolio {id: 'tech_investment_portfolio'})
            MATCH (t:Technology)
            CREATE (p)-[:CONSIDERS]->(t)
        """)
        
        session.run("""
            MATCH (p:Portfolio {id: 'tech_investment_portfolio'})
            MATCH (c:Constraint {id: 'portfolio_constraints'})
            CREATE (p)-[:SUBJECT_TO]->(c)
        """)

    async def test_statistical_service(self, scenario: TestScenario) -> ServiceResult:
        """Test statistical analysis with scenario data"""
        logger.info(f"📊 Testing Statistical Service with {scenario.name}")
        start_time = time.time()
        errors = []
        
        try:
            # Prepare statistical analysis payload
            payload = {
                "task_name": f"statistical_analysis_{scenario.name}",
                "task_description": f"Statistical analysis for {scenario.description}",
                "variables": scenario.data
            }
            
            response = requests.post(
                f"{self.services['statistical']}/process_task",
                json=payload,
                timeout=30
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result_data = response.json()
                
                # Validate expected outcomes
                result = result_data.get("result", {})
                data_points = result.get("data_points", 0)
                expected_points = scenario.expected_outcomes.get("statistical_data_points", 0)
                
                if data_points < expected_points * 0.8:  # Allow 20% tolerance
                    errors.append(f"Data points {data_points} below expected {expected_points}")
                
                return ServiceResult(
                    service_name="statistical",
                    success=True,
                    response_time_ms=response_time,
                    data=result_data,
                    errors=errors
                )
            else:
                errors.append(f"HTTP {response.status_code}: {response.text}")
                return ServiceResult(
                    service_name="statistical",
                    success=False,
                    response_time_ms=response_time,
                    data={},
                    errors=errors
                )
                
        except Exception as e:
            errors.append(f"Statistical service error: {str(e)}")
            return ServiceResult(
                service_name="statistical",
                success=False,
                response_time_ms=(time.time() - start_time) * 1000,
                data={},
                errors=errors
            )

    async def test_neo4j_service(self, scenario: TestScenario) -> ServiceResult:
        """Test Neo4j graph analysis with scenario data"""
        logger.info(f"🔗 Testing Neo4j Service with {scenario.name}")
        start_time = time.time()
        errors = []
        
        try:
            # Test multiple analysis types
            analysis_results = {}
            
            # 1. Centrality Analysis
            centrality_payload = {
                "task_name": f"centrality_analysis_{scenario.name}",
                "task_description": f"Centrality analysis for {scenario.description}",
                "variables": {
                    "analysis_type": "centrality",
                    "algorithm": "pagerank"
                }
            }
            
            response = requests.post(
                f"{self.services['neo4j']}/process_task",
                json=centrality_payload,
                timeout=30
            )
            
            if response.status_code == 200:
                analysis_results["centrality"] = response.json()
            else:
                errors.append(f"Centrality analysis failed: HTTP {response.status_code}")
            
            # 2. Community Detection
            community_payload = {
                "task_name": f"community_detection_{scenario.name}",
                "variables": {
                    "analysis_type": "communities",
                    "relationship_types": ["HAS_ALTERNATIVE", "INVOLVES_STAKEHOLDER", "EVALUATED_BY"]
                }
            }
            
            response = requests.post(
                f"{self.services['neo4j']}/process_task",
                json=community_payload,
                timeout=30
            )
            
            if response.status_code == 200:
                analysis_results["community"] = response.json()
            else:
                errors.append(f"Community detection failed: HTTP {response.status_code}")
            
            # 3. Structure Analysis
            structure_payload = {
                "task_name": f"structure_analysis_{scenario.name}",
                "variables": {
                    "analysis_type": "structure"
                }
            }
            
            response = requests.post(
                f"{self.services['neo4j']}/process_task",
                json=structure_payload,
                timeout=30
            )
            
            if response.status_code == 200:
                analysis_results["structure"] = response.json()
            else:
                errors.append(f"Structure analysis failed: HTTP {response.status_code}")
            
            response_time = (time.time() - start_time) * 1000
            
            return ServiceResult(
                service_name="neo4j",
                success=len(errors) == 0,
                response_time_ms=response_time,
                data=analysis_results,
                errors=errors
            )
            
        except Exception as e:
            errors.append(f"Neo4j service error: {str(e)}")
            return ServiceResult(
                service_name="neo4j",
                success=False,
                response_time_ms=(time.time() - start_time) * 1000,
                data={},
                errors=errors
            )

    async def test_script_execution_service(self, scenario: TestScenario) -> ServiceResult:
        """Test script execution with scenario-specific validation scripts"""
        logger.info(f"🔧 Testing Script Execution Service with {scenario.name}")
        start_time = time.time()
        errors = []
        
        try:
            # Generate scenario-specific validation script
            script_payload = {
                "task_name": f"validation_script_{scenario.name}",
                "task_description": f"Generate validation script for {scenario.description}",
                "variables": {
                    "operation": "generate_validation_script",
                    "analysis_type": "decision_validation",
                    "scenario_data": scenario.data,
                    "expected_outcomes": scenario.expected_outcomes
                }
            }
            
            response = requests.post(
                f"{self.services['script_execution']}/process_task",
                json=script_payload,
                timeout=45
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result_data = response.json()
                
                # Validate script generation
                result = result_data.get("result", {})
                script_content = result.get("script_generated", "")
                
                if not script_content or len(script_content) < 500:
                    errors.append("Generated script too short or empty")
                
                # Check execution results
                execution_results = result.get("execution_results", {})
                if not execution_results.get("success", False):
                    errors.append("Script execution failed")
                
                return ServiceResult(
                    service_name="script_execution",
                    success=len(errors) == 0,
                    response_time_ms=response_time,
                    data=result_data,
                    errors=errors
                )
            else:
                errors.append(f"HTTP {response.status_code}: {response.text}")
                return ServiceResult(
                    service_name="script_execution",
                    success=False,
                    response_time_ms=response_time,
                    data={},
                    errors=errors
                )
                
        except Exception as e:
            errors.append(f"Script execution service error: {str(e)}")
            return ServiceResult(
                service_name="script_execution",
                success=False,
                response_time_ms=(time.time() - start_time) * 1000,
                data={},
                errors=errors
            )

    async def run_integration_workflow(self, scenario: TestScenario) -> Dict[str, Any]:
        """Run complete integration workflow for a scenario"""
        logger.info(f"🚀 Running integration workflow for: {scenario.name}")
        workflow_start = time.time()
        
        # Step 1: Setup Neo4j test data
        neo4j_setup_success = self.clear_and_setup_neo4j_test_data(scenario)
        
        # Step 2: Test all services
        statistical_result = await self.test_statistical_service(scenario)
        neo4j_result = await self.test_neo4j_service(scenario)
        script_result = await self.test_script_execution_service(scenario)
        
        # Step 3: Evaluate integration
        integration_success = (
            neo4j_setup_success and
            statistical_result.success and
            neo4j_result.success and
            script_result.success
        )
        
        workflow_time = (time.time() - workflow_start) * 1000
        
        return {
            "scenario": scenario.name,
            "description": scenario.description,
            "neo4j_setup_success": neo4j_setup_success,
            "integration_success": integration_success,
            "total_workflow_time_ms": workflow_time,
            "service_results": {
                "statistical": {
                    "success": statistical_result.success,
                    "response_time_ms": statistical_result.response_time_ms,
                    "data_points": statistical_result.data.get("result", {}).get("data_points", 0),
                    "errors": statistical_result.errors
                },
                "neo4j": {
                    "success": neo4j_result.success,
                    "response_time_ms": neo4j_result.response_time_ms,
                    "analyses_completed": len(neo4j_result.data),
                    "errors": neo4j_result.errors
                },
                "script_execution": {
                    "success": script_result.success,
                    "response_time_ms": script_result.response_time_ms,
                    "script_length": len(script_result.data.get("result", {}).get("script_generated", "")),
                    "errors": script_result.errors
                }
            }
        }

    async def run_comprehensive_tests(self):
        """Run all comprehensive integration tests"""
        logger.info("🎯 Starting Comprehensive MCP Integration Tests")
        logger.info("=" * 80)
        
        # Create test scenarios
        scenarios = self.create_comprehensive_test_scenarios()
        logger.info(f"📋 Created {len(scenarios)} comprehensive test scenarios")
        
        # Test each scenario
        for i, scenario in enumerate(scenarios, 1):
            logger.info(f"\n📊 SCENARIO {i}/{len(scenarios)}: {scenario.name.upper()}")
            logger.info("-" * 60)
            logger.info(f"Description: {scenario.description}")
            
            # Run integration workflow
            workflow_result = await self.run_integration_workflow(scenario)
            self.test_results["scenarios"][scenario.name] = workflow_result
            
            # Log results
            if workflow_result["integration_success"]:
                logger.info("✅ Integration workflow completed successfully")
            else:
                logger.warning("⚠️ Integration workflow had issues")
                for service, result in workflow_result["service_results"].items():
                    if result["errors"]:
                        logger.warning(f"  {service}: {result['errors']}")
        
        # Generate final summary
        await self.generate_final_report()

    async def generate_final_report(self):
        """Generate comprehensive final test report"""
        logger.info("\n" + "=" * 80)
        logger.info("📊 COMPREHENSIVE MCP INTEGRATION TEST REPORT")
        logger.info("=" * 80)
        
        # Calculate summary statistics
        total_scenarios = len(self.test_results["scenarios"])
        successful_scenarios = sum(1 for result in self.test_results["scenarios"].values() 
                                 if result["integration_success"])
        
        total_service_tests = total_scenarios * 3  # 3 services per scenario
        successful_service_tests = 0
        total_response_time = 0
        service_performance = {"statistical": [], "neo4j": [], "script_execution": []}
        
        for scenario_result in self.test_results["scenarios"].values():
            for service, result in scenario_result["service_results"].items():
                if result["success"]:
                    successful_service_tests += 1
                total_response_time += result["response_time_ms"]
                service_performance[service].append(result["response_time_ms"])
        
        # Overall summary
        success_rate = (successful_scenarios / total_scenarios) * 100
        service_success_rate = (successful_service_tests / total_service_tests) * 100
        avg_response_time = total_response_time / total_service_tests
        
        logger.info(f"📈 OVERALL PERFORMANCE:")
        logger.info(f"  • Total Scenarios: {total_scenarios}")
        logger.info(f"  • Successful Scenarios: {successful_scenarios} ({success_rate:.1f}%)")
        logger.info(f"  • Service Tests: {successful_service_tests}/{total_service_tests} ({service_success_rate:.1f}%)")
        logger.info(f"  • Average Response Time: {avg_response_time:.1f}ms")
        
        # Service performance breakdown
        logger.info(f"\n🔧 SERVICE PERFORMANCE BREAKDOWN:")
        for service, times in service_performance.items():
            if times:
                avg_time = np.mean(times)
                min_time = np.min(times)
                max_time = np.max(times)
                logger.info(f"  • {service.upper()}: {avg_time:.1f}ms avg (range: {min_time:.1f}-{max_time:.1f}ms)")
        
        # Scenario results
        logger.info(f"\n📋 SCENARIO RESULTS:")
        for scenario_name, result in self.test_results["scenarios"].items():
            status = "✅ SUCCESS" if result["integration_success"] else "❌ FAILED"
            time_ms = result["total_workflow_time_ms"]
            logger.info(f"  • {scenario_name}: {status} ({time_ms:.0f}ms)")
        
        # Detailed error analysis
        all_errors = []
        for scenario_result in self.test_results["scenarios"].values():
            for service, result in scenario_result["service_results"].items():
                all_errors.extend(result["errors"])
        
        if all_errors:
            logger.info(f"\n⚠️ ISSUES IDENTIFIED:")
            for error in set(all_errors):  # Unique errors only
                logger.info(f"  • {error}")
        else:
            logger.info(f"\n🎉 NO ISSUES IDENTIFIED - ALL TESTS PASSED!")
        
        # Save detailed results
        self.test_results["summary"] = {
            "total_scenarios": total_scenarios,
            "successful_scenarios": successful_scenarios,
            "success_rate": success_rate,
            "service_success_rate": service_success_rate,
            "average_response_time_ms": avg_response_time,
            "service_performance": {
                service: {
                    "avg_response_time_ms": np.mean(times) if times else 0,
                    "min_response_time_ms": np.min(times) if times else 0,
                    "max_response_time_ms": np.max(times) if times else 0
                }
                for service, times in service_performance.items()
            },
            "total_errors": len(all_errors),
            "unique_errors": list(set(all_errors))
        }
        
        self.test_results["end_time"] = datetime.now().isoformat()
        
        # Save to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"mcp_comprehensive_test_results_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            json.dump(self.test_results, f, indent=2, default=str)
        
        logger.info(f"\n📁 Detailed results saved to: {results_file}")
        
        # Final status
        if successful_scenarios == total_scenarios and len(all_errors) == 0:
            logger.info("\n🎯 COMPREHENSIVE INTEGRATION TEST: ✅ COMPLETE SUCCESS!")
            logger.info("🚀 All MCP services are fully operational and ready for production!")
        else:
            logger.info(f"\n⚠️ COMPREHENSIVE INTEGRATION TEST: PARTIAL SUCCESS")
            logger.info(f"🔧 {total_scenarios - successful_scenarios} scenarios need attention")

async def main():
    """Main test execution function"""
    print("🚀 DADM MCP Services - Comprehensive Final Integration Test")
    print("=" * 80)
    print("This comprehensive test will:")
    print("  1. Create realistic decision-making scenarios")
    print("  2. Set up complex test data in Neo4j") 
    print("  3. Test statistical analysis on multi-dimensional datasets")
    print("  4. Perform graph analytics on decision networks")
    print("  5. Generate and execute validation scripts")
    print("  6. Validate end-to-end integration workflows")
    print("  7. Generate detailed performance reports")
    print("=" * 80)
    
    # Initialize tester
    tester = ComprehensiveMCPTester()
    
    try:
        # Run comprehensive tests
        await tester.run_comprehensive_tests()
        
    except KeyboardInterrupt:
        logger.info("\n🛑 Test interrupted by user")
        return False
    except Exception as e:
        logger.error(f"\n❌ Test execution failed: {e}")
        return False
    finally:
        # Cleanup
        if tester.neo4j_driver:
            tester.neo4j_driver.close()
    
    return True

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
