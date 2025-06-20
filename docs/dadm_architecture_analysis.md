# DADM Architecture Analysis - Current System

**Date:** June 20, 2025  
**Purpose:** Architectural overview showing current servers, endpoints, and potential risks

## Current Architecture Diagram (draw.io XML)

```xml
<mxfile host="app.diagrams.net" modified="2025-06-20T00:00:00.000Z" agent="5.0" etag="Architecture-Analysis" version="20.8.16" type="device">
  <diagram name="DADM-Architecture-Current" id="dadm-arch-current">
    <mxGraphModel dx="2074" dy="1114" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1200" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        
        <!-- Title -->
        <mxCell id="title" value="DADM - Current Architecture &amp; Risk Analysis" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=24;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="600" y="20" width="400" height="40" as="geometry" />
        </mxCell>
        
        <!-- Legend -->
        <mxCell id="legend-bg" value="" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8f9fa;strokeColor=#dee2e6;" vertex="1" parent="1">
          <mxGeometry x="20" y="80" width="200" height="200" as="geometry" />
        </mxCell>
        <mxCell id="legend-title" value="Legend" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=14;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="80" y="90" width="80" height="20" as="geometry" />
        </mxCell>
        <mxCell id="legend-frontend" value="Frontend Components" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="30" y="120" width="180" height="20" as="geometry" />
        </mxCell>
        <mxCell id="legend-backend" value="Backend Services" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="30" y="150" width="180" height="20" as="geometry" />
        </mxCell>
        <mxCell id="legend-external" value="External Services" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="30" y="180" width="180" height="20" as="geometry" />
        </mxCell>
        <mxCell id="legend-database" value="Databases" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;" vertex="1" parent="1">
          <mxGeometry x="30" y="210" width="180" height="20" as="geometry" />
        </mxCell>
        <mxCell id="legend-risk" value="⚠️ High Risk Areas" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffcccc;strokeColor=#ff0000;strokeWidth=2;" vertex="1" parent="1">
          <mxGeometry x="30" y="240" width="180" height="20" as="geometry" />
        </mxCell>
        
        <!-- Frontend Layer -->
        <mxCell id="frontend-layer" value="Frontend Layer" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=16;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="300" y="120" width="1200" height="40" as="geometry" />
        </mxCell>
        
        <!-- React UI Components -->
        <mxCell id="react-ui" value="React UI&#xa;(Port 3000)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="320" y="180" width="140" height="80" as="geometry" />
        </mxCell>
        
        <!-- CLI API Server -->
        <mxCell id="cli-api-server" value="CLI API Server&#xa;(Node.js)&#xa;Port: Dynamic" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="500" y="180" width="140" height="80" as="geometry" />
        </mxCell>
        
        <!-- BPMN Viewer -->
        <mxCell id="bpmn-viewer" value="BPMN Viewer&#xa;(bpmn.js)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="680" y="180" width="140" height="80" as="geometry" />
        </mxCell>
        
        <!-- Backend Services Layer -->
        <mxCell id="backend-layer" value="Backend Services Layer" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=16;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="300" y="320" width="1200" height="40" as="geometry" />
        </mxCell>
        
        <!-- Main DADM App -->
        <mxCell id="dadm-app" value="DADM Main App&#xa;(Python Flask)&#xa;Camunda Worker&#xa;⚠️ Multiple Responsibilities" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffcccc;strokeColor=#ff0000;strokeWidth=2;" vertex="1" parent="1">
          <mxGeometry x="320" y="380" width="160" height="100" as="geometry" />
        </mxCell>
        
        <!-- OpenAI Service -->
        <mxCell id="openai-service" value="OpenAI Service&#xa;(Flask)&#xa;Port: 5000&#xa;Assistant API" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="520" y="380" width="140" height="100" as="geometry" />
        </mxCell>
        
        <!-- Echo Service -->
        <mxCell id="echo-service" value="Echo Service&#xa;(Flask)&#xa;Port: 5100&#xa;Test Service" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="700" y="380" width="140" height="100" as="geometry" />
        </mxCell>
        
        <!-- Service Monitor -->
        <mxCell id="service-monitor" value="Service Monitor&#xa;(Flask)&#xa;Port: 5200&#xa;Health Checks" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="880" y="380" width="140" height="100" as="geometry" />
        </mxCell>
        
        <!-- Consul Service Registry -->
        <mxCell id="consul" value="Consul&#xa;Service Registry&#xa;Port: 8500&#xa;⚠️ Single Point of Failure" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffcccc;strokeColor=#ff0000;strokeWidth=2;" vertex="1" parent="1">
          <mxGeometry x="1060" y="380" width="140" height="100" as="geometry" />
        </mxCell>
        
        <!-- External Services Layer -->
        <mxCell id="external-layer" value="External Services" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=16;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="300" y="540" width="1200" height="40" as="geometry" />
        </mxCell>
        
        <!-- Camunda BPM -->
        <mxCell id="camunda" value="Camunda BPM&#xa;Port: 8080&#xa;Process Engine&#xa;⚠️ Heavy Resource Usage" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="320" y="600" width="160" height="100" as="geometry" />
        </mxCell>
        
        <!-- OpenAI API -->
        <mxCell id="openai-api" value="OpenAI API&#xa;External Service&#xa;⚠️ Rate Limits&#xa;⚠️ Cost Management" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffcccc;strokeColor=#ff0000;strokeWidth=2;" vertex="1" parent="1">
          <mxGeometry x="520" y="600" width="140" height="100" as="geometry" />
        </mxCell>
        
        <!-- Database Layer -->
        <mxCell id="database-layer" value="Database Layer" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=16;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="300" y="760" width="1200" height="40" as="geometry" />
        </mxCell>
        
        <!-- PostgreSQL -->
        <mxCell id="postgres" value="PostgreSQL&#xa;Port: 5432&#xa;Camunda Data&#xa;⚠️ No Backup Strategy" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffcccc;strokeColor=#ff0000;strokeWidth=2;" vertex="1" parent="1">
          <mxGeometry x="320" y="820" width="140" height="100" as="geometry" />
        </mxCell>
        
        <!-- Qdrant Vector DB -->
        <mxCell id="qdrant" value="Qdrant Vector DB&#xa;Port: 6333&#xa;Vector Storage" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;" vertex="1" parent="1">
          <mxGeometry x="500" y="820" width="140" height="100" as="geometry" />
        </mxCell>
        
        <!-- Neo4j Graph DB -->
        <mxCell id="neo4j" value="Neo4j Graph DB&#xa;Port: 7474/7687&#xa;Knowledge Graph" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;" vertex="1" parent="1">
          <mxGeometry x="680" y="820" width="140" height="100" as="geometry" />
        </mxCell>
        
        <!-- Analysis Storage -->
        <mxCell id="analysis-storage" value="Analysis Storage&#xa;SQLite Files&#xa;⚠️ File-based Storage" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffcccc;strokeColor=#ff0000;strokeWidth=2;" vertex="1" parent="1">
          <mxGeometry x="860" y="820" width="140" height="100" as="geometry" />
        </mxCell>
        
        <!-- Connections -->
        <!-- React to CLI API -->
        <mxCell id="conn1" value="REST API" style="endArrow=classic;html=1;rounded=0;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;" edge="1" parent="1" source="react-ui" target="cli-api-server">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="470" y="230" as="sourcePoint" />
            <mxPoint x="520" y="180" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        
        <!-- CLI API to DADM App -->
        <mxCell id="conn2" value="Command&#xa;Execution" style="endArrow=classic;html=1;rounded=0;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;" edge="1" parent="1" source="cli-api-server" target="dadm-app">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="470" y="230" as="sourcePoint" />
            <mxPoint x="520" y="180" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        
        <!-- DADM App to OpenAI Service -->
        <mxCell id="conn3" value="Service&#xa;Discovery" style="endArrow=classic;html=1;rounded=0;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;" edge="1" parent="1" source="dadm-app" target="openai-service">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="470" y="430" as="sourcePoint" />
            <mxPoint x="520" y="380" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        
        <!-- Services to Consul -->
        <mxCell id="conn4" value="Registration" style="endArrow=classic;html=1;rounded=0;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;" edge="1" parent="1" source="consul" target="backend-layer">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="1130" y="370" as="sourcePoint" />
            <mxPoint x="1130" y="320" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        
        <!-- DADM App to Camunda -->
        <mxCell id="conn5" value="External Task&#xa;Worker" style="endArrow=classic;html=1;rounded=0;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;" edge="1" parent="1" source="dadm-app" target="camunda">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="400" y="490" as="sourcePoint" />
            <mxPoint x="400" y="590" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        
        <!-- OpenAI Service to OpenAI API -->
        <mxCell id="conn6" value="API Calls" style="endArrow=classic;html=1;rounded=0;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;" edge="1" parent="1" source="openai-service" target="openai-api">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="590" y="490" as="sourcePoint" />
            <mxPoint x="590" y="590" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        
        <!-- Camunda to PostgreSQL -->
        <mxCell id="conn7" value="JDBC" style="endArrow=classic;html=1;rounded=0;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;" edge="1" parent="1" source="camunda" target="postgres">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="400" y="710" as="sourcePoint" />
            <mxPoint x="390" y="810" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        
        <!-- OpenAI Service to Vector DBs -->
        <mxCell id="conn8" value="Vector&#xa;Operations" style="endArrow=classic;html=1;rounded=0;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;" edge="1" parent="1" source="openai-service" target="qdrant">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="590" y="490" as="sourcePoint" />
            <mxPoint x="570" y="810" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        
        <mxCell id="conn9" value="Graph&#xa;Operations" style="endArrow=classic;html=1;rounded=0;exitX=1;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;" edge="1" parent="1" source="openai-service" target="neo4j">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="660" y="490" as="sourcePoint" />
            <mxPoint x="750" y="810" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        
        <!-- DADM App to Analysis Storage -->
        <mxCell id="conn10" value="File I/O" style="endArrow=classic;html=1;rounded=0;exitX=1;exitY=1;exitDx=0;exitDy=0;entryX=0;entryY=0;entryDx=0;entryDy=0;" edge="1" parent="1" source="dadm-app" target="analysis-storage">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="480" y="490" as="sourcePoint" />
            <mxPoint x="860" y="810" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        
        <!-- Risk Assessment Panel -->
        <mxCell id="risk-panel" value="" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="1250" y="180" width="320" height="740" as="geometry" />
        </mxCell>
        
        <mxCell id="risk-title" value="⚠️ Identified Risks &amp; Issues" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=18;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1270" y="190" width="280" height="30" as="geometry" />
        </mxCell>
        
        <mxCell id="risk1" value="1. ARCHITECTURE COUPLING" style="text;html=1;strokeColor=none;fillColor=#ffcccc;align=left;verticalAlign=top;whiteSpace=wrap;rounded=1;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1270" y="230" width="280" height="20" as="geometry" />
        </mxCell>
        <mxCell id="risk1-detail" value="• DADM App has multiple responsibilities&#xa;• Tight coupling between UI and backend&#xa;• No clear separation of concerns&#xa;• Hard to scale individual components" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="1280" y="255" width="260" height="60" as="geometry" />
        </mxCell>
        
        <mxCell id="risk2" value="2. SINGLE POINTS OF FAILURE" style="text;html=1;strokeColor=none;fillColor=#ffcccc;align=left;verticalAlign=top;whiteSpace=wrap;rounded=1;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1270" y="325" width="280" height="20" as="geometry" />
        </mxCell>
        <mxCell id="risk2-detail" value="• Consul is critical for service discovery&#xa;• No fallback mechanisms&#xa;• Single PostgreSQL instance&#xa;• No load balancing for services" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="1280" y="350" width="260" height="60" as="geometry" />
        </mxCell>
        
        <mxCell id="risk3" value="3. DATA PERSISTENCE RISKS" style="text;html=1;strokeColor=none;fillColor=#ffcccc;align=left;verticalAlign=top;whiteSpace=wrap;rounded=1;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1270" y="420" width="280" height="20" as="geometry" />
        </mxCell>
        <mxCell id="risk3-detail" value="• No backup strategy defined&#xa;• File-based storage for analysis data&#xa;• No data replication&#xa;• Risk of data loss on container restart" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="1280" y="445" width="260" height="60" as="geometry" />
        </mxCell>
        
        <mxCell id="risk4" value="4. EXTERNAL DEPENDENCIES" style="text;html=1;strokeColor=none;fillColor=#ffcccc;align=left;verticalAlign=top;whiteSpace=wrap;rounded=1;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1270" y="515" width="280" height="20" as="geometry" />
        </mxCell>
        <mxCell id="risk4-detail" value="• OpenAI API rate limits not handled&#xa;• No cost monitoring/controls&#xa;• No fallback for API failures&#xa;• Heavy dependency on external service" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="1280" y="540" width="260" height="60" as="geometry" />
        </mxCell>
        
        <mxCell id="risk5" value="5. SECURITY CONCERNS" style="text;html=1;strokeColor=none;fillColor=#ffcccc;align=left;verticalAlign=top;whiteSpace=wrap;rounded=1;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1270" y="610" width="280" height="20" as="geometry" />
        </mxCell>
        <mxCell id="risk5-detail" value="• API keys in environment variables&#xa;• No authentication on internal services&#xa;• No request validation/sanitization&#xa;• Potential data exposure through logs" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="1280" y="635" width="260" height="60" as="geometry" />
        </mxCell>
        
        <mxCell id="risk6" value="6. SCALABILITY ISSUES" style="text;html=1;strokeColor=none;fillColor=#ffcccc;align=left;verticalAlign=top;whiteSpace=wrap;rounded=1;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1270" y="705" width="280" height="20" as="geometry" />
        </mxCell>
        <mxCell id="risk6-detail" value="• Camunda resource intensive&#xa;• No horizontal scaling strategy&#xa;• File-based storage doesn't scale&#xa;• No caching layer implemented" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="1280" y="730" width="260" height="60" as="geometry" />
        </mxCell>
        
        <mxCell id="risk7" value="7. MONITORING &amp; OBSERVABILITY" style="text;html=1;strokeColor=none;fillColor=#ffcccc;align=left;verticalAlign=top;whiteSpace=wrap;rounded=1;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1270" y="800" width="280" height="20" as="geometry" />
        </mxCell>
        <mxCell id="risk7-detail" value="• Limited health check coverage&#xa;• No centralized logging&#xa;• No performance metrics&#xa;• Difficult to troubleshoot issues" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="1280" y="825" width="260" height="60" as="geometry" />
        </mxCell>
        
        <!-- Endpoint Documentation Panel -->
        <mxCell id="endpoints-panel" value="" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;" vertex="1" parent="1">
          <mxGeometry x="20" y="300" width="250" height="620" as="geometry" />
        </mxCell>
        
        <mxCell id="endpoints-title" value="🔗 API Endpoints" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=16;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="70" y="310" width="150" height="25" as="geometry" />
        </mxCell>
        
        <mxCell id="ui-endpoints" value="CLI API Server Endpoints:" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="30" y="345" width="230" height="20" as="geometry" />
        </mxCell>
        <mxCell id="ui-endpoints-list" value="• GET /api/health&#xa;• POST /api/cli/execute&#xa;• GET /api/cli/commands&#xa;• GET /api/process/definitions&#xa;• GET /api/process/instances&#xa;• POST /api/process/instances/start&#xa;• DELETE /api/process/instances/:id&#xa;• GET /api/analysis/list&#xa;• GET /api/analysis/:id&#xa;• POST /api/openai/chat&#xa;• GET /api/system/status" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fontSize=9;" vertex="1" parent="1">
          <mxGeometry x="40" y="370" width="210" height="140" as="geometry" />
        </mxCell>
        
        <mxCell id="openai-endpoints" value="OpenAI Service Endpoints:" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="30" y="520" width="230" height="20" as="geometry" />
        </mxCell>
        <mxCell id="openai-endpoints-list" value="• GET /health&#xa;• GET /metrics&#xa;• GET /status&#xa;• GET /metadata&#xa;• POST /initialize&#xa;• POST /process_task&#xa;• POST /upload_files&#xa;• GET /files&#xa;• GET /vector_stores" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fontSize=9;" vertex="1" parent="1">
          <mxGeometry x="40" y="545" width="210" height="110" as="geometry" />
        </mxCell>
        
        <mxCell id="echo-endpoints" value="Echo Service Endpoints:" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="30" y="665" width="230" height="20" as="geometry" />
        </mxCell>
        <mxCell id="echo-endpoints-list" value="• GET /health&#xa;• GET /metadata&#xa;• POST /echo&#xa;• POST /process" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fontSize=9;" vertex="1" parent="1">
          <mxGeometry x="40" y="690" width="210" height="50" as="geometry" />
        </mxCell>
        
        <mxCell id="monitor-endpoints" value="Monitor Service Endpoints:" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="30" y="750" width="230" height="20" as="geometry" />
        </mxCell>
        <mxCell id="monitor-endpoints-list" value="• GET /health&#xa;• GET /services&#xa;• GET /services/status" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fontSize=9;" vertex="1" parent="1">
          <mxGeometry x="40" y="775" width="210" height="40" as="geometry" />
        </mxCell>
        
        <mxCell id="external-endpoints" value="External Service Ports:" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="30" y="825" width="230" height="20" as="geometry" />
        </mxCell>
        <mxCell id="external-endpoints-list" value="• Camunda: 8080&#xa;• Consul: 8500&#xa;• PostgreSQL: 5432&#xa;• Qdrant: 6333&#xa;• Neo4j: 7474, 7687" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fontSize=9;" vertex="1" parent="1">
          <mxGeometry x="40" y="850" width="210" height="60" as="geometry" />
        </mxCell>
        
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

## Architecture Analysis Summary

### Current Server Components

1. **Frontend Layer**
   - **React UI** (Port 3000): Main user interface
   - **CLI API Server** (Node.js): REST API bridge to backend
   - **BPMN Viewer** (bpmn.js): Process visualization

2. **Backend Services Layer**
   - **DADM Main App** (Python/Flask): Camunda worker + multiple responsibilities
   - **OpenAI Service** (Flask, Port 5000): AI assistant integration
   - **Echo Service** (Flask, Port 5100): Test service
   - **Service Monitor** (Flask, Port 5200): Health monitoring
   - **Consul** (Port 8500): Service registry/discovery

3. **External Services**
   - **Camunda BPM** (Port 8080): Process engine
   - **OpenAI API**: External AI service

4. **Database Layer**
   - **PostgreSQL** (Port 5432): Camunda data
   - **Qdrant** (Port 6333): Vector database
   - **Neo4j** (Ports 7474/7687): Graph database
   - **Analysis Storage**: SQLite files

### Critical Risks Identified

#### 🚨 High Priority Risks

1. **Architectural Coupling**
   - DADM App has too many responsibilities
   - Tight coupling between components
   - Difficult to scale or modify individual parts

2. **Single Points of Failure**
   - Consul is critical with no fallback
   - Single PostgreSQL instance
   - No redundancy in core services

3. **Data Persistence Risks**
   - No backup strategy implemented
   - File-based storage for critical analysis data
   - Risk of data loss on container failures

4. **External Dependencies**
   - OpenAI API rate limits not handled
   - No cost monitoring or controls
   - No fallback for API failures

#### ⚠️ Medium Priority Risks

5. **Security Concerns**
   - API keys in environment variables
   - No authentication on internal services
   - Potential data exposure through logs

6. **Scalability Issues**
   - Camunda is resource-intensive
   - No horizontal scaling strategy
   - File-based storage doesn't scale

7. **Monitoring & Observability**
   - Limited health check coverage
   - No centralized logging
   - Difficult troubleshooting

### Recommendations for BPMN AI Integration

Given these architectural risks, here are key considerations for adding BPMN AI capabilities:

1. **Decouple Services**: Create dedicated BPMN AI service separate from main app
2. **Add Circuit Breakers**: Implement fallback mechanisms for OpenAI API
3. **Implement Caching**: Add Redis for API response caching
4. **Database Strategy**: Move to proper database for analysis data
5. **Security Layer**: Add authentication and input validation
6. **Monitoring**: Implement comprehensive observability stack

This analysis provides the foundation for safely implementing the BPMN AI integration while addressing existing architectural debt.
