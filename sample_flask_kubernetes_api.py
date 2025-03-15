
from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import random
import uuid

app = Flask(__name__)
CORS(app)

# Mock data for demo purposes
kubernetes_clusters = [
    {
        "id": "cluster-1",
        "arn": "arn:aws:eks:us-west-2:123456789012:cluster/production-cluster",
        "name": "production-cluster",
        "status": "healthy",
        "version": "1.25",
        "environment": "production",
        "nodeCount": 5
    },
    {
        "id": "cluster-2",
        "arn": "arn:aws:eks:us-west-2:123456789012:cluster/qa-cluster",
        "name": "qa-cluster",
        "status": "warning",
        "version": "1.24",
        "environment": "qa",
        "nodeCount": 3
    },
    {
        "id": "cluster-3",
        "arn": "arn:aws:eks:us-west-2:123456789012:cluster/staging-cluster",
        "name": "staging-cluster",
        "status": "error",
        "version": "1.23",
        "environment": "staging",
        "nodeCount": 3
    }
]

# Mock namespace data
namespaces_by_cluster = {
    "arn:aws:eks:us-west-2:123456789012:cluster/production-cluster": ["default", "kube-system", "logging", "monitoring", "app-production"],
    "arn:aws:eks:us-west-2:123456789012:cluster/qa-cluster": ["default", "kube-system", "qa-testing", "monitoring"],
    "arn:aws:eks:us-west-2:123456789012:cluster/staging-cluster": ["default", "kube-system", "staging", "monitoring"]
}

# Mock namespace issues data
namespace_issues = {
    "default": [
        {
            "id": str(uuid.uuid4()),
            "severity": "low",
            "component": "CoreDNS",
            "message": "CoreDNS pods are running at high CPU utilization",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
    ],
    "kube-system": [
        {
            "id": str(uuid.uuid4()),
            "severity": "critical",
            "component": "etcd",
            "message": "etcd is experiencing high latency",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        },
        {
            "id": str(uuid.uuid4()),
            "severity": "high",
            "component": "kube-apiserver",
            "message": "API server is experiencing high request rate",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
    ],
    "monitoring": [
        {
            "id": str(uuid.uuid4()),
            "severity": "medium",
            "component": "Prometheus",
            "message": "Prometheus storage is nearly full",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
    ],
    "app-production": [
        {
            "id": str(uuid.uuid4()),
            "severity": "high",
            "component": "Deployment/frontend",
            "message": "Pod OOMKilled events detected - insufficient memory",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        },
        {
            "id": str(uuid.uuid4()),
            "severity": "medium",
            "component": "ConfigMap/app-config",
            "message": "ConfigMap out of sync with deployment",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
    ],
    "qa-testing": [
        {
            "id": str(uuid.uuid4()),
            "severity": "low",
            "component": "Job/integration-tests",
            "message": "Integration test job failing intermittently",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
    ],
    "staging": []
}

# Get clusters by environment
@app.route('/api/kubernetes/clusters', methods=['GET'])
def get_clusters():
    environment = request.args.get('environment')
    
    if environment:
        filtered_clusters = [cluster for cluster in kubernetes_clusters if cluster.get('environment') == environment]
        return jsonify(filtered_clusters)
    
    return jsonify(kubernetes_clusters)

# Get namespaces for a cluster
@app.route('/api/kubernetes/namespaces', methods=['POST'])
def get_namespaces():
    data = request.json
    
    if not data or 'clusterArn' not in data:
        return jsonify({"error": "clusterArn is required"}), 400
    
    cluster_arn = data.get('clusterArn')
    
    # Return the namespaces for the given cluster or an empty list
    return jsonify(namespaces_by_cluster.get(cluster_arn, []))

# Execute a command on a Kubernetes cluster
@app.route('/api/kubernetes/command', methods=['POST'])
def run_command():
    data = request.json
    
    if not data or 'clusterArn' not in data or 'command' not in data or 'namespace' not in data:
        return jsonify({"error": "clusterArn, command, and namespace are required"}), 400
    
    cluster_arn = data.get('clusterArn')
    command = data.get('command')
    namespace = data.get('namespace')
    
    # In a real implementation, this would execute the command on the cluster
    # For demo purposes, we'll simulate command execution
    
    time.sleep(random.uniform(0.5, 2.0))  # Simulate command execution time
    
    # Simplified command handling for demo
    if "get pods" in command:
        return jsonify({
            "output": f"NAME                                READY   STATUS    RESTARTS   AGE\n"
                     f"nginx-deployment-66b6c48dd5-8tsp9    1/1     Running   0          1d\n"
                     f"nginx-deployment-66b6c48dd5-vx9k2    1/1     Running   0          1d\n",
            "exitCode": 0
        })
    elif "get deployments" in command:
        return jsonify({
            "output": f"NAME               READY   UP-TO-DATE   AVAILABLE   AGE\n"
                     f"nginx-deployment    2/2     2            2           1d\n",
            "exitCode": 0
        })
    elif "describe pod" in command:
        return jsonify({
            "output": f"Name:         nginx-deployment-66b6c48dd5-8tsp9\n"
                     f"Namespace:    {namespace}\n"
                     f"Priority:     0\n"
                     f"Node:         node-1/10.0.1.5\n"
                     f"Start Time:   Tue, 15 Mar 2025 10:30:00 +0000\n"
                     f"Labels:       app=nginx\n"
                     f"Status:       Running\n",
            "exitCode": 0
        })
    else:
        # For an invalid command, return an error
        return jsonify({
            "output": "",
            "error": f"Error: failed to execute command '{command}' on cluster '{cluster_arn}'",
            "exitCode": 1
        })

# Chat with Kubernetes assistant
@app.route('/api/kubernetes/chat', methods=['POST'])
def kubernetes_chat():
    data = request.json
    
    if not data or 'clusterArn' not in data or 'message' not in data or 'namespace' not in data:
        return jsonify({"error": "clusterArn, message, and namespace are required"}), 400
    
    cluster_arn = data.get('clusterArn')
    message = data.get('message')
    namespace = data.get('namespace')
    
    # In a real implementation, this would call an AI service
    # For demo purposes, simulate responses based on keywords
    
    time.sleep(random.uniform(0.5, 1.5))  # Simulate AI processing time
    
    if "pod" in message.lower() and "not starting" in message.lower():
        return jsonify({
            "response": f"It looks like you're having issues with pods not starting in the {namespace} namespace. Here are some common reasons:\n\n"
                       f"1. Insufficient cluster resources (CPU/memory)\n"
                       f"2. Image pull issues\n"
                       f"3. ConfigMap or Secret mounting problems\n\n"
                       f"Let's check the pod status with:\n\n"
                       f"```\nkubectl get pods -n {namespace}\n```\n\n"
                       f"Then we can describe a specific pod to see detailed status:\n\n"
                       f"```\nkubectl describe pod <pod-name> -n {namespace}\n```"
        })
    elif "deployment" in message.lower() and "scaling" in message.lower():
        return jsonify({
            "response": f"To scale a deployment in the {namespace} namespace, you can use the scale command:\n\n"
                       f"```\nkubectl scale deployment/<deployment-name> --replicas=<count> -n {namespace}\n```\n\n"
                       f"Or you can edit the deployment directly:\n\n"
                       f"```\nkubectl edit deployment/<deployment-name> -n {namespace}\n```\n\n"
                       f"And update the `spec.replicas` field to your desired count."
        })
    else:
        return jsonify({
            "response": f"I'll help you debug your Kubernetes issues in the {namespace} namespace on cluster {cluster_arn.split('/')[-1]}. "
                       f"Could you provide more details about what specific problem you're experiencing? "
                       f"For example, are you seeing pod crashes, network issues, or resource constraints?"
        })

# Get issues in a namespace
@app.route('/api/kubernetes/namespace-issues', methods=['POST'])
def get_namespace_issues():
    data = request.json
    
    if not data or 'clusterArn' not in data or 'namespace' not in data:
        return jsonify({"error": "clusterArn and namespace are required"}), 400
    
    namespace = data.get('namespace')
    
    # Return issues for the specific namespace or an empty list if none exist
    return jsonify(namespace_issues.get(namespace, []))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
