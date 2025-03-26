
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import json
import os
import datetime
import uuid
import jwt
import boto3
from functools import wraps

app = Flask(__name__)
CORS(app)

# JWT Configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your_jwt_secret_key_for_development')
JWT_ALGORITHM = 'HS256'
JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(hours=1)
JWT_REFRESH_TOKEN_EXPIRES = datetime.timedelta(days=30)

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
            # Verify the token
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            # Store user info in request context for later use
            request.user = payload
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
            
    return decorated

# Login endpoint that returns a JWT token
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    # In a real app, validate credentials against a database
    # For demo purposes, accept any login
    email = data.get('email', 'test@example.com')
    
    # Create JWT tokens
    access_token_expiry = datetime.datetime.utcnow() + JWT_ACCESS_TOKEN_EXPIRES
    refresh_token_expiry = datetime.datetime.utcnow() + JWT_REFRESH_TOKEN_EXPIRES
    
    access_token_payload = {
        'sub': str(uuid.uuid4()),
        'name': email.split('@')[0],
        'email': email,
        'exp': access_token_expiry
    }
    
    refresh_token_payload = {
        'sub': access_token_payload['sub'],
        'exp': refresh_token_expiry
    }
    
    access_token = jwt.encode(access_token_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    refresh_token = jwt.encode(refresh_token_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    return jsonify({
        'accessToken': access_token,
        'refreshToken': refresh_token,
        'expiresAt': int(access_token_expiry.timestamp() * 1000),
        'user': {
            'id': access_token_payload['sub'],
            'name': access_token_payload['name'],
            'email': access_token_payload['email'],
            'authenticated': True
        }
    })

# Refresh token endpoint
@app.route('/api/auth/refresh', methods=['POST'])
def refresh_token():
    data = request.json
    refresh_token = data.get('refreshToken')
    
    if not refresh_token:
        return jsonify({'message': 'Refresh token is required'}), 400
        
    try:
        # Verify the refresh token
        payload = jwt.decode(refresh_token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        # Generate new access token
        access_token_expiry = datetime.datetime.utcnow() + JWT_ACCESS_TOKEN_EXPIRES
        
        # In a real app, fetch user details from database using payload['sub']
        # For demo, we'll use placeholder values
        access_token_payload = {
            'sub': payload['sub'],
            'name': 'refreshed_user',
            'email': 'refreshed@example.com',
            'exp': access_token_expiry
        }
        
        new_access_token = jwt.encode(access_token_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        
        return jsonify({
            'accessToken': new_access_token,
            'expiresAt': int(access_token_expiry.timestamp() * 1000)
        })
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Refresh token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid refresh token'}), 401

# Helper function to upload file to S3 and return URL
def upload_to_s3(content, file_name=None):
    if s3_client is None:
        print("S3 client not initialized. Skipping S3 upload.")
        return None
        
    if file_name is None:
        file_name = f"debug-log-{str(uuid.uuid4())}.txt"
        
    try:
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=file_name,
            Body=content,
            ContentType='text/plain'
        )
        
        # Generate a URL for the uploaded file
        # For public buckets, use this format
        url = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/{file_name}"
        
        # For private buckets, generate a pre-signed URL
        # url = s3_client.generate_presigned_url(
        #     'get_object',
        #     Params={'Bucket': S3_BUCKET_NAME, 'Key': file_name},
        #     ExpiresIn=3600  # URL valid for 1 hour
        # )
        
        return url
    except Exception as e:
        print(f"Error uploading to S3: {str(e)}")
        return None

# Kubernetes API routes
@app.route('/api/kubernetes/clusters', methods=['GET'])
@jwt_required
def get_clusters():
    # For demo purposes, return mock data
    environment = request.args.get('environment', 'qa')
    
    clusters = [
        {
            "arn": "arn:aws:eks:us-west-2:123456789012:cluster/production-cluster-1",
            "name": "production-cluster-1", 
            "status": "healthy", 
            "version": "1.26", 
            "environment": "production",
            "nodeCount": 5
        },
        {
            "arn": "arn:aws:eks:us-west-2:123456789012:cluster/production-cluster-2", 
            "name": "production-cluster-2", 
            "status": "warning", 
            "version": "1.25", 
            "environment": "production",
            "nodeCount": 3
        },
        {
            "arn": "arn:aws:eks:us-east-1:123456789012:cluster/qa-cluster-1", 
            "name": "qa-cluster-1", 
            "status": "healthy", 
            "version": "1.24", 
            "environment": "qa",
            "nodeCount": 2
        },
        {
            "arn": "arn:aws:eks:us-east-1:123456789012:cluster/qa-cluster-2", 
            "name": "qa-cluster-2", 
            "status": "error", 
            "version": "1.24", 
            "environment": "qa",
            "nodeCount": 2
        },
        {
            "arn": "arn:aws:eks:us-east-1:123456789012:cluster/staging-cluster-1", 
            "name": "staging-cluster-1", 
            "status": "healthy", 
            "version": "1.27", 
            "environment": "staging",
            "nodeCount": 2
        }
    ]
    
    # Filter by environment if specified
    if environment:
        clusters = [c for c in clusters if c.get('environment') == environment]
    
    return jsonify(clusters)

@app.route('/api/kubernetes/namespaces', methods=['POST'])
@jwt_required
def get_namespaces():
    data = request.json
    cluster_arn = data.get('clusterArn')
    
    if not cluster_arn:
        return jsonify({"error": "clusterArn is required"}), 400
    
    # For demo purposes, return mock namespaces
    namespaces = ["default", "kube-system", "monitoring", "ingress-nginx", "cert-manager", "app-team-1", "app-team-2"]
    
    return jsonify(namespaces)

@app.route('/api/kubernetes/namespace-issues', methods=['POST'])
@jwt_required
def get_namespace_issues():
    data = request.json
    cluster_arn = data.get('clusterArn')
    namespace = data.get('namespace')
    
    if not cluster_arn:
        return jsonify({"error": "clusterArn is required"}), 400
    if not namespace:
        return jsonify({"error": "namespace is required"}), 400
    
    # For demo purposes, return mock issues for default namespace
    if namespace == "default":
        issues = [
            {
                "id": "issue-1",
                "severity": "high",
                "kind": "Deployment",
                "name": "frontend-app",
                "message": "Replicas not meeting desired count (1/3)",
                "timestamp": datetime.datetime.utcnow().isoformat()
            },
            {
                "id": "issue-2",
                "severity": "medium",
                "kind": "Pod",
                "name": "backend-app-78d5c8b6d4-2abcd",
                "message": "Container restarting frequently",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
        ]
    elif namespace == "kube-system":
        issues = [
            {
                "id": "issue-3",
                "severity": "critical",
                "kind": "Pod",
                "name": "kube-dns-78d5c8b6d4-xyz12",
                "message": "OOMKilled - Out of memory",
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
        ]
    else:
        issues = []
    
    return jsonify(issues)

@app.route('/api/kubernetes/command', methods=['POST'])
@jwt_required
def run_command():
    data = request.json
    cluster_arn = data.get('clusterArn')
    command = data.get('command')
    namespace = data.get('namespace', 'default')
    
    if not cluster_arn:
        return jsonify({"error": "clusterArn is required"}), 400
    if not command:
        return jsonify({"error": "command is required"}), 400
    
    # For demo purposes, return mock output based on the command
    if 'get pods' in command:
        output = """NAME                                READY   STATUS    RESTARTS   AGE
frontend-app-78d5c8b6d4-abcd1       1/1     Running   0          3d2h
frontend-app-78d5c8b6d4-abcd2       1/1     Running   0          3d2h
backend-app-78d5c8b6d4-2abcd        0/1     Error     3          1d5h
redis-cache-78d5c8b6d4-3abcd        1/1     Running   0          5d7h
"""
    elif 'get deployments' in command:
        output = """NAME                READY   UP-TO-DATE   AVAILABLE   AGE
frontend-app        2/3     3            2           5d
backend-app         0/1     1            0           5d
redis-cache         1/1     1            1           10d
"""
    elif 'describe pod' in command:
        output = """Name:         backend-app-78d5c8b6d4-2abcd
Namespace:    default
Priority:     0
Node:         ip-10-0-1-20.ec2.internal/10.0.1.20
Start Time:   Wed, 10 May 2023 12:00:00 +0000
Labels:       app=backend
              pod-template-hash=78d5c8b6d4
Status:       Running
IP:           192.168.1.5
Containers:
  backend:
    Container ID:  docker://abcdef1234567890
    Image:         backend:latest
    Image ID:      docker-pullable://backend@sha256:1234567890abcdef
    Port:          8080/TCP
    Host Port:     0/TCP
    State:         Waiting
      Reason:      CrashLoopBackOff
    Last State:    Terminated
      Reason:      Error
      Exit Code:   1
      Started:     Wed, 10 May 2023 15:15:20 +0000
      Finished:    Wed, 10 May 2023 15:15:30 +0000
    Ready:         False
    Restart Count: 3
Events:
  Type     Reason     Age                    From               Message
  ----     ------     ----                   ----               -------
  Normal   Scheduled  5m                     default-scheduler  Successfully assigned default/backend-app-78d5c8b6d4-2abcd to ip-10-0-1-20.ec2.internal
  Normal   Pulled     4m                     kubelet            Successfully pulled image "backend:latest"
  Normal   Created    4m                     kubelet            Created container backend
  Normal   Started    4m                     kubelet            Started container backend
  Warning  BackOff    2m (x3 over 4m)        kubelet            Back-off restarting failed container
"""
    else:
        output = f"Command executed: {command}\nCluster: {cluster_arn}\nNamespace: {namespace}\n\nNo specific mock output for this command."
    
    result = {
        "output": output,
        "exitCode": 0
    }
    
    return jsonify(result)

@app.route('/api/kubernetes/chat', methods=['POST'])
@jwt_required
def chat_with_assistant():
    data = request.json
    cluster_arn = data.get('clusterArn')
    message = data.get('message')
    namespace = data.get('namespace', 'default')
    
    if not cluster_arn:
        return jsonify({"error": "clusterArn is required"}), 400
    if not message:
        return jsonify({"error": "message is required"}), 400
    
    # Generate a sample response
    if 'pod' in message.lower() and 'error' in message.lower():
        response = """I can help you troubleshoot the pod issue. First, let's check the pod's status and events:

```bash
kubectl get pod backend-app-78d5c8b6d4-2abcd -n default
```

The pod is in a CrashLoopBackOff state. Let's check the logs to see what's happening:

```bash
kubectl logs backend-app-78d5c8b6d4-2abcd -n default
```

Based on the logs, it looks like the application is failing to connect to the database. Let's check if the database service is running:

```bash
kubectl get svc postgres -n default
```

You should verify the database connection string in your application configuration. The most common issues are:

1. Incorrect database hostname or credentials
2. Database not running or not accessible from the pod
3. Network policy blocking the connection

Try updating the environment variables for your deployment with the correct database connection string:

```bash
kubectl set env deployment/backend-app DATABASE_URL=postgres://username:password@postgres:5432/dbname
```

Then restart the deployment:

```bash
kubectl rollout restart deployment backend-app
```
"""
    elif 'deployment' in message.lower() and 'replica' in message.lower():
        response = """Let me help troubleshoot the deployment replica issue. First, let's check the deployment status:

```bash
kubectl get deployment frontend-app -n default
```

The deployment shows 2/3 ready pods. Let's see what's happening with the pods:

```bash
kubectl get pods -l app=frontend-app -n default
```

Now let's check the events for the deployment:

```bash
kubectl describe deployment frontend-app -n default
```

Common reasons for replicas not meeting the desired count include:

1. Resource constraints (not enough CPU/memory on nodes)
2. Pod scheduling issues (node selectors, taints/tolerations)
3. Image pull errors
4. Application errors during startup

Let's check if there are resource constraints on the nodes:

```bash
kubectl describe nodes | grep -A 5 "Allocated resources"
```

You can also check the events for any failed pods:

```bash
kubectl get events --sort-by='.lastTimestamp' | grep frontend-app
```

If it's a resource issue, consider updating your deployment to request less resources:

```bash
kubectl set resources deployment frontend-app --requests=cpu=100m,memory=256Mi
```
"""
    else:
        response = f"I understand you're asking about {message} for cluster {cluster_arn} in namespace {namespace}. Please provide more specific details about the issue you're encountering, and I'll help troubleshoot it."
    
    # Generate a debug file for this interaction
    debug_content = f"""## Debug Log for Kubernetes Troubleshooting
Timestamp: {datetime.datetime.utcnow().isoformat()}
Cluster: {cluster_arn}
Namespace: {namespace}

## Request
{message}

## Response
{response}
"""
    
    # Upload to S3 and get the file path
    file_name = f"debug-log-{str(uuid.uuid4())}.txt"
    s3_url = upload_to_s3(debug_content, file_name)
    
    return jsonify({
        "response": response,
        "file_name": s3_url or file_name
    })

@app.route('/api/kubernetes/debug-file/<session_id>', methods=['GET'])
@jwt_required
def get_debug_file(session_id):
    # In a real app, retrieve the file from storage based on the session_id
    # For demo, we'll return a mock URL
    
    if s3_client is not None:
        file_name = f"debug-log-{session_id}.txt"
        url = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/{file_name}"
    else:
        url = f"https://example.com/debug-logs/debug-log-{session_id}.txt"
    
    return jsonify({
        "url": url
    })

# Default route for API health check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Kubernetes AI API is running"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
