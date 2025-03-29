
from flask import Flask, request, jsonify, redirect, session
from flask_cors import CORS
import os
import logging
import boto3
from api.auth_routes import auth_bp, configure_auth
from api.kubernetes_routes import kubernetes_bp
from api.access_routes import access_bp

# Configure logging
logging.basicConfig(level=logging.INFO)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'your_flask_secret_key_for_development')
CORS(app, supports_credentials=True, origins=['*'], allow_headers=['Content-Type', 'Authorization'])

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

# Configure authentication
configure_auth(app)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(kubernetes_bp)
app.register_blueprint(access_bp)

# Simple health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "API is running"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
