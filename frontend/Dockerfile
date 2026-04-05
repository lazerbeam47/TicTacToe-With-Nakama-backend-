# frontend/Dockerfile — multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Accept build-time env vars
ARG VITE_NAKAMA_HOST=localhost
ARG VITE_NAKAMA_PORT=7350
ARG VITE_NAKAMA_SERVER_KEY=defaultkey
ARG VITE_NAKAMA_SSL=false
ENV VITE_NAKAMA_HOST=$VITE_NAKAMA_HOST
ENV VITE_NAKAMA_PORT=$VITE_NAKAMA_PORT
ENV VITE_NAKAMA_SERVER_KEY=$VITE_NAKAMA_SERVER_KEY
ENV VITE_NAKAMA_SSL=$VITE_NAKAMA_SSL

RUN npm run build

# ── Production image ──────────────────────────────────────────────────────────
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
