
# AI Assistant Helm Chart

This Helm chart deploys the AI Assistant application with both UI and API backend components.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- Ingress controller installed (for UI access)

## Installing the Chart

To install the chart with the release name `ai-assistant`:

```bash
helm install ai-assistant ./helm/ai-assistant
```

## Configuration

The following table lists the configurable parameters of the AI Assistant chart and their default values.

### Global Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.namespace` | Namespace to deploy resources | `default` |
| `global.environment` | Environment name | `production` |

### UI Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ui.name` | Name for UI component | `ai-assistant-ui` |
| `ui.replicaCount` | Number of UI replicas | `2` |
| `ui.image.repository` | UI image repository | `ai-assistant-ui` |
| `ui.image.tag` | UI image tag | `latest` |
| `ui.image.pullPolicy` | UI image pull policy | `IfNotPresent` |
| `ui.resources` | UI resource requests/limits | CPU: 200m/500m, Memory: 256Mi/512Mi |
| `ui.autoscaling.enabled` | Enable autoscaling for UI | `true` |
| `ui.autoscaling.minReplicas` | Minimum UI replicas | `2` |
| `ui.autoscaling.maxReplicas` | Maximum UI replicas | `10` |
| `ui.service.type` | UI service type | `ClusterIP` |
| `ui.service.port` | UI service port | `80` |
| `ui.ingress.enabled` | Enable Ingress for UI | `true` |
| `ui.ingress.hosts` | UI Ingress hosts | `[{host: ai-assistant.example.com, paths: [{path: /(.*), pathType: Prefix}]}]` |
| `ui.ingress.tls.enabled` | Enable TLS for UI Ingress | `false` |

### API Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `api.name` | Name for API component | `ai-assistant-api` |
| `api.replicaCount` | Number of API replicas | `2` |
| `api.image.repository` | API image repository | `ai-assistant-api` |
| `api.image.tag` | API image tag | `latest` |
| `api.image.pullPolicy` | API image pull policy | `IfNotPresent` |
| `api.resources` | API resource requests/limits | CPU: 200m/500m, Memory: 256Mi/512Mi |
| `api.autoscaling.enabled` | Enable autoscaling for API | `true` |
| `api.autoscaling.minReplicas` | Minimum API replicas | `2` |
| `api.autoscaling.maxReplicas` | Maximum API replicas | `10` |
| `api.service.type` | API service type | `ClusterIP` |
| `api.service.port` | API service port | `80` |
| `api.configMap` | API ConfigMap values | FLASK_APP: app.py, FLASK_ENV: production, FLASK_DEBUG: "0" |

## Customizing the Deployment

Create a custom values file to override default configurations:

```bash
# custom-values.yaml
global:
  namespace: ai-assistant

ui:
  replicaCount: 3
  ingress:
    hosts:
      - host: my-ai-assistant.example.com
        paths:
          - path: /(.*)
            pathType: Prefix

api:
  replicaCount: 3
  configMap:
    FLASK_DEBUG: "1"
```

Then install the chart with your custom values:

```bash
helm install ai-assistant ./helm/ai-assistant -f custom-values.yaml
```

## Uninstalling the Chart

To uninstall/delete the `ai-assistant` deployment:

```bash
helm uninstall ai-assistant
```
