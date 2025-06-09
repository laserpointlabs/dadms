#!/usr/bin/env python3
"""
DADM - Decision Analysis with BPMN, OpenAI, and Neo4j
"""

import os
from setuptools import setup, find_namespace_packages

# Get the version from scripts/__init__.py
version = {}
with open(os.path.join('scripts', '__init__.py')) as f:
    exec(f.read(), version)

# Read requirements from requirements.txt
with open('requirements.txt') as f:
    requirements = []
    for line in f:
        line = line.strip()
        # Skip comments and file path
        if not line or line.startswith('#') or line.startswith('//'):
            continue
        requirements.append(line)

# Read the README for the long description
with open('README.md', 'r', encoding='utf-8') as f:
    long_description = f.read()

setup(
    name="dadm",
    version=version['__version__'],
    description="Decision Analysis with BPMN, OpenAI, and Neo4j",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="John DeHart",
    author_email="jdehart@example.com",  # Replace with your email
    url="https://gitlab.mgmt.internal/jdehart/dadm",
    
    # Package structure - use find_namespace_packages to properly find all packages
    packages=find_namespace_packages(include=['src*', 'scripts*', 'config*']),
    
    # Package data
    include_package_data=True,
    
    # Requirements
    python_requires=">=3.10.0",
    install_requires=requirements,
    
    # Entry points for command-line scripts
    entry_points={
        'console_scripts': [
            'dadm=src.app:main',
            'dadm-deploy-bpmn=scripts.deploy_bpmn:main',
            'dadm-fix-bpmn-ttl=scripts.fix_bpmn_ttl:main',
        ],
    },
    
    # Metadata
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Operating System :: OS Independent",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    keywords="bpmn, decision analysis, openai, neo4j, camunda",
)
