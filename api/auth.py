
import os
import datetime
import jwt
from functools import wraps
from flask import request, jsonify

# JWT Configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your_jwt_secret_key_for_development')
JWT_ALGORITHM = 'HS256'
JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(hours=1)
JWT_REFRESH_TOKEN_EXPIRES = datetime.timedelta(days=30)

# GitHub OAuth configuration
GITHUB_CLIENT_ID = os.environ.get('GITHUB_CLIENT_ID', 'your-github-client-id')
GITHUB_CLIENT_SECRET = os.environ.get('GITHUB_CLIENT_SECRET', 'your-github-client-secret')
GITHUB_REDIRECT_URI = os.environ.get('GITHUB_REDIRECT_URI', 'http://localhost:8000/api/auth/github/callback')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

# In-memory user storage (would be replaced with a database in production)
users = {}

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
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            # Store user info in request context for later use
            request.user = payload
            return f(*args, **kwargs)
        except jwt.PyJWTError:
            return jsonify({'message': 'Invalid token'}), 401

    return decorated

def create_tokens_for_user(user_id, name, email):
    """Create access and refresh tokens for a user"""
    access_token_expiry = datetime.datetime.utcnow() + JWT_ACCESS_TOKEN_EXPIRES
    refresh_token_expiry = datetime.datetime.utcnow() + JWT_REFRESH_TOKEN_EXPIRES
    
    access_token_payload = {
        'sub': user_id,
        'name': name,
        'email': email,
        'exp': access_token_expiry
    }
    
    refresh_token_payload = {
        'sub': user_id,
        'exp': refresh_token_expiry
    }
    
    access_token = jwt.encode(access_token_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    refresh_token = jwt.encode(refresh_token_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    return {
        'accessToken': access_token,
        'refreshToken': refresh_token,
        'expiresAt': int(access_token_expiry.timestamp() * 1000)
    }
