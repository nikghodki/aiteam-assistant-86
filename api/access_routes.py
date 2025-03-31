
import logging
import random
import os
from flask import Blueprint, request, jsonify
from api.auth import jwt_required

access_bp = Blueprint('access', __name__)

# Mock data and functions to simulate the real functionality
# In a real app, you'd import actual agents and services
def mock_get_user_id(url, email, headers):
    return f"user-{hash(email) % 10000}"

def mock_get_user_membership(url, user_id, headers):
    groups = ["developers", "admins", "testers", "operations"]
    # Return 1-3 random groups
    return random.sample(groups, random.randint(1, 3))

def mock_remove_user_from_group(url, email, group):
    return {"success": True, "message": f"User {email} removed from group {group}"}

def mock_doc_qna(message, history):
    responses = [
        "Documentation is a crucial part of any software project.",
        "The Kubernetes API server is the central management component.",
        "Access control can be managed through various authentication methods.",
        "Please refer to the documentation for more details on this topic."
    ]
    return random.choice(responses)

def mock_access_management(message, email):
    return f"Processing request: '{message}' for user {email}. Access management operation completed."

# MyID URL for access management
url_myid = os.environ.get("MYID_URL", "https://myid.example.com/api")

@access_bp.route('/api/access/groups', methods=['POST'])
@jwt_required
def get_user_groups():
    data = request.json
    user_email = data.get('userEmail', 'Anonymous User')
    
    # Simulate the real functionality
    user_id = mock_get_user_id(url_myid, user_email, {})
    groups = mock_get_user_membership(url_myid, user_id, {})
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

@access_bp.route('/api/access/groups/leave', methods=['POST'])
@jwt_required
def leave_groups():
    data = request.json
    logging.info(f"Leaving group: {data.get('groupName')}")
    return jsonify(mock_remove_user_from_group(url_myid, data.get('userEmail', 'Anonymous User'), data.get('groupName')))

@access_bp.route('/api/docs/chat', methods=['POST'])
@jwt_required
def doc_chat():
    data = request.json
    logging.info(f"Doc chat: {data.get('message')}")
    return jsonify({"response": mock_doc_qna(data.get('message'), data.get('history'))})

@access_bp.route('/api/access/chat', methods=['POST'])
@jwt_required
def access_chat():
    data = request.json
    logging.info(f"Access chat: {data.get('message')}")
    return jsonify({"response": mock_access_management(data.get('message'), data.get('userEmail'))})
