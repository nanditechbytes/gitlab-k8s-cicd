# CI/CD Pipeline with Gitlab using Kubernetes Runner

This repository contains a CI/CD pipeline on Gitlab designed to build, test, and deploy a simple Node.js application using Kaniko for building Docker images, Additionally it uses Gitlab Kubernetes runner and KAS agent. The pipeline automates the entire lifecycle of the application, from code changes to production deployment.

## Key Features

- Node.js Application: The pipeline is designed to work with a Node.js application. The application is an Express.js-based "Hello World" web server that listens on port 3000.
- Kaniko for Docker Image Builds: Kaniko is used to build Docker images inside a container, ideal for environments like Kubernetes that do not support Docker-in-Docker.
- Automated Testing: The pipeline runs unit tests using Mocha and Chai to ensure code quality before deployment.
- Dockerfile: The Node.js application is containerized using a Dockerfile based on the lightweight node:16-alpine image. The Dockerfile installs all required dependencies and exposes port 3000.
- Deployment: Once the Docker image is built, it is pushed to a Docker registry, and the application is deployed to Kubernetes using Kubernetes runner and Gitlab KAS agent.
- Image promotion from Dev to Test and then to Prod using Kaniko.


## Pre-Requisite
- Three EKS cluster Dev, Test and Prod (Optionally you can test the pipeline with one EKS cluster also with some customization to the .gitlab-ci.yaml)
- Kubectl configured on your system
- Gitlab Account


## Environment Setup on Dev Cluster
### Create new namespace
```bash
kubectl create namespace gitlab-runner
```
### Set Context for the gitlab-runner namespace
```bash
kubectl config set-context --current --namespace=gitlab-runner
```
### Add the gitlab runner helm repository
```bash
helm repo add gitlab http://charts.gitlab.io/
```
### Create a values.yaml file for gitlab runner helm chart and update the values for <your gitlab url> and <your gitlab runner token>

```yaml
gitlabUrl: <your gitlab url>
rbac:
  clusterWideAccess: false
  create: true
  serviceAccountName: gitlab-runner
runnerToken: <your gitlab runner token>
runners:
  privileged: false
  serviceAccountName: gitlab-runner
  name: "gitlab-runner"
  executor: kubernetes
  config: |
    [[runners]]
      name = "runner-{{ .Release.Name }}"
      environment = ["HOME=/tmp", "builds_dir=/tmp"]
      url = "{{ .Values.gitlabUrl }}"
      executor = "kubernetes"
      builds_dir = "/tmp"
      [runners.kubernetes]
        privileged = false
        cpu_request = "500m"
        memory_request = "500Mi"
        service_cpu_limit = "1000m"
        service_memory_limit = "2000Mi"
        service_cpu_request = "150m"
        service_memory_request = "350Mi"
        helper_cpu_limit = "1500m"
        helper_memory_limit = "1500Mi"
        helper_cpu_request = "150m"
        helper_memory_request = "375Mi"
        poll_timeout = 600
        service_account = "gitlab-runner"
        [runners.kubernetes.node_tolerations]
          "cicd=true" = "NoSchedule"

```

### Install gitlab runner helm on EKS

```bash
helm install -f gitlab-runner.values.yaml gitlab-runner gitlab/gitlab-runner
```

### Add Permission for gitlab runner
```bash
kubectl config set-context --current --namespace=default
kubectl apply -f gitlab-runner/clusterrole.yaml
kubectl apply -f gitlab-runner/clusterrole-binding.yaml
```

### Configure KAS agent for each of the clusters on the Gitlab UI and then run the helm commands provided by the Gitlab on each of the clusters.

### Create agent config files .gitlab/agents/<agent-name>/config.yaml for each agents
```yaml
user_access:
  access_as:
    agent: {}
  projects:
    - id: <project-id>

  groups:
    - id: <group-id>
```    
### Create Gitlab Environment development, test and production with the KAS agent associated

### Set Variables for KUBE_CONTEXT for each environment for deployment.

# Preparing Environment for Application
### Create namespace for application on Dev, Test and Prod cluster
```bash
kubectl config set-context --current --namespace=default
kubectl create namespace demo
```

