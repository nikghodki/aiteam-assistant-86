
import logging
import random
import myid_agent
import access_management_agent
import doc_agent
from flask import Blueprint, request, jsonify
from api.auth import jwt_required

access_bp = Blueprint('access', __name__)

# MyID URL for access management
url_myid = os.environ.get("MYID_URL")
token = myid_agent.get_token()
headers = {'Authorization ': f'Bearer {token}', 'Accept': 'application/vnd.api+json'}

@access_bp.route('/api/access/groups', methods=['POST'])
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

@access_bp.route('/api/access/groups/leave', methods=['POST'])
@jwt_required
def leave_groups():
    data = request.json
    logging.info(f"Leaving group: {data.get('groupName')}")
    return myid_agent.remove_user_from_group_click(url_myid, data.get('userEmail', 'Anonymous User'), data.get('groupName'))

@access_bp.route('/api/docs/chat', methods=['POST'])
@jwt_required
def doc_chat():
    data = request.json
    logging.info(f"Doc chat: {data.get('message')}")
    return jsonify({"response": doc_agent.doc_qna_prompt(data.get('message'), data.get('history'))})

@access_bp.route('/api/access/chat', methods=['POST'])
@jwt_required
def access_chat():
    data = request.json
    logging.info(f"Access chat: {data.get('message')}")
    return jsonify({"response": access_management_agent.access_management_function_calling(data.get('message'), data.get('userEmail'))})
