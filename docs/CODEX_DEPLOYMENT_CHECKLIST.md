# DADM Codex Deployment Checklist

## Pre-Deployment (on your local machine)
- [ ] All tests pass: `python -m unittest discover -s tests`
- [ ] setup.py works: `python setup.py check`
- [ ] Requirements are updated: Check `requirements.txt`
- [ ] Documentation is current: Review `README.md`

## On Codex Server
- [ ] Upload project files to Codex
- [ ] Check Python version: `python3 --version` (need 3.10+)
- [ ] Make scripts executable: `chmod +x setup_linux.sh`
- [ ] Run setup: `./setup_linux.sh`
- [ ] Activate environment: `source .venv/bin/activate`
- [ ] Test installation: `dadm --help`
- [ ] Run tests: `python -m unittest discover -s tests`

## Post-Deployment Verification
- [ ] All services start correctly
- [ ] BPMN processes can be deployed
- [ ] Database connections work
- [ ] OpenAI integration functions
- [ ] Logging works properly

## Quick Commands for Codex
```bash
# Setup
chmod +x setup_linux.sh
./setup_linux.sh

# Activate and test
source .venv/bin/activate
python -c "import src; print('DADM imported successfully')"
dadm --help
python -m unittest discover -s tests

# Start using DADM
dadm-deploy-bpmn camunda_models/echo_test_process.bpmn
```

## Troubleshooting

### If setup_linux.sh fails:
```bash
# Manual setup
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install -e .
```

### If tests fail:
```bash
# Check individual components
python -c "import src; import config; import scripts"
python -c "from src.assistant_id_manager import AssistantIDManager"
python -c "from src.service_orchestrator import ServiceOrchestrator"
```

### If commands not found:
```bash
# Check if installed correctly
pip list | grep dadm
which dadm
```

## Success Indicators
- No errors during setup
- All tests pass
- Commands `dadm` and `dadm-deploy-bpmn` work
- Can import all project modules
- BPMN deployment works