#!/bin/bash
# Check and fix BPMN files before deployment

set -e

# Determine project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MODELS_DIR="$PROJECT_ROOT/camunda_models"

# Define colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}BPMN Deployment Helper${NC}"
echo "This script helps validate, fix, and deploy BPMN models."
echo ""

# Parse command-line options
ALL=false
MODEL=""
SERVER="http://localhost:8080"
SKIP_VALIDATION=false
SKIP_FIX=false
SKIP_DEPLOY=false

print_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -a, --all                Deploy all BPMN models"
    echo "  -m, --model FILENAME     Deploy a specific BPMN model"
    echo "  -s, --server URL         Camunda server URL (default: http://localhost:8080)"
    echo "  --skip-validation        Skip validation step"
    echo "  --skip-fix               Skip automatic fixing step"
    echo "  --skip-deploy            Skip deployment step (validate and fix only)"
    echo "  -h, --help               Display this help message"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -a|--all)
            ALL=true
            shift
            ;;
        -m|--model)
            MODEL="$2"
            shift 2
            ;;
        -s|--server)
            SERVER="$2"
            shift 2
            ;;
        --skip-validation)
            SKIP_VALIDATION=true
            shift
            ;;
        --skip-fix)
            SKIP_FIX=true
            shift
            ;;
        --skip-deploy)
            SKIP_DEPLOY=true
            shift
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            print_usage
            exit 1
            ;;
    esac
done

# Check required arguments
if [[ "$ALL" == "false" && -z "$MODEL" ]]; then
    echo -e "${RED}Error: Either --all or --model must be specified${NC}"
    print_usage
    exit 1
fi

# Step 1: Validate
if [[ "$SKIP_VALIDATION" == "false" ]]; then
    echo -e "${BLUE}Step 1: Validating BPMN models${NC}"
    
    if [[ "$ALL" == "true" ]]; then
        python "$SCRIPT_DIR/validate_bpmn.py" --all
    else
        MODEL_PATH="$MODELS_DIR/$MODEL"
        if [[ ! "$MODEL" == *".bpmn" ]]; then
            MODEL_PATH="$MODEL_PATH.bpmn"
        fi
        python "$SCRIPT_DIR/validate_bpmn.py" --model "$MODEL_PATH"
    fi
    
    # Check validation result
    VALIDATION_RESULT=$?
    
    if [[ $VALIDATION_RESULT -ne 0 ]]; then
        echo -e "${YELLOW}Validation found issues. Attempting to fix...${NC}"
    else
        echo -e "${GREEN}Validation successful!${NC}"
    fi
else
    echo -e "${YELLOW}Skipping validation step${NC}"
fi

# Step 2: Fix if needed
if [[ "$SKIP_FIX" == "false" ]]; then
    echo -e "${BLUE}Step 2: Fixing BPMN models if needed${NC}"
    
    if [[ "$ALL" == "true" ]]; then
        python "$SCRIPT_DIR/fix_bpmn.py" --all
    else
        MODEL_PATH="$MODELS_DIR/$MODEL"
        if [[ ! "$MODEL" == *".bpmn" ]]; then
            MODEL_PATH="$MODEL_PATH.bpmn"
        fi
        python "$SCRIPT_DIR/fix_bpmn.py" --model "$MODEL_PATH"
    fi
else
    echo -e "${YELLOW}Skipping fix step${NC}"
fi

# Step 3: Deploy
if [[ "$SKIP_DEPLOY" == "false" ]]; then
    echo -e "${BLUE}Step 3: Deploying BPMN models${NC}"
    
    DEPLOY_CMD="python \"$SCRIPT_DIR/deploy_bpmn.py\" -s \"$SERVER\""
    
    if [[ "$ALL" == "true" ]]; then
        DEPLOY_CMD="$DEPLOY_CMD --all"
    else
        DEPLOY_CMD="$DEPLOY_CMD --model \"$MODEL\""
    fi
    
    echo "Running: $DEPLOY_CMD"
    eval $DEPLOY_CMD
    
    DEPLOY_RESULT=$?
    
    if [[ $DEPLOY_RESULT -eq 0 ]]; then
        echo -e "${GREEN}Deployment completed successfully!${NC}"
    else
        echo -e "${RED}Deployment encountered errors.${NC}"
        exit $DEPLOY_RESULT
    fi
else
    echo -e "${YELLOW}Skipping deployment step${NC}"
fi

echo -e "${GREEN}All steps completed!${NC}"