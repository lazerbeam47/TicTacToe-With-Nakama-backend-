# LILA · Multiplayer Tic-Tac-Toe

> A production-ready, server-authoritative multiplayer Tic-Tac-Toe game built with **Nakama** (backend) and **React + Vite** (frontend).

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Features](#features)
3. [Project Structure](#project-structure)
4. [Local Development Setup](#local-development-setup)
5. [Deployment Guide](#deployment-guide)
6. [API & Server Configuration](#api--server-configuration)
7. [Testing Multiplayer Functionality](#testing-multiplayer-functionality)
8. [Design Decisions](#design-decisions)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Client (React)                │
│  LoginPage → LobbyPage → GamePage / Leaderboard │
│        useAuth  useNakama  Zustand store         │
└───────────────────┬─────────────────────────────┘
                    │  WebSocket (real-time)
                    │  HTTP REST (RPC calls)
                    ▼
┌─────────────────────────────────────────────────┐
│              Nakama Server (Lua)                │
│                                                 │
│  main.lua ─── registers all modules             │
│  ├── tictactoe.lua   (match handler)            │
│  │     match_init / match_join / match_loop     │
│  │     Server-authoritative move validation     │
│  │     Timer enforcement, forfeit, rematch      │
│  ├── matchmaker.lua  (RPC: find/create/join)    │
│  └── leaderboard.lua (RPC: rankings & stats)   │
└───────────────────┬─────────────────────────────┘
                    │  SQL
                    ▼
┌─────────────────────────────────────────────────┐
│              PostgreSQL 16                      │
│  nakama schema (auto-migrated on startup)       │
│  + player_stats storage (custom collection)     │
└─────────────────────────────────────────────────┘
```

### Server-Authoritative Model

All game state lives **exclusively on the server**. Clients send _intents_ (make move, forfeit, rematch); the server validates, updates state, and broadcasts the canonical state to all connected clients. This architecture:

- Prevents cheating: clients cannot directly modify board state
- Ensures consistency: all players always see the same board
- Handles edge cases: disconnections, timeouts, illegal moves

---

## Features

### Core (Required)

- ✅ Server-authoritative game logic (Nakama Lua match handler)
- ✅ Move validation server-side (symbol ownership, cell occupancy, range)
- ✅ Real-time state broadcast via WebSocket
- ✅ Automatic matchmaking (find open match or create new)
- ✅ Private match creation + join by ID
- ✅ Player disconnection handling (auto-forfeit + win awarded)
- ✅ Responsive mobile-first UI

### Bonus

- ✅ **Concurrent game support** — each Nakama match is fully isolated; unlimited simultaneous games
- ✅ **Leaderboard** — global win rankings + personal stats (W/L/D, win %, win streak)
- ⏳ **Timer mode (coming soon)** — 30-second per-turn countdown; implementation in progress and not yet enabled in production
- ✅ **Mode selection** — Classic vs Timed in both matchmaking and lobby
- ✅ **Rematch** — both players can vote for a rematch without leaving the match
- ✅ **Symbol swap on rematch** — X and O alternate each game

---

## Project Structure

```
tictactoe/
├── backend/
│   ├── lua/
│   │   ├── main.lua          # Module registration entry point
│   │   ├── tictactoe.lua     # Core match handler (game logic)
│   │   ├── matchmaker.lua    # RPC: find_or_create_match, create_private_match, join_match_by_id
│   │   └── leaderboard.lua   # RPC: get_leaderboard, get_player_stats
│   └── docker/
│       ├── docker-compose.yml        # Backend-only (postgres + nakama)
│       ├── docker-compose.full.yml   # Full stack (+ frontend nginx)
│       ├── config.yml                # Nakama server config
│       ├── nginx.conf                # Frontend nginx + reverse proxy
│       └── .env.production           # Production secrets template
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── LoginPage.jsx         # Device auth screen
    │   │   ├── LobbyPage.jsx         # Matchmaking lobby
    │   │   ├── GamePage.jsx          # Main game view
    │   │   ├── Board.jsx             # 3×3 grid
    │   │   ├── Cell.jsx              # Individual cell with animations
    │   │   ├── PlayerStrip.jsx       # Player info + turn indicator
    │   │   ├── Timer.jsx             # Countdown ring (timed mode)
    │   │   ├── GameOverlay.jsx       # Win/loss/draw modal
    │   │   └── NotificationStack.jsx # Toast notifications
    │   ├── hooks/
    │   │   ├── useAuth.js            # Device authentication + socket connect
    │   │   └── useNakama.js          # Socket listener + match actions
    │   ├── lib/
    │   │   ├── nakama.js             # Nakama client singleton + helpers
    │   │   └── store.js              # Zustand global state
    │   ├── styles/index.css          # Tailwind + custom CSS
    │   ├── App.jsx                   # Router
    │   └── main.jsx                  # React entry point
    ├── Dockerfile
    ├── vite.config.js
    ├── tailwind.config.js
    └── .env.example
```

---

## Local Development Setup

### Note — Local demo

This project is demonstrated locally by default (Nakama + Postgres run in Docker containers). The README provides deployment steps for Fly.io / VPS, but for development and demos the server runs on your machine and is accessible at the ports listed below.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose v2
- [Node.js 20+](https://nodejs.org/) + npm
- Git

### Run locally — explicit steps

1. Clone the repository and open a terminal:

   ```bash
   git clone https://github.com/your-org/lila-tictactoe.git
   cd lila-tictactoe
   ```

2. Start the backend (Nakama + Postgres) in its own terminal. This runs Nakama locally and is what the frontend connects to for the demo:

   ```bash
   cd backend/docker
   docker compose up -d --build
   ```

   Wait ~10–20s for containers to initialize. Verify Nakama is healthy:

   ```bash
   curl http://localhost:7350/healthcheck
   # → {"status":"ok"}
   ```

   Default local ports used by the stack:
   - Nakama HTTP/WebSocket API: http://localhost:7350
   - Nakama Console (admin UI): http://localhost:7351
   - Frontend dev server (Vite): http://localhost:5173

3. Start the frontend (separate terminal):

   ```bash
   cd frontend
   cp .env.example .env     # copy defaults
   npm install
   npm run dev
   ```

4. Open two browser windows/tabs to test multiplayer locally:
   - Window A: http://localhost:5173 → enter username, click Play Now
   - Window B (incognito): http://localhost:5173 → enter different username, click Play Now

5. Optional: run the provided smoke test which exercises the full stack: `./scripts/smoke-test.sh` (ensure backend is running first).

Troubleshooting hints (local):

- If RPCs return 500, tail server logs:

  `docker compose -f backend/docker/docker-compose.yml logs -f nakama`

- If WebSocket fails, verify frontend `.env` contains `VITE_NAKAMA_HOST=localhost` and `VITE_NAKAMA_PORT=7350`.

---

## Deployment Guide

### Deployment Notes

This project can be deployed on platforms like **AWS**, **Azure**, **Fly.io**, or any self-managed **VPS**. However, due to free-tier limitations (no always-on backend without billing), the public demo is provided via the local Docker setup included in this repository. For production deployments you should provision a VPS or cloud instance, configure persistent Postgres storage, and secure the Nakama server (JWT keys, TLS, firewall).

### Fly.io (quick notes)

1. Install the Fly CLI and log in: `curl -L https://fly.io/install.sh | sh && flyctl auth login`
2. Create apps for backend and frontend (or a single app with a reverse proxy). Configure secrets (JWT keys, DB credentials) via `flyctl secrets set`.
3. Use the `backend/docker/docker-compose.full.yml` or a Dockerfile-based deploy to push Nakama and Postgres. Ensure `NAKAMA_PUBLIC_HOST` points to the Fly app hostname.

   Fly.io is convenient for small deployments but requires proper secret management (JWT keys, DB credentials) and setting sticky storage for Postgres.

### VPS / Self-managed (recommended for full control)

1. Provision a server (Ubuntu 22.04 recommended) with Docker + Docker Compose v2.
2. Clone repo on server and copy `backend/docker/.env.production` → `.env`, then edit and populate production secrets (JWT keys, encrypt key, DB password, public host).
3. Run the full stack:

   ```bash
   cd backend/docker
   docker compose -f docker-compose.full.yml --env-file .env up -d --build
   ```

4. Configure a reverse proxy (Caddy or nginx) with TLS for your frontend and Nakama endpoints. Set `VITE_NAKAMA_SSL=true` and update `VITE_NAKAMA_PORT` to `443` in the frontend environment.

Security notes:

- Keep `NAKAMA_JWT_KEY` and `NAKAMA_ENCRYPT_KEY` secret and rotate if leaked.
- Restrict Nakama Console (7349) access in your firewall to trusted IPs.

---

## API & Server Configuration

### Nakama RPC Endpoints

All RPCs are called over HTTP GET with a JSON payload, or via the Nakama JS SDK's `rpcGet`.

| RPC Name               | Payload                | Response                     | Description             |
| ---------------------- | ---------------------- | ---------------------------- | ----------------------- |
| `find_or_create_match` | `{ timed: bool }`      | `{ match_id, created }`      | Auto-matchmaking        |
| `create_private_match` | `{ timed: bool }`      | `{ match_id }`               | Create invite-only room |
| `join_match_by_id`     | `{ match_id: string }` | `{ match_id, valid }`        | Validate + join by ID   |
| `get_leaderboard`      | `{}`                   | `{ leaderboard: [...] }`     | Top 20 global rankings  |
| `get_player_stats`     | `{}`                   | `{ stats, total, win_rate }` | Calling user's stats    |

### WebSocket Op-Codes

#### Server → Client

| Code | Name           | Payload                                              |
| ---- | -------------- | ---------------------------------------------------- |
| 1    | `GAME_STATE`   | Full board, turn, players, phase                     |
| 2    | `MOVE_REJECT`  | `{ reason, cell }`                                   |
| 3    | `GAME_OVER`    | `{ winner, winner_id, reason, winning_line, board }` |
| 4    | `PLAYER_JOIN`  | `{ user_id, username, symbol }`                      |
| 5    | `PLAYER_LEAVE` | `{ user_id, username }`                              |
| 6    | `TIMER_UPDATE` | `{ remaining, current_turn }`                        |
| 7    | `WAITING`      | `{ message }`                                        |

#### Client → Server

| Code | Name        | Payload         |
| ---- | ----------- | --------------- |
| 101  | `MAKE_MOVE` | `{ cell: 1–9 }` |
| 102  | `REMATCH`   | `{}`            |
| 103  | `FORFEIT`   | `{}`            |

### Nakama Configuration (config.yml)

Key settings:

```yaml
session.token_expiry_sec: 86400 # 24h auth tokens
match.max_empty_sec: 60 # close idle matches after 60s
socket.ping_period_ms: 15000 # keep-alive interval
```

Override any setting via environment variable: `NAKAMA_<SECTION>_<KEY>`.

### Storage Collections

| Collection     | Key     | Permissions               | Contents                                           |
| -------------- | ------- | ------------------------- | -------------------------------------------------- |
| `player_stats` | `stats` | Public read, server write | `{ wins, losses, draws, win_streak, best_streak }` |

### Leaderboard

- ID: `global_wins`
- Sort: descending by win count
- Operator: `incr` (each win adds 1)
- Reset: never (persistent)

---

## Testing Multiplayer Functionality

### Manual Test — Two Browser Windows

1. Open **http://localhost:5173** in Window A → enter username "PlayerA" → click Play Now
2. Open **http://localhost:5173** in Window B (incognito) → enter username "PlayerB" → click Play Now
3. Both should be matched automatically and see the game board
4. Alternate clicking cells — only the correct player's turn is accepted
5. Verify the other player's board updates in real-time

### Test Scenarios

| Scenario                      | How to Test                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| **Valid move**                | Click any empty cell on your turn                                                        |
| **Invalid move (wrong turn)** | Try clicking during opponent's turn — rejected with notification                         |
| **Occupied cell**             | Click an already-filled cell — rejected                                                  |
| **Win detection**             | Complete a row/column/diagonal                                                           |
| **Draw**                      | Fill all 9 cells without a winner                                                        |
| **Disconnect**                | Close one browser tab mid-game — other player wins                                       |
| **Forfeit**                   | Click "Forfeit" in header                                                                |
| **Rematch**                   | Both players click "Request Rematch" after game over                                     |
| **Timer mode**                | Select "⏱ Timed" in lobby, wait 30s without moving                                       |
| **Private match**             | Player A clicks "Create Private", shares Match ID; Player B pastes in "Join by Match ID" |
| **Leaderboard**               | Play several games, check 🏆 Leaderboard for rankings                                    |

### Nakama Console (Admin View)

Visit **http://localhost:7351** → Matches to see live active matches, connected players, and match state in real time.

---

## Demo

A full working demo is shown in the attached video (recorded locally using the Docker demo stack). The demo highlights:

- Real-time multiplayer gameplay with server-authoritative state
- Automatic matchmaking and private match flow
- Match lifecycle (join, play, win/draw, rematch)

---

## Design Decisions

### Why Nakama?

Nakama provides production-grade infrastructure (WebSockets, matchmaking, leaderboards, persistence, auth) that would otherwise require weeks to build. Its server-side Lua runtime lets us keep all game logic authoritative with zero client trust.

### Server-Authoritative Design

Every state change goes through the server's `match_loop`. Clients send op-code messages; the server validates and broadcasts canonical state. The client **never** updates its own board — it only renders what the server sends. This eliminates all cheating vectors.

### Match Isolation

Each Nakama match is an independent goroutine with its own state table. Concurrent games are fully isolated with no shared mutable state between matches.

### Auth Strategy

Device-based authentication (UUID stored in `localStorage`) provides a frictionless UX — no password needed — while still giving each player a stable identity and persistent stats. In production this would be augmented with social auth (Google, Apple).

### Frontend State

Zustand was chosen over Redux for its minimal boilerplate. The store is the single source of truth for game state. The `useNakama` hook wires the socket's `onmatchdata` callback to store actions, keeping components pure and declarative.

### Reconnection

If a player's connection drops and they re-open the app, they'll land on the lobby (the match ID is not persisted across sessions by design for simplicity). An enhancement would be to persist the `matchId` in `sessionStorage` and auto-rejoin on reconnect using Nakama's reconnection token.

---

## Database Migrations

- Nakama will auto-migrate its schema on startup. To reset local DB, stop containers and remove the Postgres volume (only for dev!).
- Note: Nakama requires database migrations before first run — the Docker setup runs these automatically, or run them manually if you manage the DB yourself.

---

## Tech Stack

- Backend: Nakama (Lua runtime) running in Docker, PostgreSQL 16 for persistence
- Server language: Lua (Nakama server modules)
- Frontend: React + Vite, written in modern JSX
- UI: Tailwind CSS for styling
- Real-time: Nakama WebSocket + Nakama JS SDK (rpc, socket)
- State: Zustand (frontend global store)
- Matchmaking & persistence: Nakama match/runtime + Postgres
- Deployment / infra: Docker Compose, nginx (reverse proxy), optional Fly.io / VPS
- Tooling: Node.js 20+, npm, Git, Docker
