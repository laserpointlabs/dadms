// STEP 1: Open Neo4j Browser (http://localhost:7474)
// STEP 2: Copy and paste these commands one by one

// First, let's see what we have
MATCH (n) RETURN n LIMIT 25;

// Now configure Neo4j Browser to show the 'name' property
// Click on a node in the visualization, then click the settings icon (gear)
// OR use this command:
:style {
  "node": {
    "diameter": "50px",
    "color": "#A5ABB6",
    "border-color": "#9AA1AC",
    "border-width": "2px",
    "text-color-internal": "#FFFFFF",
    "caption": "{name}",
    "font-size": "10px"
  }
}

// Alternative method - configure each node type individually:
:style Stakeholder {
  "caption": "{name}",
  "color": "#FFD700",
  "diameter": "60px"
}

:style Alternative {
  "caption": "{name}",
  "color": "#87CEEB",
  "diameter": "60px"
}

:style Criterion {
  "caption": "{name}",
  "color": "#98FB98",
  "diameter": "60px"
}

:style Recommendation {
  "caption": "{name}",
  "color": "#FFA07A",
  "diameter": "60px"
}

:style Value {
  "caption": "{name}",
  "color": "#DDA0DD",
  "diameter": "40px"
}

:style Analysis {
  "caption": "{name}",
  "color": "#FF6347",
  "diameter": "80px"
}

// After running these, refresh the visualization
MATCH (n) RETURN n LIMIT 25;
