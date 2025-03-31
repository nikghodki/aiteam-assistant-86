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
from datetime import datetime, timedelta
from functools import wraps

# Conditionally import SAML libraries - will fail gracefully if not installed
try:
    from onelogin.saml2.auth import OneLogin_Saml2_Auth
    from onelogin.saml2.settings import OneLogin_Saml2_Settings
    from onelogin.saml2.utils import OneLogin_Saml2_Utils
    SAML_ENABLED = True
except ImportError:
    SAML_ENABLED = False
    print("Warning: SAML libraries not installed. SAML authentication will be disabled.")

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=['*'], allow_headers=['Content-Type', 'Authorization'])

# Set a secret key for sessions and JWT
app.secret_key = os.environ.get('FLASK_SECRET_KEY', str(uuid.uuid4()))
JWT_SECRET = os.environ.get('JWT_SECRET', str(uuid.uuid4()))
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_MINUTES = 60 * 24  # 24 hours

# Google OAuth configuration (would use real values in production)
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', 'your-google-client-id')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', 'your-google-client-secret')
GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', 'http://localhost:8000/api/auth/google/callback')

# GitHub OAuth configuration
GITHUB_CLIENT_ID = os.environ.get('GITHUB_CLIENT_ID', 'your-github-client-id')
GITHUB_CLIENT_SECRET = os.environ.get('GITHUB_CLIENT_SECRET', 'your-github-client-secret')
GITHUB_REDIRECT_URI = os.environ.get('GITHUB_REDIRECT_URI', 'http://localhost:8000/api/auth/github/callback')

# Mock data for demo purposes
kubernetes_clusters = [
    {"name": "cluster1", "environment": "dev"},
    {"name": "cluster2", "environment": "staging"},
    {"name": "cluster3", "environment": "prod"}
]

# Mock namespace data
namespaces_by_cluster = {
    "cluster1": ["namespace-a", "namespace-b"],
    "cluster2": ["namespace-c", "namespace-d"],
    "cluster3": ["namespace-e", "namespace-f"]
}

# Updated mock namespace issues data to include kind and name
namespace_issues = {
    "namespace-a": [
        {"issue": "High CPU Usage", "kind": "Pod", "name": "pod-1"},
        {"issue": "Memory Leak", "kind": "Container", "name": "container-2"}
    ],
    "namespace-b": [
        {"issue": "Network Congestion", "kind": "Service", "name": "service-3"},
        {"issue": "Disk Full", "kind": "Volume", "name": "volume-4"}
    ],
    "namespace-c": [
        {"issue": "Failed Deployments", "kind": "Deployment", "name": "deployment-5"},
        {"issue": "Configuration Error", "kind": "ConfigMap", "name": "config-6"}
    ],
    "namespace-d": [
        {"issue": "Security Vulnerability", "kind": "Pod", "name": "pod-7"},
        {"issue": "Outdated Image", "kind": "Container", "name": "container-8"}
    ],
    "namespace-e": [
        {"issue": "Resource Contention", "kind": "Node", "name": "node-9"},
        {"issue": "Downtime Incident", "kind": "Service", "name": "service-10"}
    ],
    "namespace-f": [
        {"issue": "Data Corruption", "kind": "PersistentVolumeClaim", "name": "pvc-11"},
        {"issue": "Access Denied", "kind": "Role", "name": "role-12"}
    ]
}

# User storage - in production this would be a database
users = {
    "nghodki@cisco.com": {
        "id": "1",
        "name": "nghodki",
        "email": "nghodki@cisco.com",
        "password": "password123",  # Never store plaintext passwords in production!
        "authenticated": False
    }
}

# Function to gracefully shut down the app
def graceful_shutdown(signal_num=None, frame=None):
    print(f"Received signal {signal_num if signal_num else 'shutdown request'}")
    print("Closing all connections and performing cleanup...")
    
    # Close any open database connections or other resources here
    # For example, if using SQLAlchemy:
    # db.session.close_all()
    # db.engine.dispose()
    
    # Explicitly close any open requests session pools
    requests.Session().close()
    
    print("Cleanup completed, shutting down...")
    sys.exit(0)

# Register the shutdown function with signals
signal.signal(signal.SIGINT, graceful_shutdown)
signal.signal(signal.SIGTERM, graceful_shutdown)

# Also register at exit to catch non-signal terminations
atexit.register(graceful_shutdown)

# SAML configuration
def prepare_flask_request(request):
    """Prepare Flask request for SAML processing"""
    url_data = request.url
    return {
        'https': 'on' if request.scheme == 'https' else 'off',
        'http_host': request.host,
        'script_name': request.path,
        'get_data': request.args.copy(),
        'post_data': request.form.copy(),
        'query_string': request.query_string
    }

def init_saml_auth(req):
    """Initialize SAML authentication object"""
    if not SAML_ENABLED:
        return None
        
    saml_settings = {
        "strict": True,
        "debug": True,
        "sp": {
            "entityId": os.environ.get('SAML_SP_ENTITY_ID', 'https://ai-assistant-api/saml/metadata'),
            "assertionConsumerService": {
                "url": os.environ.get('SAML_SP_ACS_URL', 'https://ai-assistant-api/saml/acs'),
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
            },
            "singleLogoutService": {
                "url": os.environ.get('SAML_SP_SLS_URL', 'https://ai-assistant-api/saml/sls'),
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            },
            "NameIDFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
            "x509cert": "",
            "privateKey": ""
        },
        "idp": {
            "entityId": os.environ.get('SAML_IDP_ENTITY_ID', 'https://idp.example.com/saml2/metadata'),
            "singleSignOnService": {
                "url": os.environ.get('SAML_IDP_SSO_URL', 'https://idp.example.com/saml2/sso'),
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            },
            "singleLogoutService": {
                "url": os.environ.get('SAML_IDP_SLO_URL', 'https://idp.example.com/saml2/slo'),
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            },
            "x509cert": os.environ.get('SAML_IDP_X509CERT', '')
        }
    }
    
    auth = OneLogin_Saml2_Auth(req, saml_settings)
    return auth

# JWT helper functions
def create_jwt_token(user_id, email, name):
    """Create a JWT token for the user"""
    payload = {
        'sub': user_id,  # subject (user id)
        'iat': datetime.utcnow(),  # issued at
        'exp': datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION_MINUTES),  # expiration
        'email': email,
        'name': name
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token):
    """Decode and validate a JWT token"""
    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token.split(' ')[1]
            
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return decoded
    except jwt.ExpiredSignatureError:
        return None  # Token expired
    except jwt.InvalidTokenError:
        return None  # Invalid token
    except Exception as e:
        print(f"Token decode error: {e}")
        return None

def token_required(f):
    """Decorator to protect routes with JWT authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Get token from header
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Authentication token is required'}), 401
        
        # Validate token
        decoded_token = decode_jwt_token(token)
        if not decoded_token:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add the decoded token to the request for use in the endpoint
        request.user = decoded_token
        return f(*args, **kwargs)
    
    return decorated

# Authentication endpoints
@app.route('/api/auth/login', methods=['POST'])
def login():
    """Handle email/password login"""
    data = request.json
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"error": "Email and password are required"}), 400
    
    email = data.get('email')
    password = data.get('password')
    
    # In production, use proper password hashing and verification
    if email in users and users[email]['password'] == password:
        # Create user session
        session['user_id'] = users[email]['id']
        users[email]['authenticated'] = True
        
        # Generate JWT token
        token = create_jwt_token(users[email]['id'], email, users[email]['name'])
        
        # Return user info and token
        user_data = {
            "id": users[email]['id'],
            "name": users[email]['name'],
            "email": users[email]['email'],
            "authenticated": True
        }
        
        return jsonify({"success": True, "user": user_data, "token": token})
    
    return jsonify({"error": "Invalid email or password"}), 401

# Google OAuth routes
@app.route('/api/auth/google', methods=['GET'])
def google_login():
    """Initiate Google OAuth login flow"""
    # In a real implementation, this would redirect to Google's OAuth endpoint
    # For this demo, we'll simulate the process by directly creating a user
    
    # Generate a random state for security
    state = str(uuid.uuid4())
    session['oauth_state'] = state
    
    # Normally, we would redirect to Google's authorization URL with these parameters:
    # client_id, redirect_uri, response_type, scope, state
    
    # For demo purposes, redirect to our callback with a mock code
    callback_url = f"/api/auth/google/callback?code=mock_auth_code&state={state}"
    return redirect(callback_url)

@app.route('/api/auth/google/callback', methods=['GET'])
def google_callback():
    """Handle Google OAuth callback"""
    # Get the authorization code and state from the query parameters
    code = request.args.get('code')
    state = request.args.get('state')
    
    # Verify the state to prevent CSRF attacks
    stored_state = session.get('oauth_state')
    if not stored_state or stored_state != state:
        return jsonify({"error": "Invalid state parameter"}), 400
    
    # Clear the state from the session
    session.pop('oauth_state', None)
    
    # In a real implementation, we would:
    # 1. Exchange the authorization code for an access token
    # 2. Use the access token to get the user's profile information from Google
    
    # For demo purposes, let's create a mock Google user
    google_email = "google.user@example.com"
    
    # Check if this Google user exists in our user database
    if google_email not in users:
        # Create a new user
        user_id = str(uuid.uuid4())
        users[google_email] = {
            "id": user_id,
            "name": "Google User",  # In a real app, get this from Google profile
            "email": google_email,
            "password": None,  # Google users don't need a password
            "photoUrl": "https://lh3.googleusercontent.com/a/default-user", # Mock photo URL
            "authenticated": True
        }
    
    # Create user session
    session['user_id'] = users[google_email]['id']
    users[google_email]['authenticated'] = True
    
    # Return user info by redirecting to the frontend with user data
    user_data = {
        "id": users[google_email]['id'],
        "name": users[google_email]['name'],
        "email": google_email,
        "photoUrl": users[google_email].get('photoUrl'),
        "authenticated": True
    }
    
    # Encode user data for URL
    user_data_str = base64.b64encode(json.dumps(user_data).encode('utf-8')).decode('utf-8')
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    redirect_url = f"{frontend_url}/auth/callback?user_data={quote(user_data_str)}"
    
    return redirect(redirect_url)

@app.route('/api/auth/github', methods=['GET'])
def github_login():
    """Initiate GitHub OAuth login flow"""
    # Generate a random state for security
    state = str(uuid.uuid4())
    session['oauth_state'] = state
    
    # GitHub OAuth authorization URL
    github_auth_url = "https://github.com/login/oauth/authorize"
    
    # Parameters for GitHub OAuth
    params = {
        'client_id': GITHUB_CLIENT_ID,
        'redirect_uri': GITHUB_REDIRECT_URI,
        'scope': 'user:email',  # Request access to user's email
        'state': state
    }
    
    # Build the authorization URL with parameters
    auth_url = f"{github_auth_url}?{'&'.join([f'{k}={v}' for k, v in params.items()])}"
    
    # Redirect to GitHub for authorization
    return redirect(auth_url)

@app.route('/api/auth/github/callback', methods=['GET'])
def github_callback():
    """Handle GitHub OAuth callback"""
    try:
        # Get the authorization code and state from the query parameters
        code = request.args.get('code')
        state = request.args.get('state')
        
        # Verify the state to prevent CSRF attacks
        stored_state = session.get('oauth_state')
        if not stored_state or stored_state != state:
            return jsonify({"error": "Invalid state parameter"}), 400
        
        # Clear the state from the session
        session.pop('oauth_state', None)
        
        # Create a session for the token request
        token_session = requests.Session()
        
        # Exchange the authorization code for an access token
        token_url = "https://github.com/login/oauth/access_token"
        token_payload = {
            'client_id': GITHUB_CLIENT_ID,
            'client_secret': GITHUB_CLIENT_SECRET,
            'code': code,
            'redirect_uri': GITHUB_REDIRECT_URI
        }
        
        # Make POST request to get access token
        token_response = token_session.post(token_url, data=token_payload, headers={'Accept': 'application/json'})
        
        # Check if the token request was successful
        if token_response.status_code != 200:
            return jsonify({"error": "Failed to obtain access token"}), 400
        
        token_data = token_response.json()
        access_token = token_data.get('access_token')
        
        # Use the access token to get user information
        user_url = "https://api.github.com/user"
        user_emails_url = "https://api.github.com/user/emails"
        
        headers = {
            'Authorization': f"token {access_token}",
            'Accept': 'application/json'
        }
        
        # Get user profile
        user_response = token_session.get(user_url, headers=headers)
        if user_response.status_code != 200:
            return jsonify({"error": "Failed to fetch user data"}), 400
        
        user_data = user_response.json()
        
        # Get user emails (to ensure we have the primary email)
        emails_response = token_session.get(user_emails_url, headers=headers)
        if emails_response.status_code != 200:
            return jsonify({"error": "Failed to fetch user emails"}), 400
        
        emails_data = emails_response.json()
        
        # Find the primary email
        primary_email = None
        for email in emails_data:
            if email.get('primary'):
                primary_email = email.get('email')
                break
        
        if not primary_email:
            # If no primary email is found, use the first one
            primary_email = emails_data[0].get('email') if emails_data else user_data.get('email')
        
        # Close the session to prevent resource leaks
        token_session.close()
        
        # Check if this GitHub user exists in our user database
        if primary_email not in users:
            # Create a new user
            user_id = str(uuid.uuid4())
            users[primary_email] = {
                "id": user_id,
                "name": user_data.get('name') or user_data.get('login'),
                "email": primary_email,
                "password": None,  # GitHub users don't need a password
                "photoUrl": user_data.get('avatar_url'),
                "authenticated": True
            }
        
        # After successful authentication, generate JWT token
        token = create_jwt_token(users[primary_email]['id'], primary_email, users[primary_email]['name'])
        
        # Return user info by redirecting to the frontend with user data and token
        user_info = {
            "id": users[primary_email]['id'],
            "name": users[primary_email]['name'],
            "email": primary_email,
            "photoUrl": users[primary_email].get('photoUrl'),
            "authenticated": True,
            "token": token  # Include token in user data
        }
        
        # Encode user data for URL
        user_data_str = base64.b64encode(json.dumps(user_info).encode('utf-8')).decode('utf-8')
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
        
        # Ensure we redirect to the correct path - use '/auth/callback' not '/dashboard/auth/callback'
        redirect_url = f"{frontend_url}/auth/callback?user_data={quote(user_data_str)}"
        
        return redirect(redirect_url)
    
    except Exception as e:
        print(f"Error in GitHub callback: {e}")
        # Ensure we close any open resources
        if 'token_session' in locals():
            token_session.close()
        return jsonify({"error": f"GitHub authentication failed: {str(e)}"}), 500

# Access management endpoints
@app.route('/api/access/groups', methods=['POST'])
@token_required
def get_user_groups():
    """Get groups for a user (protected endpoint)"""
    data = request.json
    if not data or 'userEmail' not in data:
        return jsonify({"error": "User email is required"}), 400
    
    user_email = data.get('userEmail')
    
    # Ensure the requesting user can only access their own data
    if request.user['email'] != user_email and 'admin' not in request.user.get('roles', []):
        return jsonify({"error": "Unauthorized to access this user's data"}), 403
    
    # In a real application, you would query your database for the groups this user belongs to
    # For this example, we'll return mock data
    groups = [
        {
            "id": 1,
            "name": "DevOps Team",
            "description": "Team responsible for CI/CD and operations",
            "status": "member",
            "members": 12
        },
        {
            "id": 2,
            "name": "Platform Engineers",
            "description": "Team responsible for platform infrastructure",
            "status": "pending",
            "members": 8
        },
        {
            "id": 3,
            "name": "Security Team",
            "description": "Team responsible for security and compliance",
            "status": "none",
            "members": 5
        }
    ]
    
    return jsonify(groups)

@app.route('/api/access/groups/request', methods=['POST'])
def request_group_access():
    """Request access to a group"""
    data = request.json
    if not data or 'groupId' not in data or 'reason' not in data or 'userEmail' not in data:
        return jsonify({"error": "Group ID, reason, and user email are required"}), 400
    
    group_id = data.get('groupId')
    reason = data.get('reason')
    user_email = data.get('userEmail')
    
    # In a real application, you would:
    # 1. Create a record in your database for this access request
    # 2. Create a Jira ticket for approval
    # 3. Notify approvers
    
    # For this example, we'll simulate creating a Jira ticket
    ticket = {
        "key": f"ACCESS-{random.randint(1000, 9999)}",
        "url": f"https://jira.example.com/browse/ACCESS-{random.randint(1000, 9999)}",
        "summary": f"Access request for group {group_id}",
        "description": reason,
        "status": "Open",
        "reporter": user_email
    }
    
    return jsonify(ticket)

@app.route('/api/access/groups/leave', methods=['POST'])
def leave_group():
    """Leave a group"""
    data = request.json
    if not data or 'groupName' not in data or 'userEmail' not in data:
        return jsonify({"error": "Group name and user email are required"}), 400
    
    group_name = data.get('groupName')
    user_email = data.get('userEmail')
    
    # In a real application, you would remove the user from the group in your database
    # For this example, we'll simulate a successful operation
    
    return jsonify({"success": True, "message": f"User {user_email} removed from group {group_name}"})

@app.route('/api/access/chat', methods=['POST'])
def access_chat():
    """Chat with the access management assistant"""
    data = request.json
    if not data or 'message' not in data or 'userEmail' not in data:
        return jsonify({"error": "Message and user email are required"}), 400
    
    message = data.get('message')
    user_email = data.get('userEmail')
    
    # In a real application, you would:
    # 1. Process the message with an LLM or other AI assistant
    # 2. Return a helpful response
    
    # For this example, we'll simulate responses
    responses = [
        f"I can help you with access management, {user_email}. What specific access do you need?",
        "To request access to a group, you can use the group membership dashboard.",
        "Your access request will be reviewed by the group administrators.",
        "I see you're requesting information about group permissions. Let me check that for you."
    ]
    
    response = random.choice(responses)
    return jsonify({"response": response})

# Logout endpoint should invalidate the token
@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Handle user logout"""
    if 'user_id' in session:
        user_id = session['user_id']
        # Find user by ID and set authenticated to false
        for email, user in users.items():
            if user['id'] == user_id:
                user['authenticated'] = False
                break
        
        # Clear session
        session.clear()
    
    return jsonify({"success": True})

@app.route('/api/auth/session', methods=['GET'])
def check_session():
    """Check if user is authenticated"""
    if 'user_id' in session:
        user_id = session['user_id']
        
        # Find user by ID
        for email, user in users.items():
            if user['id'] == user_id and user['authenticated']:
                user_data = {
                    "id": user['id'],
                    "name": user['name'],
                    "email": user['email'],
                    "photoUrl": user.get('photoUrl'),
                    "authenticated": True
                }
                return jsonify({"authenticated": True, "user": user_data})
    
    return jsonify({"authenticated": False})

# About API endpoints
@app.route('/api/about', methods=['GET'])
def get_about():
    """Return basic information about the platform"""
    about_info = {
        "name": "AI Assistant Platform",
        "version": "1.0.0",
        "description": "A comprehensive platform for Kubernetes debugging, documentation search, and access management",
        "maintainer": "Platform Team",
        "contact": "platform-team@example.com"
    }
    
    return jsonify(about_info)

@app.route('/api/about/health', methods=['GET'])
def get_health():
    """Return health status of the platform"""
    health_info = {
        "status": "healthy",
        "uptime": "3 days, 4 hours",
        "services": {
            "kubernetes": "operational",
            "documentation": "operational",
            "access_management": "operational",
            "authentication": "operational"
        },
        "timestamp": time.time()
    }
    
    return jsonify(health_info)

@app.route('/api/about/stats', methods=['GET'])
def get_stats():
    """Return usage statistics of the platform"""
    stats_info = {
        "users": {
            "total": 150,
            "active": 42
        },
        "requests": {
            "total": 1250,
            "today": 78
        },
        "kubernetes": {
            "clusters": 3,
            "debugSessions": 24
        },
        "documentation": {
            "searches": 345,
            "chatSessions": 125
        }
    }
    
    return jsonify(stats_info)

# Get clusters by environment
@app.route('/api/kubernetes/clusters', methods=['GET'])
@token_required
def get_clusters():
    """Return list of Kubernetes clusters (protected endpoint)"""
    return jsonify(kubernetes_clusters)

# Get namespaces for a cluster
@app.route('/api/kubernetes/namespaces', methods=['POST'])
def get_namespaces():
    """Return list of namespaces for a given cluster"""
    data = request.json
    cluster_name = data.get('cluster')
    if cluster_name and cluster_name in namespaces_by_cluster:
        return jsonify(namespaces_by_cluster[cluster_name])
    else:
        return jsonify([]), 400

# Execute a command on a Kubernetes cluster
@app.route('/api/kubernetes/command', methods=['POST'])
def run_command():
    """Execute a kubectl command (mock)"""
    data = request.json
    cluster = data.get('cluster')
    namespace = data.get('namespace')
    command = data.get('command')
    
    # Simulate command execution and return a result
    result = f"Command '{command}' executed on cluster '{cluster}' in namespace '{namespace}'"
    return jsonify({"result": result})

# Chat with Kubernetes assistant
@app.route('/api/kubernetes/chat', methods=['POST'])
def kubernetes_chat():
    """Simulate interaction with a Kubernetes assistant"""
    data = request.json
    message = data.get('message')
    
    # Generate a canned response
    responses = [
        "I am an AI assistant for Kubernetes.",
        "How can I help you today?",
        "I can assist with deployments, troubleshooting, and more."
    ]
    
    response = random.choice(responses)
    return jsonify({"response": response})

# Get issues in a namespace
@app.route('/api/kubernetes/namespace-issues', methods=['POST'])
def get_namespace_issues():
    """Return list of issues for a given namespace"""
    data = request.json
    namespace = data.get('namespace')
    if namespace and namespace in namespace_issues:
        return jsonify(namespace_issues[namespace])
    else:
        return jsonify([]), 400

if __name__ == '__main__':
    # Set up proper connection and socket handling for Gunicorn
    from werkzeug.serving import WSGIRequestHandler
    WSGIRequestHandler.protocol_version = "HTTP/1.1"
    
    # For development, use HTTP or self-signed HTTPS
    if os.environ.get('HTTPS_ENABLED', '0') == '1':
        # Create SSL context with proper ciphers and protocols
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain('cert.pem', 'key.pem')
        
        # Set secure protocols - allow TLS 1.2 and 1.3
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        context.maximum_version = ssl.TLSVersion.TLSv1_3
        
        # Set cipher suite with broader compatibility but still secure
        context.set_ciphers('HIGH:!aNULL:!eNULL:!EXPORT:!DES:!MD5:!PSK:!RC4')
        
        # Add ALPN protocols for HTTP/2 and HTTP/1.1
        context.set_alpn_protocols(['h2', 'http/1.1'])
        
        # Disable compression to prevent CRIME attacks
        context.options |= ssl.OP_NO_COMPRESSION
        
        app.run(host='0.0.0.0', port=8000, ssl_context=context)
    else:
        print("Starting Flask application in HTTP mode...")
        app.run(host='0.0.0.0', port=8000, debug=True)
