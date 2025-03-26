
from flask import Flask, request, jsonify, redirect, session, url_for, make_response
from flask_cors import CORS
import time
import random
import uuid
import os
import json
from urllib.parse import quote
import base64
import ssl
import requests
import signal
import sys
import atexit

# ... keep existing code (imports and conditionally import SAML libraries)

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=['*'], allow_headers=['Content-Type', 'Authorization'])

# ... keep existing code (session secret key, OAuth configs, mock data)

# Mock sandbox data
sandboxes = [
    {
        "id": "sb-1",
        "name": "Development Sandbox",
        "description": "For testing new features",
        "status": "running",
        "services": [
            {
                "id": "svc-1",
                "sandboxId": "sb-1",
                "name": "api-service",
                "image": "api-service",
                "tag": "latest",
                "status": "running",
                "environmentVariables": {
                    "DB_HOST": "localhost",
                    "DB_PORT": "5432"
                },
                "port": 8000
            },
            {
                "id": "svc-2",
                "sandboxId": "sb-1",
                "name": "frontend",
                "image": "frontend",
                "tag": "v1.0",
                "status": "running",
                "environmentVariables": {
                    "API_URL": "http://api-service:8000"
                },
                "port": 3000
            }
        ],
        "createdAt": "2023-05-10T15:30:00Z",
        "createdBy": "nghodki@cisco.com",
        "updatedAt": "2023-05-15T09:45:00Z"
    },
    {
        "id": "sb-2",
        "name": "QA Environment",
        "description": "For QA testing",
        "status": "failing",
        "services": [
            {
                "id": "svc-3",
                "sandboxId": "sb-2",
                "name": "api-service",
                "image": "api-service",
                "tag": "latest",
                "status": "failing",
                "environmentVariables": {
                    "DB_HOST": "db.example.com",
                    "DB_PORT": "5432"
                },
                "port": 8000
            }
        ],
        "createdAt": "2023-05-12T11:20:00Z",
        "createdBy": "nghodki@cisco.com",
        "updatedAt": "2023-05-16T14:30:00Z"
    }
]

# Mock releases data
releases = [
    {
        "id": "r-1",
        "name": "API Service Update",
        "version": "v1.2.0",
        "status": "deployed",
        "environment": "staging",
        "scheduledDate": "2023-06-15T09:00:00Z",
        "deployedDate": "2023-06-15T10:30:00Z",
        "events": [
            {
                "id": "e-1",
                "releaseId": "r-1",
                "type": "deployment",
                "status": "success",
                "description": "Deployment initiated to staging",
                "timestamp": "2023-06-15T09:00:00Z"
            },
            {
                "id": "e-2",
                "releaseId": "r-1",
                "type": "validation",
                "status": "success",
                "description": "Automated tests passed",
                "timestamp": "2023-06-15T09:15:00Z"
            }
        ]
    },
    {
        "id": "r-2",
        "name": "Frontend Updates",
        "version": "v2.0.1",
        "status": "in-progress",
        "environment": "production",
        "scheduledDate": "2023-06-20T10:00:00Z",
        "events": [
            {
                "id": "e-3",
                "releaseId": "r-2",
                "type": "approval",
                "status": "success",
                "description": "Release approved by team lead",
                "timestamp": "2023-06-19T14:00:00Z"
            },
            {
                "id": "e-4",
                "releaseId": "r-2",
                "type": "deployment",
                "status": "in-progress",
                "description": "Deployment to production started",
                "timestamp": "2023-06-20T10:00:00Z"
            }
        ]
    },
    {
        "id": "r-3",
        "name": "Infrastructure Update",
        "version": "v1.1.0",
        "status": "failed",
        "environment": "production",
        "scheduledDate": "2023-06-18T08:00:00Z",
        "deployedDate": "2023-06-18T08:30:00Z",
        "events": [
            {
                "id": "e-5",
                "releaseId": "r-3",
                "type": "deployment",
                "status": "failure",
                "description": "Database migration failed",
                "timestamp": "2023-06-18T08:30:00Z"
            },
            {
                "id": "e-6",
                "releaseId": "r-3",
                "type": "rollback",
                "status": "success",
                "description": "Rolled back to previous version",
                "timestamp": "2023-06-18T09:00:00Z"
            }
        ]
    }
]

# ... keep existing code (User storage, graceful shutdown function, SAML configuration)

# ... keep existing code (Authentication endpoints, Google OAuth routes, GitHub callback)

# ... keep existing code (Access management endpoints, Logout endpoint, Auth session check)

# ... keep existing code (About API endpoints, Kubernetes endpoints, etc.)

# Sandbox Orchestration API endpoints
@app.route('/api/sandbox/list', methods=['GET'])
def get_sandboxes():
    """Return list of sandboxes for the current user"""
    # In a real app, filter by the authenticated user
    # For demo, we'll return all sandboxes
    return jsonify(sandboxes)

@app.route('/api/sandbox/<sandbox_id>', methods=['GET'])
def get_sandbox_details(sandbox_id):
    """Return details for a specific sandbox"""
    sandbox = next((s for s in sandboxes if s['id'] == sandbox_id), None)
    if not sandbox:
        return jsonify({"error": "Sandbox not found"}), 404
    return jsonify(sandbox)

@app.route('/api/sandbox/create', methods=['POST'])
def create_sandbox():
    """Create a new sandbox"""
    data = request.json
    if not data or 'name' not in data or 'services' not in data:
        return jsonify({"error": "Name and services are required"}), 400
    
    # Create new sandbox
    new_sandbox = {
        "id": f"sb-{str(uuid.uuid4())[:8]}",
        "name": data['name'],
        "description": data.get('description', ''),
        "status": "creating",
        "services": [],
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "createdBy": "nghodki@cisco.com",  # In a real app, use the authenticated user
        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    
    # Add services
    for service_data in data['services']:
        new_service = {
            "id": f"svc-{str(uuid.uuid4())[:8]}",
            "sandboxId": new_sandbox["id"],
            "name": service_data['name'],
            "image": service_data['image'],
            "tag": service_data['tag'],
            "status": "running",
            "environmentVariables": service_data.get('environmentVariables', {}),
            "port": service_data.get('port')
        }
        new_sandbox["services"].append(new_service)
    
    # Update sandbox status based on services
    new_sandbox["status"] = "running" if new_sandbox["services"] else "creating"
    
    # Add to sandboxes list
    sandboxes.append(new_sandbox)
    
    return jsonify(new_sandbox)

@app.route('/api/sandbox/<sandbox_id>', methods=['PUT'])
def update_sandbox(sandbox_id):
    """Update sandbox details"""
    data = request.json
    sandbox = next((s for s in sandboxes if s['id'] == sandbox_id), None)
    if not sandbox:
        return jsonify({"error": "Sandbox not found"}), 404
    
    # Update fields
    if 'name' in data:
        sandbox['name'] = data['name']
    if 'description' in data:
        sandbox['description'] = data['description']
    
    # Update timestamp
    sandbox['updatedAt'] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    return jsonify(sandbox)

@app.route('/api/sandbox/<sandbox_id>', methods=['DELETE'])
def delete_sandbox(sandbox_id):
    """Delete a sandbox"""
    global sandboxes
    sandbox = next((s for s in sandboxes if s['id'] == sandbox_id), None)
    if not sandbox:
        return jsonify({"error": "Sandbox not found"}), 404
    
    # Remove from list
    sandboxes = [s for s in sandboxes if s['id'] != sandbox_id]
    
    return jsonify({"success": True})

@app.route('/api/sandbox/<sandbox_id>/start', methods=['POST'])
def start_sandbox(sandbox_id):
    """Start a sandbox"""
    sandbox = next((s for s in sandboxes if s['id'] == sandbox_id), None)
    if not sandbox:
        return jsonify({"error": "Sandbox not found"}), 404
    
    # Update status
    sandbox['status'] = "running"
    for service in sandbox['services']:
        service['status'] = "running"
    
    # Update timestamp
    sandbox['updatedAt'] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    return jsonify(sandbox)

@app.route('/api/sandbox/<sandbox_id>/stop', methods=['POST'])
def stop_sandbox(sandbox_id):
    """Stop a sandbox"""
    sandbox = next((s for s in sandboxes if s['id'] == sandbox_id), None)
    if not sandbox:
        return jsonify({"error": "Sandbox not found"}), 404
    
    # Update status
    sandbox['status'] = "stopped"
    for service in sandbox['services']:
        service['status'] = "stopped"
    
    # Update timestamp
    sandbox['updatedAt'] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    return jsonify(sandbox)

@app.route('/api/sandbox/<sandbox_id>/service', methods=['POST'])
def add_service(sandbox_id):
    """Add a service to a sandbox"""
    data = request.json
    if not data or 'name' not in data or 'image' not in data or 'tag' not in data:
        return jsonify({"error": "Name, image, and tag are required"}), 400
    
    sandbox = next((s for s in sandboxes if s['id'] == sandbox_id), None)
    if not sandbox:
        return jsonify({"error": "Sandbox not found"}), 404
    
    # Create new service
    new_service = {
        "id": f"svc-{str(uuid.uuid4())[:8]}",
        "sandboxId": sandbox_id,
        "name": data['name'],
        "image": data['image'],
        "tag": data['tag'],
        "status": "running",
        "environmentVariables": data.get('environmentVariables', {}),
        "port": data.get('port')
    }
    
    # Add to sandbox
    sandbox['services'].append(new_service)
    
    # Update timestamp
    sandbox['updatedAt'] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    return jsonify(new_service)

@app.route('/api/sandbox/<sandbox_id>/service/<service_id>', methods=['PUT'])
def update_service(sandbox_id, service_id):
    """Update a service in a sandbox"""
    data = request.json
    sandbox = next((s for s in sandboxes if s['id'] == sandbox_id), None)
    if not sandbox:
        return jsonify({"error": "Sandbox not found"}), 404
    
    service = next((s for s in sandbox['services'] if s['id'] == service_id), None)
    if not service:
        return jsonify({"error": "Service not found"}), 404
    
    # Update fields
    if 'image' in data:
        service['image'] = data['image']
    if 'tag' in data:
        service['tag'] = data['tag']
    if 'environmentVariables' in data:
        service['environmentVariables'] = data['environmentVariables']
    
    # Update timestamp
    sandbox['updatedAt'] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    return jsonify(service)

@app.route('/api/sandbox/<sandbox_id>/service/<service_id>', methods=['DELETE'])
def remove_service(sandbox_id, service_id):
    """Remove a service from a sandbox"""
    sandbox = next((s for s in sandboxes if s['id'] == sandbox_id), None)
    if not sandbox:
        return jsonify({"error": "Sandbox not found"}), 404
    
    # Check if service exists
    service = next((s for s in sandbox['services'] if s['id'] == service_id), None)
    if not service:
        return jsonify({"error": "Service not found"}), 404
    
    # Remove from list
    sandbox['services'] = [s for s in sandbox['services'] if s['id'] != service_id]
    
    # Update timestamp
    sandbox['updatedAt'] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    return jsonify({"success": True})

@app.route('/api/sandbox/chat', methods=['POST'])
def sandbox_chat():
    """Chat with the sandbox orchestration assistant"""
    data = request.json
    if not data or 'message' not in data:
        return jsonify({"error": "Message is required"}), 400
    
    message = data.get('message')
    context = data.get('context', {})
    
    # In a real application, process the message with an LLM
    # For this demo, provide canned responses
    
    responses = [
        "I can help you manage your sandboxes. What would you like to do?",
        "To create a new sandbox, please provide a name and the services you want to include.",
        "Your sandbox is being created. It should be running shortly.",
        "I've updated your sandbox configuration. The changes will take effect momentarily."
    ]
    
    # If context includes a sandbox, add more specific responses
    if 'sandboxId' in context:
        sandbox_id = context['sandboxId']
        sandbox = next((s for s in sandboxes if s['id'] == sandbox_id), None)
        
        if sandbox:
            sandbox_specific = [
                f"Your sandbox '{sandbox['name']}' is currently {sandbox['status']}.",
                f"There are {len(sandbox['services'])} services in this sandbox.",
                "Would you like to add more services to this sandbox?",
                "I can help you troubleshoot issues with your sandbox services."
            ]
            responses.extend(sandbox_specific)
    
    response = random.choice(responses)
    return jsonify({"response": response})

# Release Deployment API endpoints
@app.route('/api/release/list', methods=['GET'])
def get_releases():
    """Return list of releases"""
    # Filter by environment if provided
    environment = request.args.get('environment')
    if environment:
        filtered_releases = [r for r in releases if r['environment'] == environment]
        return jsonify(filtered_releases)
    
    return jsonify(releases)

@app.route('/api/release/<release_id>', methods=['GET'])
def get_release_details(release_id):
    """Return details for a specific release"""
    release = next((r for r in releases if r['id'] == release_id), None)
    if not release:
        return jsonify({"error": "Release not found"}), 404
    return jsonify(release)

@app.route('/api/release/create', methods=['POST'])
def create_release():
    """Create a new release"""
    data = request.json
    if not data or 'name' not in data or 'version' not in data or 'environment' not in data or 'scheduledDate' not in data:
        return jsonify({"error": "Name, version, environment, and scheduledDate are required"}), 400
    
    # Create new release
    new_release = {
        "id": f"r-{str(uuid.uuid4())[:8]}",
        "name": data['name'],
        "version": data['version'],
        "status": "planned",
        "environment": data['environment'],
        "scheduledDate": data['scheduledDate'],
        "events": [
            {
                "id": f"e-{str(uuid.uuid4())[:8]}",
                "releaseId": f"r-{str(uuid.uuid4())[:8]}",
                "type": "approval",
                "status": "pending",
                "description": "Awaiting approval for deployment",
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
        ]
    }
    
    # Add to releases list
    releases.append(new_release)
    
    return jsonify(new_release)

@app.route('/api/release/<release_id>', methods=['PUT'])
def update_release(release_id):
    """Update release details"""
    data = request.json
    release = next((r for r in releases if r['id'] == release_id), None)
    if not release:
        return jsonify({"error": "Release not found"}), 404
    
    # Update fields
    if 'status' in data:
        release['status'] = data['status']
    if 'scheduledDate' in data:
        release['scheduledDate'] = data['scheduledDate']
    
    return jsonify(release)

@app.route('/api/release/<release_id>/deploy', methods=['POST'])
def deploy_release(release_id):
    """Deploy a release"""
    release = next((r for r in releases if r['id'] == release_id), None)
    if not release:
        return jsonify({"error": "Release not found"}), 404
    
    # Update status
    release['status'] = "in-progress"
    
    # Add deployment event
    new_event = {
        "id": f"e-{str(uuid.uuid4())[:8]}",
        "releaseId": release_id,
        "type": "deployment",
        "status": "in-progress",
        "description": f"Deployment to {release['environment']} started",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    release['events'].append(new_event)
    
    # Simulate successful deployment after a delay
    # In a real application, this would be handled asynchronously
    # For demo purposes, we'll just set a random success/failure
    if random.random() > 0.2:  # 80% chance of success
        release['status'] = "deployed"
        release['deployedDate'] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        
        # Add success event
        success_event = {
            "id": f"e-{str(uuid.uuid4())[:8]}",
            "releaseId": release_id,
            "type": "deployment",
            "status": "success",
            "description": f"Successfully deployed to {release['environment']}",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        release['events'].append(success_event)
    else:
        release['status'] = "failed"
        
        # Add failure event
        failure_event = {
            "id": f"e-{str(uuid.uuid4())[:8]}",
            "releaseId": release_id,
            "type": "deployment",
            "status": "failure",
            "description": "Deployment failed: Service health check timeout",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        release['events'].append(failure_event)
    
    return jsonify(release)

@app.route('/api/release/<release_id>/rollback', methods=['POST'])
def rollback_release(release_id):
    """Rollback a release"""
    release = next((r for r in releases if r['id'] == release_id), None)
    if not release:
        return jsonify({"error": "Release not found"}), 404
    
    # Update status
    release['status'] = "rolled-back"
    
    # Add rollback event
    new_event = {
        "id": f"e-{str(uuid.uuid4())[:8]}",
        "releaseId": release_id,
        "type": "rollback",
        "status": "success",
        "description": "Rolled back to previous version",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    release['events'].append(new_event)
    
    return jsonify(release)

@app.route('/api/release/<release_id>/event', methods=['POST'])
def add_release_event(release_id):
    """Add an event to a release"""
    data = request.json
    if not data or 'type' not in data or 'status' not in data or 'description' not in data:
        return jsonify({"error": "Type, status, and description are required"}), 400
    
    release = next((r for r in releases if r['id'] == release_id), None)
    if not release:
        return jsonify({"error": "Release not found"}), 404
    
    # Create new event
    new_event = {
        "id": f"e-{str(uuid.uuid4())[:8]}",
        "releaseId": release_id,
        "type": data['type'],
        "status": data['status'],
        "description": data['description'],
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    
    # Add to release events
    release['events'].append(new_event)
    
    return jsonify(new_event)

@app.route('/api/release/chat', methods=['POST'])
def release_chat():
    """Chat with the release deployment assistant"""
    data = request.json
    if not data or 'message' not in data:
        return jsonify({"error": "Message is required"}), 400
    
    message = data.get('message')
    context = data.get('context', {})
    
    # In a real application, process the message with an LLM
    # For this demo, provide canned responses
    
    responses = [
        "I can help you manage your releases. What would you like to do?",
        "To schedule a new release, please provide the name, version, environment, and desired deployment date.",
        "Your release has been scheduled. It will be deployed on the specified date.",
        "I've updated your release configuration. The changes have been saved."
    ]
    
    # If context includes a release, add more specific responses
    if 'releaseId' in context:
        release_id = context['releaseId']
        release = next((r for r in releases if r['id'] == release_id), None)
        
        if release:
            release_specific = [
                f"Release '{release['name']}' version {release['version']} is currently {release['status']}.",
                f"This release is scheduled for deployment to {release['environment']} on {release['scheduledDate']}.",
                "Would you like to deploy this release now?",
                "I can help you troubleshoot issues with your release deployment."
            ]
            responses.extend(release_specific)
    
    response = random.choice(responses)
    return jsonify({"response": response})

if __name__ == '__main__':
    # ... keep existing code (Set up proper connection and socket handling for Gunicorn, etc.)
