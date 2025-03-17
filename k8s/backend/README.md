
# Kubernetes Deployment for AI Assistant API Backend

This directory contains Kubernetes manifests to deploy the AI Assistant Flask API backend.

## Prerequisites

- A Kubernetes cluster
- kubectl configured to communicate with your cluster
- Docker registry where you can push your images

## Deployment Steps

1. **Build and push the Docker image**

   ```bash
   # Build the API image
   docker build -t your-registry/ai-assistant-api:latest -f Dockerfile.api .
   
   # Push to your registry
   docker push your-registry/ai-assistant-api:latest
   ```

2. **Update image reference**

   Edit the `deployment.yaml` file and update the `image` field to point to your registry:
   
   ```yaml
   image: your-registry/ai-assistant-api:latest
   ```

3. **Apply the Kubernetes manifests**

   ```bash
   kubectl apply -f k8s/backend/
   ```

4. **Configure your domain**

   Update the `host` field in `ingress.yaml` to your actual API domain.

5. **Configure TLS (optional)**

   If you have TLS certificates, uncomment the TLS section in the Ingress manifest.

## Configuration

The Flask backend configuration can be modified through the ConfigMap in `config-map.yaml`. 
Add any environment variables needed by your Flask application there.

## Verification

Check if the pods are running:

```bash
kubectl get pods -l app=ai-assistant-api
```

Check the service:

```bash
kubectl get svc ai-assistant-api
```

Check the ingress:

```bash
kubectl get ingress ai-assistant-api
```

## Integration with UI

Make sure to set the UI's `VITE_API_BASE_URL` environment variable to point to your API's domain:

```yaml
# In k8s/config-map.yaml for the UI
data:
  VITE_API_BASE_URL: "https://api.ai-assistant.example.com"
```

## Scaling

To scale the API deployment:

```bash
kubectl scale deployment ai-assistant-api --replicas=5
```

## Cleanup

To remove the API deployment:

```bash
kubectl delete -f k8s/backend/
```
