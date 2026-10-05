# Stage 1: Build React + Vite Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install dependencies using lockfile
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy frontend source files
COPY frontend/ ./

# Build arguments for frontend configuration (no credentials hardcoded)
ARG VITE_N8N_WEBHOOK_URL=https://yeshashwini.app.n8n.cloud/webhook/wandermind-plan
ARG VITE_LOCATIONIQ_API_KEY
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_API_URL=""

ENV VITE_N8N_WEBHOOK_URL=${VITE_N8N_WEBHOOK_URL} \
    VITE_LOCATIONIQ_API_KEY=${VITE_LOCATIONIQ_API_KEY} \
    VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY} \
    VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Python Backend Runtime
FROM python:3.11-slim

WORKDIR /app

# Install minimal system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install backend dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application files
COPY backend/ ./backend/

# Copy built frontend assets from stage 1 into /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Configure runtime environment
ENV PYTHONUNBUFFERED=1 \
    PORT=8000 \
    FRONTEND_DIST_DIR=/app/frontend/dist

EXPOSE 8000

WORKDIR /app/backend

# Listen on 0.0.0.0 and dynamically bind to Render PORT
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
