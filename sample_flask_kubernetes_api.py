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
import jwt
from functools import wraps
from datetime import datetime, timedelta

try:
    from urllib.parse import urlparse, urljoin
    from xml.dom.minidom import parseString
    from onelogin.saml2.auth import OneLogin_Saml2_Auth
    from onelogin.saml2.utils import OneLogin_Saml2_Utils
    SAML_ENABLED = True
except ImportError:
    SAML_ENABLED = False

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=['*'], allow_headers=['Content-Type', 'Authorization'])

JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'test-secret-key-for-development-only')
JWT_ALGORITHM = 'HS256'
JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour

app.secret_key = os.environ.get('FLASK_SESSION_SECRET', 'your-super-secret-key')

# OAuth 2.0 Configuration (replace with your actual values)
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', 'your-google-client-id')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', 'your-google-client-secret')
GITHUB_CLIENT_ID = os.environ.get('GITHUB_CLIENT_ID', 'your-github-client-id')
GITHUB_CLIENT_SECRET = os.environ.get('GITHUB_CLIENT_SECRET', 'your-github-client-secret')
OIDC_PROVIDERS = {}

# Mock user data (replace with a real database)
USERS = {
    "test@example.com": {"id": "1", "name": "Test User", "email": "test@example.com", "password": "password"},
    "nghodki@cisco.com": {"id": "2", "name": "Niket Ghodki", "email": "nghodki@cisco.com", "password": "password"}
}

# Mock Kubernetes clusters data (replace with a real API)
CLUSTERS = [
    {"arn": "arn:aws:eks:us-west-2:111122223333:cluster/prod-cluster", "name": "prod-cluster", "environment": "production", "status": "healthy", "version": "1.28", "nodeCount": 12},
    {"arn": "arn:aws:eks:us-west-2:111122223333:cluster/staging-cluster", "name": "staging-cluster", "environment": "staging", "status": "warning", "version": "1.27", "nodeCount": 4},
    {"arn": "arn:aws:eks:us-west-2:111122223333:cluster/dev-cluster", "name": "dev-cluster", "environment": "qa", "status": "error", "version": "1.26", "nodeCount": 2}
]

# Mock Jira projects and issue types
JIRA_PROJECTS = [
    {"id": "10000", "key": "DEMO", "name": "Demo Project"},
    {"id": "10001", "key": "TEST", "name": "Test Project"}
]

JIRA_ISSUE_TYPES = {
    "10000": [
        {"id": "10002", "name": "Bug", "description": "A problem which impairs or prevents the functions of the product."},
        {"id": "10003", "name": "Task", "description": "A small, distinct piece of work."}
    ],
    "10001": [
        {"id": "10004", "name": "Story", "description": "A user story."},
        {"id": "10005", "name": "Epic", "description": "A large user story."}
    ]
}

# Mock RBAC data
ROLES = [
    {"id": "admin", "name": "Administrator", "description": "Full access to all resources", "isSystem": True, "permissions": [{"resource": "all", "action": "all"}], "createdAt": "2024-01-01T00:00:00Z", "updatedAt": "2024-01-01T00:00:00Z"},
    {"id": "viewer", "name": "Viewer", "description": "Read-only access to all resources", "isSystem": True, "permissions": [{"resource": "all", "action": "read"}], "createdAt": "2024-01-01T00:00:00Z", "updatedAt": "2024-01-01T00:00:00Z"}
]

USER_ROLES = {
    "1": [{"userId": "1", "roleId": "admin", "roleName": "Administrator"}],
    "2": [{"userId": "2", "roleId": "viewer", "roleName": "Viewer"}]
}

USER_PERMISSIONS = {
    "1": [{"userId": "1", "permission": {"resource": "all", "action": "all"}}],
    "2": [{"userId": "2", "permission": {"resource": "all", "action": "read"}}]
}

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

user_storage = {}

def graceful_shutdown(signal, frame):
    print('Received signal to stop. Shutting down...')
    sys.exit(0)

atexit.register(lambda: print("Exiting application"))

signal.signal(signal.SIGINT, graceful_shutdown)
signal.signal(signal.SIGTERM, graceful_shutdown)

def init_saml_auth(req):
    auth = OneLogin_Saml2_Auth(req, custom_base_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'saml'))
    return auth

def prepare_flask_request(request):
    url_data = urlparse(request.url)
    return {
        'https': 'on' if request.scheme == 'https' else 'off',
        'http_host': request.host,
        'script_name': request.path,
        'get_data': request.query_string.decode('utf-8'),
        'post_data': request.form.to_dict(flat=True),
        'query_string': request.query_string.decode('utf-8'),
        'request_uri': request.url,
        'path_info': request.path,
        'remote_addr': request.remote_addr
    }

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'message': 'Missing email or password'}), 400

    user = USERS.get(data['email'])
    if not user or user['password'] != data['password']:
        return jsonify({'message': 'Invalid credentials'}), 401
    
    session['user'] = user
    return jsonify({'message': 'Logged in successfully', 'user': user})

@app.route('/api/auth/google/login', methods=['GET'])
def google_login():
    # Redirect the user to Google's OAuth endpoint
    redirect_uri = url_for('google_callback', _external=True)
    google_oauth_url = f'https://accounts.google.com/o/oauth2/v2/auth?client_id={GOOGLE_CLIENT_ID}&redirect_uri={redirect_uri}&response_type=code&scope=openid%20email%20profile'
    return redirect(google_oauth_url)

@app.route('/api/auth/google/callback', methods=['GET'])
def google_callback():
    code = request.args.get('code')
    if not code:
        return jsonify({'message': 'Missing authorization code'}), 400

    # Exchange the code for an access token
    token_url = 'https://oauth2.googleapis.com/token'
    data = {
        'code': code,
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'redirect_uri': url_for('google_callback', _external=True),
        'grant_type': 'authorization_code'
    }
    response = requests.post(token_url, data=data)
    if response.status_code != 200:
        return jsonify({'message': 'Failed to retrieve access token'}), 400

    access_token = response.json().get('access_token')
    if not access_token:
        return jsonify({'message': 'Access token not found'}), 400

    # Use the access token to retrieve user information
    user_info_url = 'https://www.googleapis.com/oauth2/v3/userinfo'
    headers = {'Authorization': f'Bearer {access_token}'}
    user_info_response = requests.get(user_info_url, headers=headers)
    if user_info_response.status_code != 200:
        return jsonify({'message': 'Failed to retrieve user info'}), 400

    user_info = user_info_response.json()
    email = user_info.get('email')
    name = user_info.get('name')
    if not email or not name:
        return jsonify({'message': 'Email or name not found'}), 400

    # Check if the user exists in your database, otherwise create a new user
    user = USERS.get(email)
    if not user:
        user = {'id': str(uuid.uuid4()), 'name': name, 'email': email}
        USERS[email] = user
    
    session['user'] = user
    return jsonify({'message': 'Logged in successfully', 'user': user})

@app.route('/api/auth/github/login', methods=['GET'])
def github_login():
    # Redirect the user to GitHub's OAuth endpoint
    github_oauth_url = f'https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&redirect_uri={GITHUB_REDIRECT_URI}'
    return redirect(github_oauth_url)

@app.route('/api/auth/github/callback', methods=['GET'])
def github_callback():
    code = request.args.get('code')
    if not code:
        return jsonify({'message': 'Missing authorization code'}), 400

    # Exchange the code for an access token
    token_url = 'https://github.com/login/oauth/access_token'
    headers = {'Accept': 'application/json'}
    data = {
        'code': code,
        'client_id': GITHUB_CLIENT_ID,
        'client_secret': GITHUB_CLIENT_SECRET,
        'redirect_uri': GITHUB_REDIRECT_URI
    }
    response = requests.post(token_url, headers=headers, data=data)
    if response.status_code != 200:
        return jsonify({'message': 'Failed to retrieve access token'}), 400

    access_token = response.json().get('access_token')
    if not access_token:
        return jsonify({'message': 'Access token not found'}), 400

    # Use the access token to retrieve user information
    user_info_url = 'https://api.github.com/user'
    headers = {'Authorization': f'token {access_token}', 'Accept': 'application/json'}
    user_info_response = requests.get(user_info_url, headers=headers)
    if user_info_response.status_code != 200:
        return jsonify({'message': 'Failed to retrieve user info'}), 400

    user_info = user_info_response.json()
    email = user_info.get('email')
    name = user_info.get('login')  # GitHub doesn't always provide a name
    if not email or not name:
        return jsonify({'message': 'Email or name not found'}), 400

    # Check if the user exists in your database, otherwise create a new user
    user = USERS.get(email)
    if not user:
        user = {'id': str(uuid.uuid4()), 'name': name, 'email': email}
        USERS[email] = user
    
    session['user'] = user
    return jsonify({'message': 'Logged in successfully', 'user': user})

def is_safe_url(target):
    ref_url = urlparse(request.host_url)
    test_url = urlparse(urljoin(request.host_url, target))
    return test_url.scheme in ('http', 'https') and ref_url.netloc == test_url.netloc

@app.route('/api/access/groups', methods=['POST'])
def get_user_groups():
    data = request.get_json()
    user_email = data.get('userEmail')
    
    # Mock response
    groups = [
        {"id": 1, "name": "K8s-prod-cluster-admins", "role": "Admin"},
        {"id": 2, "name": "AWS-account-auditors", "role": "Auditor"},
        {"id": 3, "name": "Jira-project-leads", "role": "Lead"}
    ]
    
    return jsonify(groups)

@app.route('/api/access/groups/request', methods=['POST'])
def request_group_access():
    data = request.get_json()
    group_id = data.get('groupId')
    reason = data.get('reason')
    user_email = data.get('userEmail')
    
    # Mock Jira ticket creation
    ticket = {
        "key": "DEMO-123",
        "url": "https://example.jira.com/browse/DEMO-123",
        "summary": f"Request access to group {group_id} for {user_email}",
        "description": f"User {user_email} requested access to group {group_id} with reason: {reason}",
        "status": "Open",
        "priority": "Medium",
        "created": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
        "reporter": user_email,
        "project": "DEMO",
        "issueType": "Access Request"
    }
    
    return jsonify(ticket)

@app.route('/api/access/groups/leave', methods=['POST'])
def leave_group():
    data = request.get_json()
    group_name = data.get('groupName')
    user_email = data.get('userEmail')
    
    # Mock success response
    return jsonify({"success": True})

@app.route('/api/access/chat', methods=['POST'])
def access_chat():
    data = request.get_json()
    message = data.get('message')
    user_email = data.get('userEmail')
    
    # Mock response
    response = f"Hello {user_email}, I am a demo assistant. You said: {message}"
    return jsonify({"response": response})

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/auth/session', methods=['GET'])
def check_auth_session():
    if 'user' in session:
        return jsonify({'user': session['user'], 'authenticated': True})
    else:
        return jsonify({'user': None, 'authenticated': False})

@app.route('/api/about', methods=['GET'])
def about():
    return jsonify({
        "version": "0.1.0",
        "description": "AI Assistant API",
        "endpoints": [
            "/api/kubernetes/clusters",
            "/api/kubernetes/command",
            "/api/docs/search",
            "/api/jira/ticket",
            "/api/rbac/roles"
        ]
    })

@app.route('/api/kubernetes/clusters', methods=['GET'])
@jwt_required
def get_clusters():
    """Return list of k8s clusters"""
    environment = request.args.get('environment')
    
    if environment:
        filtered_clusters = [c for c in CLUSTERS if c.get('environment') == environment]
        return jsonify(filtered_clusters)
    
    return jsonify(CLUSTERS)

@app.route('/api/kubernetes/command', methods=['POST'])
@jwt_required
def run_kubectl_command():
    data = request.get_json()
    cluster_arn = data.get('clusterArn')
    command = data.get('command')
    namespace = data.get('namespace')
    jira_ticket_key = data.get('jiraTicketKey')
    
    # Mock command result
    result = {
        "output": f"kubectl command '{command}' executed successfully on cluster {cluster_arn} in namespace {namespace}",
        "error": None,
        "exitCode": 0
    }
    
    return jsonify(result)

@app.route('/api/kubernetes/chat', methods=['POST'])
@jwt_required
def kubernetes_chat():
    data = request.get_json()
    cluster_arn = data.get('clusterArn')
    message = data.get('message')
    namespace = data.get('namespace')
    
    # Mock response
    response = f"Hello, I am a demo Kubernetes assistant for cluster {cluster_arn} in namespace {namespace}. You said: {message}"
    return jsonify({"response": response})

@app.route('/api/kubernetes/sessions', methods=['GET'])
@jwt_required
def get_debug_sessions():
    # Mock response
    sessions = [
        {"id": "session-1", "cluster": "prod-cluster", "description": "Investigating high CPU usage"},
        {"id": "session-2", "cluster": "staging-cluster", "description": "Troubleshooting deployment issues"}
    ]
    
    return jsonify(sessions)

@app.route('/api/kubernetes/sessions/<session_id>', methods=['GET'])
@jwt_required
def get_session_details(session_id):
    # Mock response
    details = {
        "id": session_id,
        "cluster": "prod-cluster",
        "description": "Investigating high CPU usage",
        "commands": [
            {"command": "kubectl top node", "output": "...", "timestamp": "2024-01-01T12:00:00Z"},
            {"command": "kubectl describe node", "output": "...", "timestamp": "2024-01-01T12:05:00Z"}
        ]
    }
    
    return jsonify(details)

@app.route('/api/kubernetes/health/<cluster>', methods=['GET'])
@jwt_required
def get_cluster_health(cluster):
    # Mock response
    health = {
        "cluster": cluster,
        "status": "healthy",
        "nodes": 12,
        "cpuUsage": "60%",
        "memoryUsage": "70%"
    }
    
    return jsonify(health)

@app.route('/api/kubernetes/debug-file/<session_id>', methods=['GET'])
@jwt_required
def download_debug_file(session_id):
    # Mock response
    return jsonify({"url": "https://example.com/debug-file.zip"})

@app.route('/api/kubernetes/namespaces', methods=['POST'])
@jwt_required
def get_namespaces():
    data = request.get_json()
    cluster_arn = data.get('clusterArn')
    
    # Mock response
    namespaces = ["default", "kube-system", "monitoring"]
    return jsonify(namespaces)

@app.route('/api/kubernetes/namespace-issues', methods=['POST'])
@jwt_required
def get_namespace_issues():
    data = request.get_json()
    cluster_arn = data.get('clusterArn')
    namespace = data.get('namespace')
    
    # Mock response
    issues = [
        {"id": "issue-1", "severity": "critical", "kind": "Pod", "name": "failing-pod", "message": "Pod is crashing", "timestamp": "2024-01-01T12:00:00Z"},
        {"id": "issue-2", "severity": "warning", "kind": "Service", "name": "unhealthy-service", "message": "Service is not responding", "timestamp": "2024-01-01T12:05:00Z"}
    ]
    return jsonify(issues)

@app.route('/api/docs/search', methods=['POST'])
@jwt_required
def search_documentation():
    data = request.get_json()
    query = data.get('query')
    
    # Mock response
    results = [
        {"id": 1, "title": "Kubernetes Pods", "excerpt": "Learn about Kubernetes Pods", "content": "...", "url": "https://example.com/docs/pods", "category": "Kubernetes"},
        {"id": 2, "title": "AWS EC2 Instances", "excerpt": "Learn about AWS EC2 Instances", "content": "...", "url": "https://example.com/docs/ec2", "category": "AWS"}
    ]
    
    return jsonify(results)

@app.route('/api/docs/<int:document_id>', methods=['GET'])
@jwt_required
def get_document_by_id(document_id):
    # Mock response
    document = {
        "id": document_id,
        "title": "Kubernetes Pods",
        "excerpt": "Learn about Kubernetes Pods",
        "content": "...",
        "url": "https://example.com/docs/pods",
        "category": "Kubernetes"
    }
    
    return jsonify(document)

@app.route('/api/docs/feedback', methods=['POST'])
@jwt_required
def submit_feedback():
    data = request.get_json()
    document_id = data.get('documentId')
    helpful = data.get('helpful')
    
    # Mock success response
    return jsonify({"success": True})

@app.route('/api/docs/chat', methods=['POST'])
@jwt_required
def docs_chat():
    data = request.get_json()
    message = data.get('message')
    context = data.get('context')
    history = data.get('history')
    
    # Mock response
    response = f"Hello, I am a demo documentation assistant. You said: {message}"
    return jsonify({"response": response})

@app.route('/api/docs/chat/history', methods=['GET'])
@jwt_required
def get_chat_history():
    # Mock response
    history = [
        {"id": "1", "role": "user", "content": "What is a Kubernetes Pod?", "timestamp": "2024-01-01T12:00:00Z"},
        {"id": "2", "role": "assistant", "content": "A Pod is the smallest deployable unit in Kubernetes.", "timestamp": "2024-01-01T12:01:00Z"}
    ]
    
    return jsonify(history)

@app.route('/api/docs/history', methods=['GET'])
@jwt_required
def get_query_history():
    # Mock response
    history = [
        {"id": 1, "query": "Kubernetes Pods", "timestamp": "2024-01-01T12:00:00Z"},
        {"id": 2, "query": "AWS EC2 Instances", "timestamp": "2024-01-01T12:05:00Z"}
    ]
    
    return jsonify(history)

@app.route('/api/docs/chat/clear', methods=['POST'])
@jwt_required
def clear_chat_history():
    # Mock success response
    return jsonify({"success": True})

@app.route('/api/jira/ticket', methods=['POST'])
@jwt_required
def create_jira_ticket():
    data = request.get_json()
    summary = data.get('summary')
    description = data.get('description')
    priority = data.get('priority')
    project = data.get('project')
    issue_type = data.get('issueType')
    
    # Mock Jira ticket creation
    ticket = {
        "key": "DEMO-123",
        "url": "https://example.jira.com/browse/DEMO-123",
        "summary": summary,
        "description": description,
        "status": "Open",
        "priority": priority,
        "created": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
        "reporter": session.get('user', {}).get('email', 'test@example.com'),
        "project": project,
        "issueType": issue_type
    }
    
    return jsonify(ticket)

@app.route('/api/jira/tickets', methods=['GET'])
@jwt_required
def get_user_tickets():
    reporter = request.args.get('reporter')
    status = request.args.get('status')
    
    # Mock response
    tickets = [
        {"key": "DEMO-123", "url": "https://example.jira.com/browse/DEMO-123", "summary": "Fix bug in login page", "status": "Open", "priority": "High", "created": "2024-01-01T12:00:00Z", "reporter": "test@example.com", "project": "DEMO", "issueType": "Bug"},
        {"key": "DEMO-124", "url": "https://example.jira.com/browse/DEMO-124", "summary": "Implement new feature", "status": "In Progress", "priority": "Medium", "created": "2024-01-02T12:00:00Z", "reporter": "test@example.com", "project": "DEMO", "issueType": "Task"}
    ]
    
    return jsonify(tickets)

@app.route('/api/jira/tickets/reported-by-me', methods=['GET'])
@jwt_required
def get_user_reported_tickets():
    # Mock response
    tickets = [
        {"key": "DEMO-123", "url": "https://example.jira.com/browse/DEMO-123", "summary": "Fix bug in login page", "status": "Open", "priority": "High", "created": "2024-01-01T12:00:00Z", "reporter": "test@example.com", "project": "DEMO", "issueType": "Bug"},
        {"key": "DEMO-124", "url": "https://example.jira.com/browse/DEMO-124", "summary": "Implement new feature", "status": "In Progress", "priority": "Medium", "created": "2024-01-02T12:00:00Z", "reporter": "test@example.com", "project": "DEMO", "issueType": "Task"}
    ]
    
    return jsonify(tickets)

@app.route('/api/jira/tickets/<ticket_key>', methods=['GET'])
@jwt_required
def get_ticket_details(ticket_key):
    # Mock response
    ticket = {
        "key": ticket_key,
        "url": f"https://example.jira.com/browse/{ticket_key}",
        "summary": "Fix bug in login page",
        "description": "Detailed description of the bug",
        "status": "Open",
        "priority": "High",
        "created": "2024
