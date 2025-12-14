# Multi-stage Dockerfile for Continuous Portfolio Planning
# Runs Node.js frontend/proxy on port 5000, Python FastAPI backend on port 8000

FROM node:20-slim AS base

# Install Python 3.11 and required system dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3-pip \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create symlinks for python
RUN ln -sf /usr/bin/python3.11 /usr/bin/python3 && \
    ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy Python dependencies and install
COPY pyproject.toml ./
RUN python -m pip install --break-system-packages -e . || \
    python -m pip install --break-system-packages \
    fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-dotenv httpx alembic

# Copy the rest of the application
COPY . .

# Build frontend for production (optional, can be skipped for dev)
ARG BUILD_ENV=development
RUN if [ "$BUILD_ENV" = "production" ]; then npm run build; fi

# Expose ports
EXPOSE 5000 8000

# Default command - runs both servers
CMD ["bash", "start.sh"]
