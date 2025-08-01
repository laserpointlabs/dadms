#!/bin/bash

# DADMS Branch Creation Helper Script
# Ensures proper branch naming and prevents direct work on main

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    echo -e "${BLUE}🌿 DADMS Branch Creation Helper${NC}"
    echo ""
    echo "Usage: $0 [type] [description]"
    echo ""
    echo "Branch Types:"
    echo "  feature     - New features or enhancements"
    echo "  fix         - Bug fixes"
    echo "  docs        - Documentation updates"
    echo "  infra       - Infrastructure changes"
    echo "  experiment  - Research or experimental work"
    echo ""
    echo "Examples:"
    echo "  $0 feature user-authentication"
    echo "  $0 fix neo4j-startup-issues"
    echo "  $0 docs api-documentation"
    echo "  $0 infra docker-optimization"
    echo "  $0 experiment ml-integration"
    echo ""
}

check_main_branch() {
    current_branch=$(git branch --show-current)
    if [ "$current_branch" = "main" ] || [ "$current_branch" = "master" ]; then
        echo -e "${GREEN}✅ Currently on main branch - good practice to create feature branch${NC}"
    else
        echo -e "${YELLOW}⚠️  Currently on branch: $current_branch${NC}"
        echo -e "${YELLOW}   Consider if you need a new branch or can continue on this one${NC}"
        read -p "Continue creating new branch? (y/N): " confirm
        if [[ ! $confirm =~ ^[Yy]$ ]]; then
            echo "Cancelled."
            exit 0
        fi
    fi
}

validate_branch_name() {
    local branch_name="$1"
    
    # Check for valid characters (alphanumeric, hyphens, underscores, and slashes for branch prefixes)
    if [[ ! $branch_name =~ ^[a-zA-Z0-9_/-]+$ ]]; then
        echo -e "${RED}❌ Branch name can only contain letters, numbers, hyphens, underscores, and slashes${NC}"
        exit 1
    fi
    
    # Check length
    if [ ${#branch_name} -gt 50 ]; then
        echo -e "${RED}❌ Branch name too long (max 50 characters)${NC}"
        exit 1
    fi
    
    # Check if branch already exists
    if git show-ref --verify --quiet refs/heads/"$branch_name"; then
        echo -e "${RED}❌ Branch '$branch_name' already exists${NC}"
        echo -e "${YELLOW}💡 Use: git checkout $branch_name${NC}"
        exit 1
    fi
}

create_branch() {
    local branch_type="$1"
    local description="$2"
    local branch_name="${branch_type}/${description}"
    
    echo -e "${BLUE}🌿 Creating branch: $branch_name${NC}"
    
    validate_branch_name "$branch_name"
    
    # Create and switch to the new branch
    git checkout -b "$branch_name"
    
    echo -e "${GREEN}✅ Successfully created and switched to branch: $branch_name${NC}"
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo "  1. Make your changes"
    echo "  2. Commit regularly: git add . && git commit -m 'descriptive message'"
    echo "  3. Push when ready: git push -u origin $branch_name"
    echo "  4. Create PR when complete"
    echo ""
    echo -e "${YELLOW}💡 Remember: Keep commits focused and descriptive${NC}"
}

main() {
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "${RED}❌ Not in a git repository${NC}"
        exit 1
    fi
    
    # Check for arguments
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_help
        exit 0
    fi
    
    if [ $# -ne 2 ]; then
        echo -e "${RED}❌ Invalid arguments${NC}"
        echo ""
        show_help
        exit 1
    fi
    
    local branch_type="$1"
    local description="$2"
    
    # Validate branch type
    case "$branch_type" in
        feature|fix|docs|infra|experiment)
            ;;
        *)
            echo -e "${RED}❌ Invalid branch type: $branch_type${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
    
    # Sanitize description (replace spaces with hyphens, lowercase)
    description=$(echo "$description" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr '_' '-')
    
    check_main_branch
    create_branch "$branch_type" "$description"
}

main "$@"