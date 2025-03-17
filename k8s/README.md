
# Kubernetes Deployment for AI Assistant UI

This directory contains Kubernetes manifests to deploy the AI Assistant UI application.

## Prerequisites

- A Kubernetes cluster
- kubectl configured to communicate with your cluster
- Docker registry where you can push your images

## Deployment Steps

1. **Build and push the Docker image**

   ```bash
   # Build the image
   docker build -t your-registry/ai-assistant-ui:latest .
   
   # Push to your registry
   docker push your-registry/ai-assistant-ui:latest
   ```

2. **Update image reference**

   Edit the `deployment.yaml` file and update the `image` field to point to your registry:
   
   ```yaml
   image: your-registry/ai-assistant-ui:latest
   ```

3. **Apply the Kubernetes manifests**

   ```bash
   kubectl apply -f k8s/
   ```

4. **Configure your domain**

   Update the `host` field in `ingress.yaml` to your actual domain.

5. **Configure TLS (optional)**

   If you have TLS certificates, uncomment the TLS section in the Ingress manifest.

## Verification

Check if the pods are running:

```bash
kubectl get pods -l app=ai-assistant-ui
```

Check the service:

```bash
kubectl get svc ai-assistant-ui
```

Check the ingress:

```bash
kubectl get ingress ai-assistant-ui
```

## Scaling

To scale the deployment:

```bash
kubectl scale deployment ai-assistant-ui --replicas=5
```

## Cleanup

To remove the deployment:

```bash
kubectl delete -f k8s/
```
