
import os
import uuid
import base64
import logging
from datetime import datetime, timedelta
from flask import Blueprint, request, redirect, session, jsonify, current_app
from onelogin.saml2.auth import OneLogin_Saml2_Auth
from onelogin.saml2.settings import OneLogin_Saml2_Settings
from onelogin.saml2.utils import OneLogin_Saml2_Utils
from api.auth import jwt_required, users, create_tokens_for_user, FRONTEND_URL

saml_bp = Blueprint('saml', __name__)
logger = logging.getLogger(__name__)

# Default SAML configuration
SAML_CONFIG = {
    'strict': True,
    'debug': True,
    'sp': {
        'entityId': os.environ.get('SAML_SP_ENTITY_ID', 'http://localhost:8000/api/auth/saml/metadata'),
        'assertionConsumerService': {
            'url': os.environ.get('SAML_SP_ACS_URL', 'http://localhost:8000/api/auth/saml/callback'),
            'binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST'
        },
        'singleLogoutService': {
            'url': os.environ.get('SAML_SP_SLO_URL', 'http://localhost:8000/api/auth/saml/logout'),
            'binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect'
        },
        'NameIDFormat': 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        'x509cert': os.environ.get('SAML_SP_CERT', ''),
        'privateKey': os.environ.get('SAML_SP_KEY', '')
    },
    'idp': {
        'entityId': os.environ.get('SAML_IDP_ENTITY_ID', ''),
        'singleSignOnService': {
            'url': os.environ.get('SAML_IDP_SSO_URL', ''),
            'binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect'
        },
        'singleLogoutService': {
            'url': os.environ.get('SAML_IDP_SLO_URL', ''),
            'binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect'
        },
        'x509cert': os.environ.get('SAML_IDP_CERT', '')
    },
    'security': {
        'nameIdEncrypted': False,
        'authnRequestsSigned': False,
        'logoutRequestSigned': False,
        'logoutResponseSigned': False,
        'signMetadata': False,
        'wantMessagesSigned': False,
        'wantAssertionsSigned': False,
        'wantNameId': True,
        'wantNameIdEncrypted': False,
        'wantAssertionsEncrypted': False,
        'allowSingleLabelDomains': False,
        'signatureAlgorithm': 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
        'digestAlgorithm': 'http://www.w3.org/2001/04/xmlenc#sha256'
    },
    'contactPerson': {
        'technical': {
            'givenName': 'Tech Admin',
            'emailAddress': 'tech@example.com'
        },
        'support': {
            'givenName': 'Support',
            'emailAddress': 'support@example.com'
        }
    },
    'organization': {
        'en-US': {
            'name': 'Example Organization',
            'displayname': 'Example',
            'url': 'https://example.com'
        }
    }
}

def prepare_flask_request(request):
    """Prepare Flask request for OneLogin SAML library."""
    url_data = request.url.split('?')
    https = request.scheme == 'https'
    return {
        'https': https,
        'http_host': request.host,
        'script_name': request.path,
        'get_data': request.args.copy(),
        'post_data': request.form.copy()
    }

def get_saml_auth(req):
    """Get a OneLogin_Saml2_Auth object."""
    try:
        return OneLogin_Saml2_Auth(req, SAML_CONFIG)
    except Exception as e:
        logger.error(f"Error initializing SAML auth: {str(e)}")
        raise

@saml_bp.route('/api/auth/saml/config', methods=['GET'])
@jwt_required
def get_saml_config():
    """Get the current SAML configuration."""
    # Sanitize config by removing sensitive information
    sanitized_config = {
        'sp': {
            'entityId': SAML_CONFIG['sp']['entityId'],
            'assertionConsumerService': SAML_CONFIG['sp']['assertionConsumerService'],
            'nameIDFormat': SAML_CONFIG['sp']['NameIDFormat']
        },
        'idp': {
            'entityId': SAML_CONFIG['idp']['entityId'],
            'singleSignOnService': SAML_CONFIG['idp']['singleSignOnService']
        }
    }
    return jsonify(sanitized_config)

@saml_bp.route('/api/auth/saml/config', methods=['POST'])
@jwt_required
def update_saml_config():
    """Update the SAML configuration."""
    try:
        data = request.json
        
        if 'sp' in data:
            if 'entityId' in data['sp']:
                SAML_CONFIG['sp']['entityId'] = data['sp']['entityId']
            if 'assertionConsumerService' in data['sp'] and 'url' in data['sp']['assertionConsumerService']:
                SAML_CONFIG['sp']['assertionConsumerService']['url'] = data['sp']['assertionConsumerService']['url']
            if 'NameIDFormat' in data['sp']:
                SAML_CONFIG['sp']['NameIDFormat'] = data['sp']['NameIDFormat']
            if 'x509cert' in data['sp']:
                SAML_CONFIG['sp']['x509cert'] = data['sp']['x509cert']
            if 'privateKey' in data['sp']:
                SAML_CONFIG['sp']['privateKey'] = data['sp']['privateKey']
            
        if 'idp' in data:
            if 'entityId' in data['idp']:
                SAML_CONFIG['idp']['entityId'] = data['idp']['entityId']
            if 'singleSignOnService' in data['idp'] and 'url' in data['idp']['singleSignOnService']:
                SAML_CONFIG['idp']['singleSignOnService']['url'] = data['idp']['singleSignOnService']['url']
            if 'x509cert' in data['idp']:
                SAML_CONFIG['idp']['x509cert'] = data['idp']['x509cert']
        
        return jsonify({"message": "SAML configuration updated successfully"})
    except Exception as e:
        logger.error(f"Error updating SAML config: {str(e)}")
        return jsonify({"error": str(e)}), 400

@saml_bp.route('/api/auth/saml/metadata', methods=['GET'])
def metadata():
    """Get the Service Provider metadata."""
    try:
        settings = OneLogin_Saml2_Settings(settings=SAML_CONFIG, sp_validation_only=True)
        metadata = settings.get_sp_metadata()
        errors = settings.validate_metadata(metadata)
        
        if len(errors) == 0:
            resp = current_app.response_class(
                response=metadata,
                status=200,
                mimetype='text/xml'
            )
            return resp
        else:
            logger.error(f"Error with SAML metadata: {', '.join(errors)}")
            return jsonify({"error": errors}), 400
    except Exception as e:
        logger.error(f"Error generating SAML metadata: {str(e)}")
        return jsonify({"error": str(e)}), 500

@saml_bp.route('/api/auth/saml', methods=['GET'])
def init_saml_auth():
    """Initialize SAML authentication by redirecting to IdP."""
    try:
        req = prepare_flask_request(request)
        auth = get_saml_auth(req)
        
        # Store relay state for later use
        relay_state = FRONTEND_URL
        session['saml_relay_state'] = relay_state
        
        return redirect(auth.login(relay_state))
    except Exception as e:
        logger.error(f"Error initiating SAML auth: {str(e)}")
        return redirect(f"{FRONTEND_URL}/auth/callback?error=saml_init_error")

@saml_bp.route('/api/auth/saml/callback', methods=['POST'])
def saml_callback():
    """Handle the SAML callback from the IdP."""
    try:
        req = prepare_flask_request(request)
        auth = get_saml_auth(req)
        
        # Process the SAML response
        auth.process_response()
        errors = auth.get_errors()
        
        # Get the relay state (where to redirect after)
        relay_state = request.form.get('RelayState', FRONTEND_URL)
        
        if len(errors) == 0 and auth.is_authenticated():
            # Get the user info from the SAML response
            saml_user = {
                'nameID': auth.get_nameid(),
                'nameIDFormat': auth.get_nameid_format(),
                'attributes': auth.get_attributes()
            }
            
            # Extract useful information from SAML attributes
            email = saml_user['nameID']
            name = None
            
            if saml_user['attributes']:
                # Try to get common attribute names for user info
                for name_attr in ['name', 'displayName', 'cn', 'givenName', 'firstName']:
                    if name_attr in saml_user['attributes']:
                        name = saml_user['attributes'][name_attr][0]
                        break
                
                # Use email attributes if not found in nameID
                for email_attr in ['email', 'mail', 'emailAddress', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']:
                    if email_attr in saml_user['attributes'] and not email:
                        email = saml_user['attributes'][email_attr][0]
                        break
            
            if not name:
                name = email.split('@')[0]
            
            # Check if this user exists, or create a new one
            user_id = None
            for uid, user in users.items():
                if user.get('email') == email:
                    user_id = uid
                    break
            
            if not user_id:
                user_id = str(uuid.uuid4())
                users[email] = {
                    "id": user_id,
                    "name": name,
                    "email": email,
                    "authenticated": True
                }
            else:
                users[email]['authenticated'] = True
            
            # Create JWT tokens
            tokens = create_tokens_for_user(user_id, name, email)
            
            # Redirect to frontend with tokens as query parameters
            return redirect(
                f"{FRONTEND_URL}/auth/callback"
                f"?accessToken={tokens['accessToken']}"
                f"&refreshToken={tokens['refreshToken']}"
                f"&expiresAt={tokens['expiresAt']}"
            )
        else:
            # Authentication failed
            logger.error(f"SAML authentication failed: {', '.join(errors)}")
            last_error = auth.get_last_error_reason()
            return redirect(
                f"{FRONTEND_URL}/auth/callback?error=saml_auth_failed&reason={last_error}"
            )
    except Exception as e:
        logger.error(f"Error in SAML callback: {str(e)}")
        return redirect(f"{FRONTEND_URL}/auth/callback?error=saml_callback_error")

@saml_bp.route('/api/auth/saml/logout', methods=['GET'])
def saml_logout():
    """Logout from SAML session."""
    try:
        req = prepare_flask_request(request)
        auth = get_saml_auth(req)
        
        # Get the URL to redirect after logout
        return_to = f"{FRONTEND_URL}/"
        
        # If already not logged in, just redirect
        if 'saml_nameId' not in session:
            return redirect(return_to)
        
        # Get name_id, session_index for logout
        name_id = session.get('saml_nameId')
        session_index = session.get('saml_sessionIndex')
        
        # Clean up the session
        session.clear()
        
        # Redirect to IdP SLO
        return redirect(auth.logout(return_to=return_to, name_id=name_id, session_index=session_index))
    except Exception as e:
        logger.error(f"Error in SAML logout: {str(e)}")
        session.clear()  # Still clear session in case of error
        return redirect(FRONTEND_URL)

@saml_bp.route('/api/auth/saml/test', methods=['POST'])
@jwt_required
def test_saml_connection():
    """Test the SAML connection without performing full authentication."""
    try:
        # Validate IdP settings
        if not SAML_CONFIG['idp']['entityId'] or not SAML_CONFIG['idp']['singleSignOnService']['url']:
            return jsonify({"error": "IdP configuration incomplete"}), 400
        
        # Try to create settings and validate
        settings = OneLogin_Saml2_Settings(settings=SAML_CONFIG)
        
        # Return success if no exception was raised
        return jsonify({"message": "SAML configuration is valid", "status": "success"})
    except Exception as e:
        logger.error(f"SAML configuration test failed: {str(e)}")
        return jsonify({"error": str(e), "status": "failed"}), 400
