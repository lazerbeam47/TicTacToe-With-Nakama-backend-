# Makefile — LILA TicTacToe dev & deployment shortcuts
.PHONY: help dev-backend dev-frontend dev install build deploy-stack logs stop clean

COMPOSE_BACKEND = docker compose -f backend/docker/docker-compose.yml
COMPOSE_FULL    = docker compose -f backend/docker/docker-compose.full.yml

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Local Development ─────────────────────────────────────────────────────────

dev-backend: ## Start Nakama + Postgres locally
	$(COMPOSE_BACKEND) up -d
	@echo "\n✅ Nakama running at http://localhost:7350"
	@echo "   Console: http://localhost:7349 (admin / adminpassword)"

dev-frontend: ## Start Vite dev server
	cd frontend && npm run dev

dev: ## Start everything for local development (two terminals needed)
	@echo "Starting backend..."
	$(COMPOSE_BACKEND) up -d
	@echo "Starting frontend..."
	cd frontend && npm run dev

install: ## Install frontend dependencies
	cd frontend && npm install

# ── Build ─────────────────────────────────────────────────────────────────────

build: ## Build frontend for production
	cd frontend && npm run build

# ── Deployment ────────────────────────────────────────────────────────────────

deploy-stack: ## Deploy full stack via Docker Compose (requires .env in backend/docker/)
	@test -f backend/docker/.env || (echo "❌ Missing backend/docker/.env — copy .env.production and fill in values" && exit 1)
	$(COMPOSE_FULL) --env-file backend/docker/.env up -d --build
	@echo "\n✅ Deployed! Frontend: http://your-server | Nakama: http://your-server:7350"

# ── Ops ───────────────────────────────────────────────────────────────────────

logs: ## Follow Nakama logs
	$(COMPOSE_BACKEND) logs -f nakama

logs-all: ## Follow all service logs
	$(COMPOSE_FULL) logs -f

stop: ## Stop all services
	$(COMPOSE_BACKEND) down || true
	$(COMPOSE_FULL) down || true

clean: ## Stop services and remove volumes (DESTRUCTIVE)
	$(COMPOSE_BACKEND) down -v || true
	$(COMPOSE_FULL) down -v || true
	@echo "⚠️  All data volumes removed."

health: ## Check Nakama health
	@curl -sf http://localhost:7350/healthcheck && echo "✅ Nakama healthy" || echo "❌ Nakama not responding"
