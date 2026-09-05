# ==============================================================================
# Multi-Stage Production Dockerfile for AI Teacher Web (SPA)
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root dependency manifest & workspaces
COPY package*.json ./
COPY packages/types/package*.json ./packages/types/
COPY apps/web/package*.json ./apps/web/

RUN npm ci

# Copy full source tree
COPY packages/types ./packages/types
COPY apps/web ./apps/web

# Build production bundle with Vite
RUN npm run build --workspace=@ai-teacher/web

# ==============================================================================
# Production Static Serving via NGINX Alpine
# ==============================================================================
FROM nginx:alpine AS runner

# Copy compiled static assets
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Custom nginx configuration for SPA routing & security headers
RUN echo 'server { \
  listen 80; \
  server_name localhost; \
  location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files $uri $uri/ /index.html; \
  } \
  location /api/ { \
    proxy_pass http://api:5000/api/; \
    proxy_set_header Host $host; \
    proxy_set_header X-Real-IP $remote_addr; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
