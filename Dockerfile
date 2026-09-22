# ============================================================
# Stage 1 - Install dependencies
# ============================================================

FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci


# ============================================================
# Stage 2 - Build Vite application
# ============================================================

FROM node:22-alpine AS builder

WORKDIR /app

# Reuse node_modules from dependency stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy package files
COPY package.json package-lock.json ./

# Copy application source
COPY . .

# Vite environment variables are BUILD-TIME variables
ARG VITE_API_BASE_URL

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build


# ============================================================
# Stage 3 - Production runtime
# ============================================================

FROM nginx:alpine AS runtime

# Remove default nginx configuration
RUN rm -f /etc/nginx/conf.d/default.conf

# Add application nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy ONLY the compiled frontend
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]