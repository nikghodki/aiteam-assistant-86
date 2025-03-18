
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

# Set a secret key for sessions
app.secret_key = os.environ.get('FLASK_SECRET_KEY', str(uuid.uuid4()))

# Mock data for demo purposes
kubernetes_clusters = [
    # ... keep existing code (kubernetes_clusters array definition)
]

# Mock namespace data
namespaces_by_cluster = {
    # ... keep existing code (namespaces_by_cluster object definition)
}

# Updated mock namespace issues data to include kind and name
namespace_issues = {
    # ... keep existing code (namespace_issues object definition)
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
        
        # Return user info
        user_data = {
            "id": users[email]['id'],
            "name": users[email]['name'],
            "email": users[email]['email'],
            "authenticated": True
        }
        
        return jsonify({"success": True, "user": user_data})
    
    return jsonify({"error": "Invalid email or password"}), 401

@app.route('/api/auth/saml/login', methods=['GET'])
def saml_login():
    """Initiate SAML login flow"""
    if not SAML_ENABLED:
        return jsonify({"error": "SAML authentication is not enabled"}), 501
    
    req = prepare_flask_request(request)
    auth = init_saml_auth(req)
    
    if not auth:
        return jsonify({"error": "SAML configuration error"}), 500
    
    redirect_url = request.args.get('redirect_url', '/dashboard')
    session['saml_redirect_url'] = redirect_url
    
    # Redirect to IdP
    sso_built_url = auth.login()
    return redirect(sso_built_url)

@app.route('/api/auth/saml/metadata', methods=['GET'])
def saml_metadata():
    """Serve SAML metadata"""
    if not SAML_ENABLED:
        return jsonify({"error": "SAML authentication is not enabled"}), 501
    
    req = prepare_flask_request(request)
    auth = init_saml_auth(req)
    
    if not auth:
        return jsonify({"error": "SAML configuration error"}), 500
    
    settings = auth.get_settings()
    metadata = settings.get_sp_metadata()
    errors = settings.validate_metadata(metadata)
    
    if len(errors) == 0:
        resp = make_response(metadata, 200)
        resp.headers['Content-Type'] = 'text/xml'
    else:
        resp = make_response(', '.join(errors), 500)
    
    return resp

@app.route('/api/auth/saml/acs', methods=['POST'])
def saml_acs():
    """SAML Assertion Consumer Service"""
    if not SAML_ENABLED:
        return jsonify({"error": "SAML authentication is not enabled"}), 501
    
    req = prepare_flask_request(request)
    auth = init_saml_auth(req)
    
    if not auth:
        return jsonify({"error": "SAML configuration error"}), 500
    
    auth.process_response()
    errors = auth.get_errors()
    
    if len(errors) == 0 and auth.is_authenticated():
        # Get user attributes from SAML response
        saml_attributes = auth.get_attributes()
        name_id = auth.get_nameid()
        
        # Get email from SAML attributes or use the name_id if it's an email
        email = None
        if 'email' in saml_attributes:
            email = saml_attributes['email'][0]
        elif '@' in name_id:
            email = name_id
        
        if not email:
            return jsonify({"error": "Email not provided in SAML response"}), 400
        
        # Create or update user
        if email not in users:
            user_id = str(uuid.uuid4())
            username = email.split('@')[0]
            users[email] = {
                "id": user_id,
                "name": username,
                "email": email,
                "password": None,  # SAML users don't have passwords
                "authenticated": True
            }
        
        # Set user session
        session['user_id'] = users[email]['id']
        users[email]['authenticated'] = True
        
        # Get redirect URL
        redirect_url = session.get('saml_redirect_url', '/dashboard')
        
        # Create a query param with the user info for frontend
        user_data = {
            "id": users[email]['id'],
            "name": users[email]['name'],
            "email": email,
            "authenticated": True
        }
        
        # Encode user data for URL
        user_data_str = base64.b64encode(json.dumps(user_data).encode('utf-8')).decode('utf-8')
        redirect_with_data = f"{redirect_url}?user_data={quote(user_data_str)}"
        
        return redirect(redirect_with_data)
    
    return jsonify({"error": "SAML authentication failed: " + ', '.join(errors)}), 401

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

@app.route('/api/auth/saml/logout', methods=['GET'])
def saml_logout():
    """Initiate SAML logout flow"""
    if not SAML_ENABLED:
        return jsonify({"error": "SAML authentication is not enabled"}), 501
    
    req = prepare_flask_request(request)
    auth = init_saml_auth(req)
    
    if not auth:
        return jsonify({"error": "SAML configuration error"}), 500
    
    name_id = None
    session_index = None
    
    if 'samlNameId' in session:
        name_id = session['samlNameId']
    
    if 'samlSessionIndex' in session:
        session_index = session['samlSessionIndex']
    
    # Clear session first
    session.clear()
    
    # Redirect to IdP for SLO if we have the required info
    if name_id is not None and session_index is not None:
        slo_url = auth.logout(name_id=name_id, session_index=session_index)
        return redirect(slo_url)
    
    # Otherwise just return success
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
                    "authenticated": True
                }
                return jsonify({"authenticated": True, "user": user_data})
    
    return jsonify({"authenticated": False})

# Get clusters by environment
@app.route('/api/kubernetes/clusters', methods=['GET'])
def get_clusters():
    # ... keep existing code (get_clusters function implementation)

# Get namespaces for a cluster
@app.route('/api/kubernetes/namespaces', methods=['POST'])
def get_namespaces():
    # ... keep existing code (get_namespaces function implementation)

# Execute a command on a Kubernetes cluster
@app.route('/api/kubernetes/command', methods=['POST'])
def run_command():
    # ... keep existing code (run_command function implementation)

# Chat with Kubernetes assistant
@app.route('/api/kubernetes/chat', methods=['POST'])
def kubernetes_chat():
    # ... keep existing code (kubernetes_chat function implementation)

# Get issues in a namespace
@app.route('/api/kubernetes/namespace-issues', methods=['POST'])
def get_namespace_issues():
    # ... keep existing code (get_namespace_issues function implementation)

if __name__ == '__main__':
    # For development, use HTTP or self-signed HTTPS
    if os.environ.get('HTTPS_ENABLED', '0') == '1':
        # Create SSL context with proper ciphers and protocols
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain('cert.pem', 'key.pem')
        # Set secure protocols
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        # Set secure ciphers
        context.set_ciphers('ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384')
        app.run(host='0.0.0.0', port=8000, ssl_context=context)
    else:
        app.run(host='0.0.0.0', port=8000, debug=True)
