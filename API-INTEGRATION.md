# AI Team Assistant - API Integration Guide

This document provides step-by-step instructions for integrating the frontend application with your backend API services. It covers the configuration and implementation for each feature of the application: Access Management, Kubernetes Debugging, Documentation Search, and Jira Ticket Management.

## Table of Contents

1. [API Configuration](#api-configuration)
2. [Access Management Integration](#access-management-integration)
3. [Kubernetes Debugger Integration](#kubernetes-debugger-integration)
4. [Documentation Search Integration](#documentation-search-integration)
5. [Dashboard Integration](#dashboard-integration)
6. [Jira Ticket Integration](#jira-ticket-integration)
7. [Sample Backend Implementation](#sample-backend-implementation)

## API Configuration

### Base URL Configuration

The application uses a centralized API configuration file located at `src/services/api.ts`. This file is set up to read the API base URL from an environment variable:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

To configure the API base URL:

1. Create a `.env` file in the root of your project
2. Add the following line, replacing with your actual API base URL:
   ```
   VITE_API_BASE_URL=https://your-api-domain.com/api
   ```

### API Request Helper

The application uses a helper function for making API requests:

```typescript
const apiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  return response.json();
};
```

This function handles adding default headers, error handling, and JSON parsing for all API requests.

## Access Management Integration

### Required API Endpoints

The Access Management feature requires the following API endpoints:

1. **Get User Groups**
   - Endpoint: `/access/groups`
   - Method: GET
   - Response: Array of groups with their access information

2. **Request Group Access**
   - Endpoint: `/access/groups/request`
   - Method: POST
   - Request Body: `{ groupId: number, reason: string, userName: string }`
   - Response: Jira ticket information
   - Note: `userName` is the name of the currently logged-in user

3. **Chat with Assistant**
   - Endpoint: `/access/chat`
   - Method: POST
   - Request Body: `{ message: string, userName: string }`
   - Response: Assistant's response
   - Note: `userName` is the name of the currently logged-in user

### Data Models

```typescript
export interface Group {
  id: number;
  name: string;
  description: string;
  status: 'member' | 'pending' | 'rejected' | 'none';
  members: number;
}

export interface JiraTicket {
  key: string;
  url: string;
}

export interface ChatResponse {
  response: string;
}
```

## Kubernetes Debugger Integration

### Required API Endpoints

1. **Get Clusters**
   - Endpoint: `/kubernetes/clusters`
   - Method: GET
   - Query Parameters: `environment` (optional, can be 'production', 'qa', or 'staging')
   - Response: Array of clusters with details like name, status, and environment

2. **Create Session**
   - Endpoint: `/kubernetes/session`
   - Method: POST
   - Request Body: `{ cluster: string, description: string }`
   - Response: Jira ticket information
   
3. **Run Command**
   - Endpoint: `/kubernetes/command`
   - Method: POST
   - Request Body: `{ cluster: string, command: string, jiraTicketKey?: string }`
   - Response: Command execution result
   
4. **Chat with Assistant**
   - Endpoint: `/kubernetes/chat`
   - Method: POST
   - Request Body: `{ cluster: string, message: string, jiraTicketKey?: string }`
   - Response: Assistant's response
   
5. **Get Debug Sessions**
   - Endpoint: `/kubernetes/sessions`
   - Method: GET
   - Response: Array of debugging sessions
   
6. **Get Session Details**
   - Endpoint: `/kubernetes/sessions/{sessionId}`
   - Method: GET
   - Response: Session details including commands and chat history
   
7. **Get Cluster Health**
   - Endpoint: `/kubernetes/health/{cluster}`
   - Method: GET
   - Response: Cluster health information

### Data Models

```typescript
export interface JiraTicket {
  key: string;
  url: string;
}

export interface CommandResult {
  output: string;
  error?: string;
  exitCode: number;
}

export interface DebugSession {
  id: string;
  cluster: string;
  description: string;
  createdAt: string;
  jiraTicket: JiraTicket;
  status: 'active' | 'resolved';
}

export interface KubernetesCluster {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'error';
  version: string;
  environment: 'production' | 'qa' | 'staging';
  nodeCount?: number;
}
```

## Documentation Search Integration

### Required API Endpoints

1. **Search Documentation**
   - Endpoint: `/docs/search`
   - Method: POST
   - Request Body: `{ query: string }`
   - Response: Search results
   
2. **Get Document By ID**
   - Endpoint: `/docs/${id}`
   - Method: GET
   - Response: Document details
   
3. **Submit Feedback**
   - Endpoint: `/docs/feedback`
   - Method: POST
   - Request Body: `{ documentId: number, helpful: boolean }`
   - Response: Success confirmation
   
4. **Chat with Assistant**
   - Endpoint: `/docs/chat`
   - Method: POST
   - Request Body: `{ message: string }`
   - Response: Assistant's response
   
5. **Get Query History**
   - Endpoint: `/docs/history`
   - Method: GET
   - Response: Query history

### Data Models

```typescript
export interface DocumentSearchResult {
  id: number;
  title: string;
  snippet: string;
  url: string;
  relevance: number;
}

export interface QueryHistoryItem {
  id: number;
  query: string;
  timestamp: string;
}
```

## Dashboard Integration

### Required API Endpoints

1. **Get Dashboard Stats**
   - Endpoint: `/dashboard/stats`
   - Method: GET
   - Response: Dashboard statistics

### Data Models

```typescript
export interface DashboardStats {
  clusters: number;
  groups: number;
  resolvedIssues: number;
  docQueries: number;
  jiraTickets: number;
}
```

## Jira Ticket Integration

The Jira ticket integration provides functionality for creating and managing Jira tickets through a chat interface.

### Required API Endpoints

1. **Create Ticket**
   - Endpoint: `/jira/ticket`
   - Method: POST
   - Request Body: `{ summary: string, description: string, priority?: string }`
   - Response: Jira ticket information
   
2. **Get User's Tickets**
   - Endpoint: `/jira/tickets`
   - Method: GET
   - Response: Array of user's Jira tickets
   
3. **Get Ticket Details**
   - Endpoint: `/jira/tickets/{ticketKey}`
   - Method: GET
   - Response: Detailed ticket information
   
4. **Chat with Assistant**
   - Endpoint: `/jira/chat`
   - Method: POST
   - Request Body: `{ message: string }`
   - Response: Assistant's response

### Data Models

```typescript
export interface JiraTicket {
  key: string;
  url: string;
  summary?: string;
  description?: string;
  status?: string;
  priority?: string;
  created?: string;
}

export interface ChatResponse {
  response: string;
}
```

### Implementation Example

```typescript
// Example of creating a ticket
const handleCreateTicket = async () => {
  try {
    const ticket = await jiraApi.createTicket(
      'Bug in login page', 
      'Users cannot login due to a validation error', 
      'High'
    );
    console.log('Ticket created:', ticket.key);
  } catch (error) {
    console.error('Failed to create ticket:', error);
  }
};

// Example of getting user tickets
const fetchUserTickets = async () => {
  try {
    const tickets = await jiraApi.getUserTickets();
    setTickets(tickets);
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
  }
};

// Example of chatting with the assistant
const sendChatMessage = async (message: string) => {
  try {
    const response = await jiraApi.chatWithAssistant(message);
    addMessage('assistant', response.response);
  } catch (error) {
    console.error('Failed to get response:', error);
  }
};
```

## Sample Backend Implementation

Below is a Python implementation using Flask for the required API endpoints:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import random
import string
import subprocess
import json

app = Flask(__name__)
CORS(app)

# In-memory storage for demo purposes
groups = [
    {"id": 1, "name": "Database Admins", "description": "Database administration team", "status": "none", "members": 8},
    {"id": 2, "name": "Security Team", "description": "Security operations team", "status": "pending", "members": 15},
    {"id": 3, "name": "DevOps", "description": "DevOps engineering team", "status": "member", "members": 20},
    {"id": 4, "name": "Frontend", "description": "Frontend development team", "status": "member", "members": 12},
    {"id": 5, "name": "Backend", "description": "Backend development team", "status": "none", "members": 7},
]

debug_sessions = []
doc_queries = []
jira_tickets = []

# Mock Kubernetes clusters
kubernetes_clusters = [
    {"id": "prod-cluster-1", "name": "Primary Production", "status": "healthy", "version": "1.26.3", "environment": "production", "nodeCount": 15},
    {"id": "prod-cluster-2", "name": "Secondary Production", "status": "warning", "version": "1.26.3", "environment": "production", "nodeCount": 10},
    {"id": "prod-cluster-3", "name": "US East Production", "status": "healthy", "version": "1.26.2", "environment": "production", "nodeCount": 8},
    
    {"id": "qa-cluster-1", "name": "QA Main", "status": "healthy", "version": "1.27.0", "environment": "qa", "nodeCount": 5},
    {"id": "qa-cluster-2", "name": "QA Testing", "status": "error", "version": "1.27.0", "environment": "qa", "nodeCount": 3},
    
    {"id": "staging-cluster-1", "name": "Staging Main", "status": "healthy", "version": "1.27.1", "environment": "staging", "nodeCount": 6},
    {"id": "staging-cluster-2", "name": "Pre-Prod", "status": "healthy", "version": "1.27.0", "environment": "staging", "nodeCount": 4},
]

# Helper to generate a mock Jira ticket
def create_jira_ticket(summary, description, priority="Medium", ticket_type="Task"):
    key = f"JIRA-{random.randint(1000, 9999)}"
    ticket = {
        "key": key,
        "url": f"https://jira.example.com/browse/{key}",
        "summary": summary,
        "description": description,
        "status": "Open",
        "priority": priority,
        "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "assignee": "Current User",
        "reporter": "Current User"
    }
    jira_tickets.append(ticket)
    return ticket

# Access Management API
@app.route('/api/access/groups', methods=['POST'])
def get_user_groups():
    data = request.json
    user_name = data.get('userName', 'Anonymous User')
    
    # In a real implementation, you would filter groups based on the user
    # For demo purposes, we'll return all groups with some conditional logic based on username
    
    # You could customize group access based on the username
    if user_name == "Admin User":
        # An admin might see all groups with different statuses
        return jsonify(groups)
    elif user_name == "New User":
        # A new user might have no memberships yet
        for group in groups:
            group['status'] = 'none'
        return jsonify(groups)
    else:
        # Default user (Demo User) gets the predefined statuses
        return jsonify(groups)

@app.route('/api/access/groups/request', methods=['POST'])
def request_group_access():
    data = request.json
    group_id = data.get('groupId')
    reason = data.get('reason')
    user_name = data.get('userName', 'Anonymous User')
    
    # Find group name
    group_name = next((g['name'] for g in groups if g['id'] == group_id), f"Group {group_id}")
    
    # Create a Jira ticket for the group access request
    ticket = create_jira_ticket(
        f"Group Access Request: {group_name}", 
        f"User {user_name} requested access to group {group_name}. Reason: {reason}"
    )
    
    # Update group status to pending
    for group in groups:
        if group['id'] == group_id:
            group['status'] = 'pending'
            break
    
    return jsonify(ticket)

@app.route('/api/access/chat', methods=['POST'])
def access_chat():
    data = request.json
    message = data.get('message')
    user_name = data.get('userName', 'Anonymous User')
    
    # In a real implementation, you would process the message and 
    # generate a response based on user access requirements
    
    if "add me to" in message.lower():
        group_name = message.lower().split("add me to")[1].strip()
        response = f"I've created a request to add {user_name} to the {group_name} group. A ticket has been created for approval."
    elif "access" in message.lower():
        response = f"Hello {user_name}, I can help you request access to groups. Please specify which group you need access to."
    else:
        response = f"Hello {user_name}, I'm your access management assistant. How can I help you today?"
    
    return jsonify({"response": response})

# Kubernetes Debugger API
@app.route('/api/kubernetes/clusters', methods=['GET'])
def get_clusters():
    environment = request.args.get('environment')
    
    if environment:
        filtered_clusters = [c for c in kubernetes_clusters if c["environment"] == environment]
        return jsonify(filtered_clusters)
    
    return jsonify(kubernetes_clusters)

@app.route('/api/kubernetes/session', methods=['POST'])
def create_session():
    data = request.json
    cluster = data.get('cluster')
    description = data.get('description')
    
    # Create a Jira ticket for the debugging session
    ticket = create_jira_ticket(
        f"Kubernetes Debug: {cluster}", 
        f"Debugging session for cluster {cluster}. Description: {description}",
        "Bug"
    )
    
    session_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    
    session = {
        "id": session_id,
        "cluster": cluster,
        "description": description,
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "jiraTicket": ticket,
        "status": "active",
        "commands": [],
        "messages": []
    }
    
    debug_sessions.append(session)
    
    return jsonify(ticket)

@app.route('/api/kubernetes/command', methods=['POST'])
def run_command():
    data = request.json
    cluster = data.get('cluster')
    command = data.get('command')
    jira_ticket_key = data.get('jiraTicketKey')
    
    # In a real implementation, you would execute the kubectl command here
    # For demo purposes, we'll simulate command execution
    
    if "get pods" in command:
        output = """NAME                     READY   STATUS    RESTARTS   AGE
api-gateway-78fd9c8495-r6v89   1/1     Running   0          7d
db-backup-58694c456-d8j7m      1/1     Running   0          3d
ui-frontend-7b9d65c89-fk3j8    1/1     Running   2          10d"""
        exit_code = 0
    elif "describe pod" in command:
        output = """Name:         api-gateway-78fd9c8495-r6v89
Namespace:    default
Priority:     0
Node:         worker-node-1/10.0.0.5
Start Time:   Wed, 19 Apr 2023 12:00:00 +0000
Labels:       app=api-gateway
              pod-template-hash=78fd9c8495
Status:       Running
IP:           172.16.0.45
Containers:
  api-gateway:
    Container ID:   containerd://a9b8c7d6e5f4g3h2i1j0
    Image:          company/api-gateway:v1.2.3
    Image ID:       docker-pullable://company/api-gateway@sha256:a1b2c3d4e5f6
    Port:           8080/TCP
    Host Port:      0/TCP
    State:          Running
      Started:      Wed, 19 Apr 2023 12:00:05 +0000
    Ready:          True
    Restart Count:  0
    Environment:
      LOG_LEVEL:     info
      DB_HOST:       postgres-service
    Mounts:
      /var/run/secrets from api-secret (ro)
      /var/run/configmaps from api-config (rw)"""
        exit_code = 0
    elif "logs" in command:
        output = """2023-04-26T08:12:43.456Z INFO  Starting API server
2023-04-26T08:12:43.789Z INFO  Connected to database
2023-04-26T08:12:44.123Z INFO  Loaded configuration
2023-04-26T08:12:44.456Z INFO  Server listening on port 8080
2023-04-26T08:15:23.789Z ERROR Failed to process request: Invalid token
2023-04-26T08:15:24.012Z WARN  Authentication failure from IP 192.168.1.105"""
        exit_code = 0
    else:
        output = f"Simulated output for command: {command}"
        exit_code = 0
    
    result = {
        "output": output,
        "exitCode": exit_code
    }
    
    # Store the command in the session
    for session in debug_sessions:
        if session.get("jiraTicket", {}).get("key") == jira_ticket_key:
            session["commands"].append({
                "command": command,
                "result": result,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            })
    
    return jsonify(result)

@app.route('/api/kubernetes/chat', methods=['POST'])
def kubernetes_chat():
    data = request.json
    cluster = data.get('cluster')
    message = data.get('message')
    jira_ticket_key = data.get('jiraTicketKey')
    
    # In a real implementation, you would process the message and generate an appropriate response
    # For demo purposes, we'll provide simulated responses
    
    if "pod" in message.lower() and "not starting" in message.lower():
        response = "The pod might be failing to start due to resource constraints. Let me check the events:\n\n```\nkubectl get events --field-selector involvedObject.name=api-gateway-78fd9c8495-r6v89\n```\n\nIf you see OOMKilled or resource-related events, consider increasing the resource limits."
    elif "connection" in message.lower() and "database" in message.lower():
        response = "Let's check the database connectivity. First, verify the service is running:\n\n```\nkubectl get svc postgres-service\n```\n\nThen check if the pod can reach the database:\n\n```\nkubectl exec api-gateway-78fd9c8495-r6v89 -- nc -zv postgres-service 5432\n```"
    else:
        response = f"I'll help you debug issues in the {cluster} cluster. Can you provide more details about the problem you're experiencing?"
    
    # Store the message in the session
    for session in debug_sessions:
        if session.get("jiraTicket", {}).get("key") == jira_ticket_key:
            session["messages"].append({
                "message": message,
                "response": response,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            })
    
    return jsonify({"response": response})

@app.route('/api/kubernetes/sessions', methods=['GET'])
def get_debug_sessions():
    # Return a simplified list for the overview
    simplified_sessions = [
        {
            "id": session["id"],
            "cluster": session["cluster"],
            "description": session["description"],
            "createdAt": session["createdAt"],
            "jiraTicket": session["jiraTicket"],
            "status": session["status"]
        }
        for session in debug_sessions
    ]
    return jsonify(simplified_sessions)

@app.route('/api/kubernetes/sessions/<string:session_id>', methods=['GET'])
def get_session_details(session_id):
    for session in debug_sessions:
        if session["id"] == session_id:
            return jsonify(session)
    return jsonify({"error": "Session not found"}), 404

@app.route('/api/kubernetes/health/<string:cluster>', methods=['GET'])
def get_cluster_health(cluster):
    # In a real implementation, you would query the actual cluster health
    # For demo purposes, we'll return simulated health data
    
    health_data = {
        "cluster": cluster,
        "overall_status": "Healthy",
        "node_count": 3,
        "pod_count": 28,
        "memory_usage": "68%",
        "cpu_usage": "42%",
        "issues": [
            {
                "severity": "Warning",
                "message": "High memory usage in namespace: monitoring",
                "affected": "prometheus-server-5b9f6fdb4-xj7k2"
            }
        ],
        "components": [
            {"name": "API Server", "status": "Healthy"},
            {"name": "Scheduler", "status": "Healthy"},
            {"name": "Controller Manager", "status": "Healthy"},
            {"name": "etcd", "status": "Healthy"}
        ]
    }
    
    return jsonify(health_data)

# Documentation API
@app.route('/api/docs/search', methods=['POST'])
def search_docs():
    data = request.json
    query = data.get('query')
    
    # In a real implementation, you would search a documentation database
    # For demo purposes, we'll return simulated search results
    
    # Save query to history
    doc_queries.append({
        "id": len(doc_queries) + 1,
        "query": query,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    })
    
    results = [
        {
            "id": 1,
            "title": "Kubernetes Pod Troubleshooting",
            "snippet": "This guide covers common issues with Kubernetes pods and how to troubleshoot them...",
            "url": "/docs/kubernetes/pod-troubleshooting",
            "relevance": 0.95
        },
        {
            "id": 2,
            "title": "Access Control Management",
            "snippet": "Learn how to manage user access control in the platform...",
            "url": "/docs/access-control",
            "relevance": 0.85
        },
        {
            "id": 3,
            "title": "API Integration Guide",
            "snippet": "Step by step guide to integrate with our APIs...",
            "url": "/docs/api-integration",
            "relevance": 0.75
        }
    ]
    
    # Filter based on the query (very basic simulation)
    if "kubernetes" in query.lower():
        results = [r for r in results if "kubernetes" in r["title"].lower()]
    elif "access" in query.lower():
        results = [r for r in results if "access" in r["title"].lower()]
    
    return jsonify(results)

@app.route('/api/docs/<int:doc_id>', methods=['GET'])
def get_document(doc_id):
    # In a real implementation, you would fetch the document from a database
    # For demo purposes, we'll return a simulated document
    
    documents = {
        1: {
            "id": 1,
            "title": "Kubernetes Pod Troubleshooting",
            "content": """# Kubernetes Pod Troubleshooting
            
## Common Issues

### Pods in Pending State
Pods might be pending due to insufficient resources. Use `kubectl describe pod` to see events.

### Pods in CrashLoopBackOff
This happens when a pod repeatedly crashes. Check logs with `kubectl logs`.

### Image Pull Errors
Verify that the image exists and credentials are correct.

## Debugging Commands

```
kubectl get pods
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl exec -it <pod-name> -- /bin/bash
```
""",
            "url": "/docs/kubernetes/pod-troubleshooting",
        },
        2: {
            "id": 2,
            "title": "Access Control Management",
            "content": """# Access Control Management

## Overview
The Access Control system allows managing user permissions across various groups and services.

## Requesting Access
Users can request access to specific groups through the UI or API.

## Approval Process
Access requests generate Jira tickets for approval by group managers.

## API Integration
See the API documentation for programmatic access management.
""",
            "url": "/docs/access-control",
        }
    }
    
    if doc_id in documents:
        return jsonify(documents[doc_id])
    
    return jsonify({"error": "Document not found"}), 404

@app.route('/api/docs/feedback', methods=['POST'])
def submit_feedback():
    data = request.json
    document_id = data.get('documentId')
    helpful = data.get('helpful')
    
    # In a real implementation, you would store this feedback
    
    return jsonify({"success": True})

@app.route('/api/docs/chat', methods=['POST'])
def docs_chat():
    data = request.json
    message = data.get('message')
    
    # In a real implementation, you would process the message and generate a response
    # based on documentation content
    
    if "kubernetes" in message.lower():
        response = "For Kubernetes issues, you might want to check our Kubernetes troubleshooting guide. It covers common problems with pods, deployments, and services."
    elif "access" in message.lower():
        response = "Our Access Control documentation explains how to request access to groups and services. Each request creates a Jira ticket for approval."
    else:
        response = "I can help you find information in our documentation. What topic are you interested in?"
    
    return jsonify({"response": response})

@app.route('/api/docs/history', methods=['GET'])
def get_query_history():
    return jsonify(doc_queries)

# Dashboard API
@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    stats = {
        "clusters": 4,
        "groups": len(groups),
        "resolvedIssues": 128,
        "docQueries": len(doc_queries),
        "jiraTickets": 42
    }
    return jsonify(stats)

# Jira Ticket API
@app.route('/api/jira/ticket', methods=['POST'])
def create_ticket():
    data = request.json
    summary = data.get('summary')
    description = data.get('description')
    priority = data.get('priority', 'Medium')
    
    if not summary:
        return jsonify({"error": "Summary is required"}), 400
        
    ticket = create_jira_ticket(summary, description, priority)
    return jsonify(ticket)

@app.route('/api/jira/tickets', methods=['GET'])
def get_user_tickets():
    # In a real implementation, you would filter tickets for the current user
    return jsonify(jira_tickets)

@app.route('/api/jira/tickets/<string:ticket_key>', methods=['GET'])
def get_ticket_details(ticket_key):
    for ticket in jira_tickets:
        if ticket["key"] == ticket_key:
            # Add some additional details for the detailed view
            ticket_details = ticket.copy()
            ticket_details["comments"] = [
                {
                    "author": "John Doe",
                    "content": "Working on this issue now",
                    "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - 3600))
                },
                {
                    "author": "Jane Smith",
                    "content": "Let me know if you need any help",
                    "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - 1800))
                }
            ]
            return jsonify(ticket_details)
    
    return jsonify({"error": "Ticket not found"}), 404

@app.route('/api/jira/chat', methods=['POST'])
def jira_chat():
    data = request.json
    message = data.get('message')
    
    # In a real implementation, you would use an AI service to process the message
    # For demo purposes, we'll provide simulated responses
    
    if "create ticket" in message.lower() or "new ticket" in message.lower():
        response = "I can help you create a new Jira ticket. Please provide a summary and description of the issue."
    elif "status" in message.lower() and ("ticket" in message.lower() or "issue" in message.lower()):
        response = "To check the status of a ticket, I need the ticket key. For example, 'What's the status of JIRA-1234?'"
    elif "assign" in message.lower():
        response = "To assign a ticket to someone, I need the ticket key and the username. For example, 'Assign JIRA-1234 to johndoe'"
    elif "priority" in message.lower():
        response = "Tickets can have different priority levels: Low, Medium, High, or Critical. What priority would you like to set?"
    else:
        response = "I'm your Jira ticket assistant. I can help you create tickets, check their status, assign them to team members, and more. How can I assist you today?"
    
    return jsonify({"response": response})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
```

### Running the Backend

1. Save the code above to a file named `app.py`
2. Install the required packages:
   ```
   pip install flask flask-cors
   ```
3. Run the Flask application:
   ```
   python app.py
   ```
4. The API will be available at `http://localhost:8000/api/`

## Frontend Integration

To connect the frontend to your backend API:

1. Set the environment variable in your `.env` file:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

2. Start your frontend application:
   ```
   npm run dev
   ```

3. The frontend will now communicate with your backend API.

## Troubleshooting

If you encounter issues with the API integration:

1. **CORS Errors**: Ensure your backend has proper CORS headers. The sample implementation includes CORS handling with Flask-CORS.

2. **API Endpoint Mismatch**: Verify that the API endpoints in your backend match those expected by the frontend. Check the `src/services/api.ts` file for the expected endpoints.

3. **Environment Variables**: Make sure your environment variables are properly loaded. Vite uses the `import.meta.env` syntax to access environment variables.

For further assistance, refer to the API documentation or contact the development team.
