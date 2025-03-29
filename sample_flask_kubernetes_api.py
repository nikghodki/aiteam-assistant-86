from flask import Flask, request, jsonify, redirect, session
from flask_cors import CORS
import random
import logging
import subprocess
import json, os
import myid_agent
import access_management_agent
import doc_agent, k8s_debugger_agent, aws_eks_agent
from urllib.parse import quote
import base64
import requests
import uuid
import datetime
import boto3  # Import boto3 for S3 functionality
import jwt as pyjwt  # Rename the import to avoid confusion
from functools import wraps

logging.basicConfig(level=logging.INFO)
url_myid = os.environ.get("MYID_URL")
token = myid_agent.get_token()
headers = {'Authorization ': f'Bearer {token}', 'Accept': 'application/vnd.api+json'}
app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'your_flask_secret_key_for_development')  # Add secret key for session
CORS(app, supports_credentials=True, origins=['*'], allow_headers=['Content-Type', 'Authorization'])

# JWT Configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your_jwt_secret_key_for_development')
JWT_ALGORITHM = 'HS256'
JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(hours=1)
JWT_REFRESH_TOKEN_EXPIRES = datetime.timedelta(days=30)

# Frontend URL for redirects
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

# S3 Configuration
S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'your-debug-logs-bucket')
S3_REGION = os.environ.get('S3_REGION', 'us-east-1')

# Initialize S3 client
try:
    s3_client = boto3.client(
        's3',
        region_name=S3_REGION,
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
    )
except Exception as e:
    print(f"Warning: Unable to initialize S3 client: {str(e)}")
    s3_client = None

# Decorator to require JWT token for API endpoints
def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # For easier testing, check if bypass auth header is present
        test_bypass = request.headers.get('X-Test-Bypass-Auth')
        if test_bypass == 'true':
            return f(*args, **kwargs)

        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'message': 'Authentication token is missing'}), 401

        try:
            # Verify the token using PyJWT
            payload = pyjwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            # Store user info in request context for later use
            request.user = payload
            return f(*args, **kwargs)
        except pyjwt.exceptions.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except pyjwt.exceptions.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401

    return decorated

# GitHub OAuth configuration
GITHUB_CLIENT_ID = os.environ.get('GITHUB_CLIENT_ID', 'your-github-client-id')
GITHUB_CLIENT_SECRET = os.environ.get('GITHUB_CLIENT_SECRET', 'your-github-client-secret')
GITHUB_REDIRECT_URI = os.environ.get('GITHUB_REDIRECT_URI', 'http://localhost:8000/api/auth/github/callback')
users ={}
kubernetes_clusters = aws_eks_agent.list_eks_clusters_with_arns()

# Access Management API routes
@app.route('/api/access/groups', methods=['POST'])
@jwt_required
def get_user_groups():
    data = request.json
    user_email = data.get('userEmail', 'Anonymous User')
    user_id = myid_agent.get_user_id(url_myid, user_email, headers)
    groups = myid_agent.get_user_membership(url_myid, user_id, headers)
    id = 0
    out_group = []

    for group in groups:
        group1 = {}
        id = id + 1
        group1['id'] = id
        group1['status'] = 'member'
        group1['name'] = group
        group1['description'] = group
        # adding random number of members to the group
        group1['members'] = random.randint(1, 10)
        out_group.append(group1)
    logging.info(f"Getting user groups: {out_group}")
    return jsonify(out_group)

@app.route('/api/access/groups/leave', methods=['POST'])
@jwt_required
def leave_groups():
    data = request.json
    logging.info(f"Leaving group: {data.get('groupName')}")
    return myid_agent.remove_user_from_group_click(url_myid, data.get('userEmail', 'Anonymous User'), data.get('groupName'))

@app.route('/api/docs/chat', methods=['POST'])
@jwt_required
def doc_chat():
    data = request.json
    logging.info(f"Doc chat: {data.get('message')}")
    return jsonify({"response": doc_agent.doc_qna_prompt(data.get('message'), data.get('history'))})

@app.route('/api/access/chat', methods=['POST'])
@jwt_required
def access_chat():
    data = request.json
    logging.info(f"Access chat: {data.get('message')}")
    return jsonify({"response": access_management_agent.access_management_function_calling(data.get('message'), data.get('userEmail'))})

# Kubernetes Debugger API
@app.route('/api/kubernetes/chat', methods=['POST'])
@jwt_required
def kubernetes_chat():
    data = request.json
    response, file_name = k8s_debugger_agent.debug(data.get('message'), data.get('clusterArn'), False, "NEVER", 100)
    logging.info(f"Kubernetes chat: {response}")
    logging.info(f"File name: {file_name}")
    return jsonify({"response": response, "file_name": f"/backend/{file_name}"})

@app.route('/api/kubernetes/command', methods=['POST'])
@jwt_required
def kubernetes_command():
    data = request.json
    logging.info(f"Kubernetes command: {data.get('command')}")
    command = f"{data.get('command')} -n {data.get('namespace')} --context {data.get('clusterArn')}"
    response = subprocess.run(command, shell=True, capture_output=True, text=True)
    logging.info(f"Kubernetes command response: {response.stdout}")
    return jsonify({"output": response.stdout})

@app.route('/api/kubernetes/namespaces', methods=['POST'])
@jwt_required
def kubernetes_namespace():
    data = request.json
    command = f"kubectl get ns --context {data.get('clusterArn')}"
    logging.info(f"Kubernetes namespaces command: {command}")
    response = subprocess.run(command, shell=True, capture_output=True, text=True)
    logging.info(f"Kubernetes namespaces response: {response.stdout}")
    lines = response.stdout.split("\n")[1:]
    names = [line.split()[0] for line in lines if line.strip()]
    logging.info(f"Kubernetes namespaces: {names}")
    return jsonify(names)

@app.route('/api/kubernetes/clusters', methods=['GET'])
@jwt_required
def get_clusters():
    environment = request.args.get('environment')
    kubernetes_clusters = aws_eks_agent.list_eks_clusters_with_arns()
    if environment == "staging":
        return [cluster for cluster in kubernetes_clusters if "stg" in cluster["name"]]
    elif environment == "production":
        return [cluster for cluster in kubernetes_clusters if "prod" in cluster["name"]]
    elif environment == "qa":
        return [cluster for cluster in kubernetes_clusters if "stg" not in cluster["name"]]
    return kubernetes_clusters

@app.route('/api/kubernetes/namespace-issues', methods=['POST'])
@jwt_required
def get_namespace_issues():
    data = request.json
    logging.info(f"Kubernetes namespace issues: {data}")
    if not data or 'clusterArn' not in data or 'namespace' not in data:
        return jsonify({"error": "clusterArn and namespace are required"}), 400
    k8sgpt_output = k8s_debugger_agent.analyse(data.get('namespace'), data.get('clusterArn'))
    logging.info(f"Kubernetes namespace issues: {k8sgpt_output}")
    return jsonify(k8sgpt_output)

@app.route('/api/auth/github', methods=['GET'])
def github_login():
    """Start GitHub OAuth flow"""
    state = str(uuid.uuid4())
    session['oauth_state'] = state
    github_auth_url = "https://github.com/login/oauth/authorize"
    params = {
        'client_id': GITHUB_CLIENT_ID,
        'redirect_uri': GITHUB_REDIRECT_URI,
        'scope': 'user:email',
        'state': state
    }
    auth_url = f"{github_auth_url}?{'&'.join([f'{k}={v}' for k, v in params.items()])}"
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
            return redirect(f"{FRONTEND_URL}?error=invalid_state")

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
            return redirect(f"{FRONTEND_URL}?error=token_error")

        token_data = token_response.json()
        github_access_token = token_data.get('access_token')

        # Use the access token to get user information
        user_url = "https://api.github.com/user"
        user_emails_url = "https://api.github.com/user/emails"

        headers = {
            'Authorization': f"token {github_access_token}",
            'Accept': 'application/json'
        }

        # Get user profile
        user_response = token_session.get(user_url, headers=headers)
        if user_response.status_code != 200:
            return redirect(f"{FRONTEND_URL}?error=user_error")

        user_data = user_response.json()

        # Get user emails (to ensure we have the primary email)
        emails_response = token_session.get(user_emails_url, headers=headers)
        if emails_response.status_code != 200:
            return redirect(f"{FRONTEND_URL}?error=email_error")

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

        # Create user session
        session['user_id'] = users[primary_email]['id']
        users[primary_email]['authenticated'] = True

        # Generate JWT tokens
        # Access token with shorter expiry
        access_token_expiry = datetime.datetime.utcnow() + JWT_ACCESS_TOKEN_EXPIRES
        access_token_payload = {
            'sub': users[primary_email]['id'],
            'name': users[primary_email]['name'],
            'email': primary_email,
            'exp': access_token_expiry
        }
        
        # Refresh token with longer expiry
        refresh_token_expiry = datetime.datetime.utcnow() + JWT_REFRESH_TOKEN_EXPIRES
        refresh_token_payload = {
            'sub': users[primary_email]['id'],
            'exp': refresh_token_expiry
        }
        
        access_token = pyjwt.encode(access_token_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        refresh_token = pyjwt.encode(refresh_token_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

        # Redirect to frontend with tokens as query parameters
        # The frontend should extract these tokens and store them
        return redirect(f"{FRONTEND_URL}/auth/callback?accessToken={access_token}&refreshToken={refresh_token}&expiresAt={int(access_token_expiry.timestamp() * 1000)}")

    except Exception as e:
        print(f"Error in GitHub callback: {e}")
        # Ensure we close any open resources
        if 'token_session' in locals():
            token_session.close()
        return redirect(f"{FRONTEND_URL}?error=server_error")

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Direct login with email and password, returns JWT tokens"""
    data = request.json
    email = data.get('email', '')
    
    # For demo purposes, create a new user if it doesn't exist
    if email not in users:
        user_id = str(uuid.uuid4())
        users[email] = {
            "id": user_id,
            "name": email.split('@')[0],
            "email": email,
            "authenticated": True
        }
    
    # Create JWT tokens
    access_token_expiry = datetime.datetime.utcnow() + JWT_ACCESS_TOKEN_EXPIRES
    refresh_token_expiry = datetime.datetime.utcnow() + JWT_REFRESH_TOKEN_EXPIRES
    
    access_token_payload = {
        'sub': users[email]['id'],
        'name': users[email]['name'],
        'email': email,
        'exp': access_token_expiry
    }
    
    refresh_token_payload = {
        'sub': users[email]['id'],
        'exp': refresh_token_expiry
    }
    
    access_token = pyjwt.encode(access_token_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    refresh_token = pyjwt.encode(refresh_token_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    return jsonify({
        'accessToken': access_token,
        'refreshToken': refresh_token,
        'expiresAt': int(access_token_expiry.timestamp() * 1000),
        'user': {
            'id': users[email]['id'],
            'name': users[email]['name'],
            'email': email,
            'authenticated': True
        }
    })

@app.route('/api/auth/refresh', methods=['POST'])
def refresh_token():
    """Refresh the access token using the refresh token"""
    data = request.json
    refresh_token = data.get('refreshToken')
    
    if not refresh_token:
        return jsonify({'message': 'Refresh token is required'}), 400
        
    try:
        # Verify the refresh token
        payload = pyjwt.decode(refresh_token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        # Find user by ID
        user_id = payload['sub']
        user_email = None
        user_name = None
        
        for email, user in users.items():
            if user['id'] == user_id:
                user_email = email
                user_name = user['name']
                break
                
        if not user_email:
            return jsonify({'message': 'User not found'}), 401
        
        # Generate new access token
        access_token_expiry = datetime.datetime.utcnow() + JWT_ACCESS_TOKEN_EXPIRES
        
        access_token_payload = {
            'sub': user_id,
            'name': user_name,
            'email': user_email,
            'exp': access_token_expiry
        }
        
        new_access_token = pyjwt.encode(access_token_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        
        return jsonify({
            'accessToken': new_access_token,
            'expiresAt': int(access_token_expiry.timestamp() * 1000)
        })
    except pyjwt.exceptions.ExpiredSignatureError:
        return jsonify({'message': 'Refresh token has expired'}), 401
    except pyjwt.exceptions.InvalidTokenError:
        return jsonify({'message': 'Invalid refresh token'}), 401

@app.route('/api/auth/logout', methods=['POST'])
@jwt_required
def logout():
    if 'user_id' in session:
        user_id = session['user_id']
        # Find user by ID and set authenticated to false
        for email, user in users.items():
            if user['id'] == user_id:
                user['authenticated'] = False
                break
        session.clear()
    return jsonify({"success": True})

@app.route('/api/auth/session', methods=['GET'])
@jwt_required
def check_session():
    """Check if user is authenticated using JWT token"""
    # The jwt_required decorator already verified the token
    # and stored the user info in request.user
    user_info = request.user
    
    return jsonify({
        "authenticated": True,
        "user": {
            "id": user_info.get('sub'),
            "name": user_info.get('name'),
            "email": user_info.get('email'),
            "authenticated": True
        }
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "API is running"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
