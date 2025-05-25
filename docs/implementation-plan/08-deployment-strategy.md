# 部署策略方案

## 🚀 部署概述

### 部署目标
- **高可用性**: 99.9%以上的服务可用性
- **可扩展性**: 支持水平和垂直扩展
- **安全性**: 多层安全防护机制
- **监控性**: 全面的监控和告警
- **自动化**: CI/CD自动化部署

### 部署架构
- **容器化部署**: Docker + Kubernetes
- **微服务架构**: 前后端分离
- **负载均衡**: Nginx + HAProxy
- **数据库集群**: PostgreSQL主从复制
- **缓存集群**: Redis Cluster

## 🏗️ 基础设施架构

### 网络架构图
```
Internet
    |
[Load Balancer]
    |
[Web Tier - Nginx]
    |
[App Tier - FastAPI]
    |
[Data Tier - PostgreSQL + Redis]
```

### 服务器规划

#### 生产环境配置
```yaml
# 负载均衡器
load_balancer:
  instances: 2
  specs: 4 vCPU, 8GB RAM, 100GB SSD
  os: Ubuntu 22.04 LTS

# Web服务器
web_servers:
  instances: 3
  specs: 8 vCPU, 16GB RAM, 200GB SSD
  os: Ubuntu 22.04 LTS

# 应用服务器
app_servers:
  instances: 4
  specs: 16 vCPU, 32GB RAM, 500GB SSD
  os: Ubuntu 22.04 LTS

# 数据库服务器
database_servers:
  primary: 1
  replicas: 2
  specs: 32 vCPU, 64GB RAM, 1TB NVMe SSD
  os: Ubuntu 22.04 LTS

# 缓存服务器
cache_servers:
  instances: 3
  specs: 8 vCPU, 32GB RAM, 200GB SSD
  os: Ubuntu 22.04 LTS
```

## 🐳 容器化部署

### Docker配置

#### 后端Dockerfile (backend/Dockerfile)
```dockerfile
# 多阶段构建
FROM python:3.11-slim as builder

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements/prod.txt .

# 安装Python依赖
RUN pip install --no-cache-dir --user -r prod.txt

# 生产镜像
FROM python:3.11-slim

# 创建非root用户
RUN groupadd -r appuser && useradd -r -g appuser appuser

# 安装运行时依赖
RUN apt-get update && apt-get install -y \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 从builder阶段复制依赖
COPY --from=builder /root/.local /home/appuser/.local

# 复制应用代码
COPY . .

# 设置权限
RUN chown -R appuser:appuser /app

# 切换到非root用户
USER appuser

# 设置环境变量
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONPATH=/app

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

#### 前端Dockerfile (frontend/Dockerfile)
```dockerfile
# 构建阶段
FROM node:18-alpine as builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制自定义nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 创建非root用户
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# 设置权限
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# 切换到非root用户
USER nginx

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# 暴露端口
EXPOSE 80

# 启动命令
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose配置

#### 开发环境 (docker-compose.dev.yml)
```yaml
version: '3.8'

services:
  # 前端服务
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_BASE_URL=http://localhost:8000/api/v1
    depends_on:
      - backend

  # 后端服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/enterprise_dev
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=dev-secret-key
      - DEBUG=true
    depends_on:
      - db
      - redis

  # 数据库服务
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=enterprise_dev
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  # Redis服务
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # 邮件服务（开发用）
  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
  redis_data:
```

#### 生产环境 (docker-compose.prod.yml)
```yaml
version: '3.8'

services:
  # 负载均衡器
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

  # 前端服务
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    expose:
      - "80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 1G

  # 后端服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    expose:
      - "8000"
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/enterprise_prod
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=${SECRET_KEY}
      - ENVIRONMENT=production
    depends_on:
      - db
      - redis
    restart: unless-stopped
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 2G

  # 数据库服务
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=enterprise_prod
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backup:/backup
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G

  # Redis服务
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G

  # 监控服务
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    restart: unless-stopped

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
```

## ☸️ Kubernetes部署

### 命名空间配置

#### 命名空间定义 (k8s/namespace.yaml)
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: enterprise-system
  labels:
    name: enterprise-system
    environment: production
```

### 配置管理

#### ConfigMap配置 (k8s/configmap.yaml)
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: enterprise-system
data:
  # 应用配置
  ENVIRONMENT: "production"
  LOG_LEVEL: "INFO"
  
  # 数据库配置
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
  DB_NAME: "enterprise_prod"
  
  # Redis配置
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
  
  # API配置
  API_VERSION: "v1"
  API_PREFIX: "/api/v1"
```

#### Secret配置 (k8s/secret.yaml)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: enterprise-system
type: Opaque
data:
  # Base64编码的敏感信息
  SECRET_KEY: <base64-encoded-secret>
  DB_PASSWORD: <base64-encoded-password>
  REDIS_PASSWORD: <base64-encoded-password>
  JWT_SECRET: <base64-encoded-jwt-secret>
```

### 数据库部署

#### PostgreSQL部署 (k8s/postgres.yaml)
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: enterprise-system
spec:
  serviceName: postgres-service
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: DB_NAME
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DB_PASSWORD
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 100Gi

---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: enterprise-system
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
```

### 应用部署

#### 后端部署 (k8s/backend.yaml)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: enterprise-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: enterprise/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          value: "postgresql://postgres:$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)"
        - name: REDIS_URL
          value: "redis://:$(REDIS_PASSWORD)@$(REDIS_HOST):$(REDIS_PORT)"
        envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secrets
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1"

---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: enterprise-system
spec:
  selector:
    app: backend
  ports:
  - port: 8000
    targetPort: 8000
  type: ClusterIP
```

#### 前端部署 (k8s/frontend.yaml)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: enterprise-system
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: enterprise/frontend:latest
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: enterprise-system
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

### Ingress配置

#### Nginx Ingress (k8s/ingress.yaml)
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: enterprise-ingress
  namespace: enterprise-system
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - enterprise.example.com
    secretName: enterprise-tls
  rules:
  - host: enterprise.example.com
    http:
      paths:
      - path: /api(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 8000
      - path: /()(.*)
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

## 🔄 CI/CD流水线

### GitHub Actions工作流

#### 构建和部署流水线 (.github/workflows/deploy.yml)
```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run tests
      run: |
        # 运行测试套件
        make test

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
    
    - name: Build and push backend image
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        push: true
        tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Build and push frontend image
      uses: docker/build-push-action@v4
      with:
        context: ./frontend
        push: true
        tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'v1.28.0'
    
    - name: Configure kubectl
      run: |
        echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig
    
    - name: Deploy to Kubernetes
      run: |
        # 更新镜像标签
        sed -i "s|image: enterprise/backend:latest|image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend:${{ github.sha }}|g" k8s/backend.yaml
        sed -i "s|image: enterprise/frontend:latest|image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:${{ github.sha }}|g" k8s/frontend.yaml
        
        # 应用配置
        kubectl apply -f k8s/
        
        # 等待部署完成
        kubectl rollout status deployment/backend -n enterprise-system
        kubectl rollout status deployment/frontend -n enterprise-system
    
    - name: Verify deployment
      run: |
        kubectl get pods -n enterprise-system
        kubectl get services -n enterprise-system
```

### 蓝绿部署策略

#### 蓝绿部署脚本 (scripts/blue-green-deploy.sh)
```bash
#!/bin/bash

set -e

# 配置变量
NAMESPACE="enterprise-system"
APP_NAME="backend"
NEW_VERSION=$1
CURRENT_COLOR=$(kubectl get service ${APP_NAME}-service -n ${NAMESPACE} -o jsonpath='{.spec.selector.color}')

if [ "$CURRENT_COLOR" = "blue" ]; then
    NEW_COLOR="green"
else
    NEW_COLOR="blue"
fi

echo "当前颜色: $CURRENT_COLOR"
echo "新颜色: $NEW_COLOR"
echo "新版本: $NEW_VERSION"

# 部署新版本
echo "部署新版本到 $NEW_COLOR 环境..."
kubectl set image deployment/${APP_NAME}-${NEW_COLOR} \
    ${APP_NAME}=${REGISTRY}/${IMAGE_NAME}/${APP_NAME}:${NEW_VERSION} \
    -n ${NAMESPACE}

# 等待部署完成
echo "等待部署完成..."
kubectl rollout status deployment/${APP_NAME}-${NEW_COLOR} -n ${NAMESPACE}

# 健康检查
echo "执行健康检查..."
kubectl wait --for=condition=ready pod \
    -l app=${APP_NAME},color=${NEW_COLOR} \
    -n ${NAMESPACE} \
    --timeout=300s

# 运行烟雾测试
echo "运行烟雾测试..."
./scripts/smoke-test.sh ${NEW_COLOR}

if [ $? -eq 0 ]; then
    echo "烟雾测试通过，切换流量..."
    
    # 切换服务流量
    kubectl patch service ${APP_NAME}-service \
        -n ${NAMESPACE} \
        -p '{"spec":{"selector":{"color":"'${NEW_COLOR}'"}}}'
    
    echo "流量已切换到 $NEW_COLOR 环境"
    
    # 等待一段时间确保稳定
    sleep 30
    
    # 缩减旧环境
    echo "缩减旧环境..."
    kubectl scale deployment ${APP_NAME}-${CURRENT_COLOR} \
        --replicas=0 -n ${NAMESPACE}
    
    echo "部署完成！"
else
    echo "烟雾测试失败，回滚部署..."
    kubectl rollout undo deployment/${APP_NAME}-${NEW_COLOR} -n ${NAMESPACE}
    exit 1
fi
```

## 📊 监控和日志

### Prometheus监控配置

#### Prometheus配置 (monitoring/prometheus.yml)
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # Prometheus自身监控
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # 应用监控
  - job_name: 'backend'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - enterprise-system
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: backend
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)

  # 基础设施监控
  - job_name: 'node-exporter'
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - source_labels: [__address__]
        regex: '(.*):10250'
        replacement: '${1}:9100'
        target_label: __address__

  # 数据库监控
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

### 告警规则配置

#### 告警规则 (monitoring/alert_rules.yml)
```yaml
groups:
- name: application_alerts
  rules:
  # 应用可用性告警
  - alert: ApplicationDown
    expr: up{job="backend"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "应用服务不可用"
      description: "{{ $labels.instance }} 应用服务已停止响应超过1分钟"

  # 响应时间告警
  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "响应时间过高"
      description: "95%的请求响应时间超过1秒，当前值: {{ $value }}秒"

  # 错误率告警
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "错误率过高"
      description: "5xx错误率超过5%，当前值: {{ $value | humanizePercentage }}"

- name: infrastructure_alerts
  rules:
  # CPU使用率告警
  - alert: HighCPUUsage
    expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "CPU使用率过高"
      description: "{{ $labels.instance }} CPU使用率超过80%，当前值: {{ $value }}%"

  # 内存使用率告警
  - alert: HighMemoryUsage
    expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "内存使用率过高"
      description: "{{ $labels.instance }} 内存使用率超过85%，当前值: {{ $value }}%"

  # 磁盘空间告警
  - alert: LowDiskSpace
    expr: (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100 > 90
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "磁盘空间不足"
      description: "{{ $labels.instance }} 磁盘使用率超过90%，当前值: {{ $value }}%"
```

### 日志收集配置

#### Fluentd配置 (logging/fluentd.conf)
```xml
<source>
  @type tail
  @id input_tail
  @label @mainstream
  path /var/log/containers/*.log
  pos_file /var/log/fluentd-containers.log.pos
  tag raw.kubernetes.*
  read_from_head true
  <parse>
    @type multi_format
    <pattern>
      format json
      time_key time
      time_format %Y-%m-%dT%H:%M:%S.%NZ
    </pattern>
    <pattern>
      format /^(?<time>.+) (?<stream>stdout|stderr) [^ ]* (?<log>.*)$/
      time_format %Y-%m-%dT%H:%M:%S.%N%:z
    </pattern>
  </parse>
</source>

<label @mainstream>
  <filter raw.kubernetes.**>
    @type kubernetes_metadata
    @id filter_kube_metadata
    kubernetes_url "#{ENV['FLUENT_FILTER_KUBERNETES_URL'] || 'https://' + ENV['KUBERNETES_SERVICE_HOST'] + ':' + ENV['KUBERNETES_SERVICE_PORT'] + '/api'}"
    verify_ssl "#{ENV['KUBERNETES_VERIFY_SSL'] || true}"
    ca_file "#{ENV['KUBERNETES_CA_FILE']}"
    skip_labels "#{ENV['FLUENT_KUBERNETES_METADATA_SKIP_LABELS'] || 'false'}"
    skip_container_metadata "#{ENV['FLUENT_KUBERNETES_METADATA_SKIP_CONTAINER_METADATA'] || 'false'}"
    skip_master_url "#{ENV['FLUENT_KUBERNETES_METADATA_SKIP_MASTER_URL'] || 'false'}"
    skip_namespace_metadata "#{ENV['FLUENT_KUBERNETES_METADATA_SKIP_NAMESPACE_METADATA'] || 'false'}"
  </filter>

  <filter kubernetes.**>
    @type grep
    <regexp>
      key $.kubernetes.namespace_name
      pattern ^enterprise-system$
    </regexp>
  </filter>

  <match kubernetes.**>
    @type elasticsearch
    @id out_es
    @log_level info
    include_tag_key true
    host "#{ENV['FLUENT_ELASTICSEARCH_HOST'] || 'elasticsearch'}"
    port "#{ENV['FLUENT_ELASTICSEARCH_PORT'] || '9200'}"
    path "#{ENV['FLUENT_ELASTICSEARCH_PATH'] || ''}"
    scheme "#{ENV['FLUENT_ELASTICSEARCH_SCHEME'] || 'http'}"
    ssl_verify "#{ENV['FLUENT_ELASTICSEARCH_SSL_VERIFY'] || 'true'}"
    ssl_version "#{ENV['FLUENT_ELASTICSEARCH_SSL_VERSION'] || 'TLSv1_2'}"
    user "#{ENV['FLUENT_ELASTICSEARCH_USER'] || use_default}"
    password "#{ENV['FLUENT_ELASTICSEARCH_PASSWORD'] || use_default}"
    reload_connections "#{ENV['FLUENT_ELASTICSEARCH_RELOAD_CONNECTIONS'] || 'false'}"
    reconnect_on_error "#{ENV['FLUENT_ELASTICSEARCH_RECONNECT_ON_ERROR'] || 'true'}"
    reload_on_failure "#{ENV['FLUENT_ELASTICSEARCH_RELOAD_ON_FAILURE'] || 'true'}"
    log_es_400_reason "#{ENV['FLUENT_ELASTICSEARCH_LOG_ES_400_REASON'] || 'false'}"
    logstash_prefix "#{ENV['FLUENT_ELASTICSEARCH_LOGSTASH_PREFIX'] || 'logstash'}"
    logstash_dateformat "#{ENV['FLUENT_ELASTICSEARCH_LOGSTASH_DATEFORMAT'] || '%Y.%m.%d'}"
    logstash_format "#{ENV['FLUENT_ELASTICSEARCH_LOGSTASH_FORMAT'] || 'true'}"
    index_name "#{ENV['FLUENT_ELASTICSEARCH_LOGSTASH_INDEX_NAME'] || 'logstash'}"
    type_name "#{ENV['FLUENT_ELASTICSEARCH_LOGSTASH_TYPE_NAME'] || 'fluentd'}"
    <buffer>
      flush_thread_count "#{ENV['FLUENT_ELASTICSEARCH_BUFFER_FLUSH_THREAD_COUNT'] || '8'}"
      flush_interval "#{ENV['FLUENT_ELASTICSEARCH_BUFFER_FLUSH_INTERVAL'] || '5s'}"
      chunk_limit_size "#{ENV['FLUENT_ELASTICSEARCH_BUFFER_CHUNK_LIMIT_SIZE'] || '2M'}"
      queue_limit_length "#{ENV['FLUENT_ELASTICSEARCH_BUFFER_QUEUE_LIMIT_LENGTH'] || '32'}"
      retry_max_interval "#{ENV['FLUENT_ELASTICSEARCH_BUFFER_RETRY_MAX_INTERVAL'] || '30'}"
      retry_forever true
    </buffer>
  </match>
</label>
```

## 🔒 安全配置

### SSL/TLS证书管理

#### Cert-Manager配置 (k8s/cert-manager.yaml)
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx

---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: enterprise-tls
  namespace: enterprise-system
spec:
  secretName: enterprise-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - enterprise.example.com
  - api.enterprise.example.com
```

### 网络安全策略

#### NetworkPolicy配置 (k8s/network-policy.yaml)
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: enterprise-network-policy
  namespace: enterprise-system
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  
  ingress:
  # 允许来自Ingress的流量
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 80
    - protocol: TCP
      port: 8000
  
  # 允许内部服务间通信
  - from:
    - podSelector: {}
    ports:
    - protocol: TCP
      port: 8000
    - protocol: TCP
      port: 5432
    - protocol: TCP
      port: 6379
  
  egress:
  # 允许DNS查询
  - to: []
    ports:
    - protocol: UDP
      port: 53
  
  # 允许访问外部API
  - to: []
    ports:
    - protocol: TCP
      port: 443
  
  # 允许内部服务通信
  - to:
    - podSelector: {}
    ports:
    - protocol: TCP
      port: 8000
    - protocol: TCP
      port: 5432
    - protocol: TCP
      port: 6379
```

## 📋 部署检查清单

### 部署前检查
- [ ] 代码审查通过
- [ ] 测试套件全部通过
- [ ] 安全扫描无高危漏洞
- [ ] 性能测试达标
- [ ] 文档更新完成

### 基础设施检查
- [ ] 服务器资源充足
- [ ] 网络连接正常
- [ ] 存储空间足够
- [ ] 备份策略就绪
- [ ] 监控系统运行

### 应用部署检查
- [ ] 镜像构建成功
- [ ] 配置文件正确
- [ ] 环境变量设置
- [ ] 数据库迁移完成
- [ ] 服务健康检查通过

### 安全检查
- [ ] SSL证书有效
- [ ] 防火墙规则配置
- [ ] 访问控制设置
- [ ] 敏感数据加密
- [ ] 审计日志启用

### 部署后验证
- [ ] 应用功能正常
- [ ] 性能指标正常
- [ ] 监控告警配置
- [ ] 日志收集正常
- [ ] 备份恢复测试

### 回滚准备
- [ ] 回滚脚本准备
- [ ] 数据备份完成
- [ ] 回滚流程测试
- [ ] 应急联系人确认
- [ ] 回滚决策标准明确 
