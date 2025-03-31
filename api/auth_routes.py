import os
import uuid
import requests
import jwt
from flask import Blueprint, request, jsonify, redirect, session
from api.auth import (
    jwt_required, users, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET,
    GITHUB_REDIRECT_URI, FRONTEND_URL, create_tokens_for_user
)

auth_bp = Blueprint('auth', __name__)

def configure_auth(app):
    # Make sure the app has a secret key for session handling
    if not app.secret_key:
        app.secret_key = 'your_flask_secret_key_for_development'

@auth_bp.route('/api/auth/github', methods=['GET'])
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

@auth_bp.route('/api/auth/github/callback', methods=['GET'])
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
        tokens = create_tokens_for_user(
            users[primary_email]['id'], 
            users[primary_email]['name'], 
            primary_email
        )
        
        # Redirect to frontend with tokens as query parameters
        # The frontend should extract these tokens and store them
        return redirect(f"{FRONTEND_URL}/auth/callback?accessToken={tokens['accessToken']}&refreshToken={tokens['refreshToken']}&expiresAt={tokens['expiresAt']}")

    except Exception as e:
        print(f"Error in GitHub callback: {e}")
        # Ensure we close any open resources
        if 'token_session' in locals():
            token_session.close()
        return redirect(f"{FRONTEND_URL}?error=server_error")

@auth_bp.route('/api/auth/login', methods=['POST'])
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
    tokens = create_tokens_for_user(
        users[email]['id'],
        users[email]['name'],
        email
    )
    
    return jsonify({
        **tokens,
        'user': {
            'id': users[email]['id'],
            'name': users[email]['name'],
            'email': email,
            'authenticated': True
        }
    })

@auth_bp.route('/api/auth/refresh', methods=['POST'])
def refresh_token():
    """Refresh the access token using the refresh token"""
    data = request.json
    refresh_token = data.get('refreshToken')
    
    if not refresh_token:
        return jsonify({'message': 'Refresh token is required'}), 400
        
    try:
        # Verify the refresh token
        payload = jwt.decode(refresh_token, os.environ.get('JWT_SECRET_KEY', 'your_jwt_secret_key_for_development'), algorithms=['HS256'])
        
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
        
        # Generate new tokens
        tokens = create_tokens_for_user(user_id, user_name, user_email)
        
        return jsonify({
            'accessToken': tokens['accessToken'],
            'expiresAt': tokens['expiresAt']
        })
    except jwt.PyJWTError:
        return jsonify({'message': 'Invalid refresh token'}), 401

@auth_bp.route('/api/auth/logout', methods=['POST'])
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

@auth_bp.route('/api/auth/session', methods=['GET'])
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
