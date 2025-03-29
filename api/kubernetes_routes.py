
import os
import logging
import subprocess
import aws_eks_agent
import k8s_debugger_agent
from flask import Blueprint, request, jsonify
from api.auth import jwt_required

kubernetes_bp = Blueprint('kubernetes', __name__)

# Get the list of available clusters
kubernetes_clusters = aws_eks_agent.list_eks_clusters_with_arns()

@kubernetes_bp.route('/api/kubernetes/chat', methods=['POST'])
@jwt_required
def kubernetes_chat():
    data = request.json
    response, file_name = k8s_debugger_agent.debug(data.get('message'), data.get('clusterArn'), False, "NEVER", 100)
    logging.info(f"Kubernetes chat: {response}")
    logging.info(f"File name: {file_name}")
    return jsonify({"response": response, "file_name": f"/backend/{file_name}"})

@kubernetes_bp.route('/api/kubernetes/command', methods=['POST'])
@jwt_required
def kubernetes_command():
    data = request.json
    logging.info(f"Kubernetes command: {data.get('command')}")
    command = f"{data.get('command')} -n {data.get('namespace')} --context {data.get('clusterArn')}"
    response = subprocess.run(command, shell=True, capture_output=True, text=True)
    logging.info(f"Kubernetes command response: {response.stdout}")
    return jsonify({"output": response.stdout})

@kubernetes_bp.route('/api/kubernetes/namespaces', methods=['POST'])
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

@kubernetes_bp.route('/api/kubernetes/clusters', methods=['GET'])
@jwt_required
def get_clusters():
    environment = request.args.get('environment')
    kubernetes_clusters = aws_eks_agent.list_eks_clusters_with_arns()
    if environment == "staging":
        return jsonify([cluster for cluster in kubernetes_clusters if "stg" in cluster["name"]])
    elif environment == "production":
        return jsonify([cluster for cluster in kubernetes_clusters if "prod" in cluster["name"]])
    elif environment == "qa":
        return jsonify([cluster for cluster in kubernetes_clusters if "stg" not in cluster["name"]])
    return jsonify(kubernetes_clusters)

@kubernetes_bp.route('/api/kubernetes/namespace-issues', methods=['POST'])
@jwt_required
def get_namespace_issues():
    data = request.json
    logging.info(f"Kubernetes namespace issues: {data}")
    if not data or 'clusterArn' not in data or 'namespace' not in data:
        return jsonify({"error": "clusterArn and namespace are required"}), 400
    k8sgpt_output = k8s_debugger_agent.analyse(data.get('namespace'), data.get('clusterArn'))
    logging.info(f"Kubernetes namespace issues: {k8sgpt_output}")
    return jsonify(k8sgpt_output)
