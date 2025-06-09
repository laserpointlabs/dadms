# Configuration for Camunda Engine

CAMUNDA_ENGINE_URL = "http://localhost:8080/engine-rest"
# Define other Camunda related configurations here if needed
# For example, worker ID, polling interval, etc.
WORKER_ID = "dadm-worker"
POLL_INTERVAL = 1000  # in milliseconds

# Worker task configuration
MAX_TASKS = 1  # Default for sequential workflows
MAX_TASKS_PARALLEL = 6  # For parallel workflows (supports up to 6 concurrent tasks)

# Parallel workflow detection
PARALLEL_PROCESS_NAMES = [
    "Advanced_Decision_Process",
    "Advanced Decision Analysis Process"
]
