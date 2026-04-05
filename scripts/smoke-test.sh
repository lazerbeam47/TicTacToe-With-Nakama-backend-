#!/usr/bin/env bash
# scripts/smoke-test.sh — Verify Nakama server is up and RPCs are reachable
# Usage: ./scripts/smoke-test.sh [host] [port] [server_key]

set -euo pipefail

HOST="${1:-localhost}"
PORT="${2:-7350}"
SERVER_KEY="${3:-defaultkey}"
BASE="http://${HOST}:${PORT}"

echo "🔍 Smoke-testing Nakama at ${BASE}..."
echo ""

# ── 1. Health check ────────────────────────────────────────────────────────────
printf "  [1/4] Health check... "
STATUS=$(curl -sf "${BASE}/healthcheck" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null || echo "FAIL")
if [ "$STATUS" = "ok" ]; then echo "✅ ok"
else echo "❌ ${STATUS}"; exit 1; fi

# ── 2. Authenticate (device) ──────────────────────────────────────────────────
printf "  [2/4] Device auth... "
DEVICE_ID="smoke-test-$(date +%s)"
AUTH_RESP=$(curl -sf -X POST "${BASE}/v2/account/authenticate/device?create=true&username=SmokeBot" \
  -u "${SERVER_KEY}:" \
  -H "Content-Type: application/json" \
  -d "{\"id\": \"${DEVICE_ID}\"}" 2>/dev/null || echo "FAIL")

TOKEN=$(echo "$AUTH_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null || echo "")
if [ -n "$TOKEN" ]; then echo "✅ token obtained"
else echo "❌ auth failed"; echo "$AUTH_RESP"; exit 1; fi

# ── 3. RPC: find_or_create_match ─────────────────────────────────────────────
printf "  [3/4] RPC find_or_create_match... "
RPC_RESP=$(curl -sf -X GET "${BASE}/v2/rpc/find_or_create_match?payload=%7B%22timed%22%3Afalse%7D" \
  -H "Authorization: Bearer ${TOKEN}" 2>/dev/null || echo "FAIL")
MATCH_ID=$(echo "$RPC_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
payload = json.loads(d.get('payload','{}'))
print(payload.get('match_id',''))
" 2>/dev/null || echo "")
if [ -n "$MATCH_ID" ]; then echo "✅ match_id=${MATCH_ID:0:16}..."
else echo "❌ RPC failed"; echo "$RPC_RESP"; exit 1; fi

# ── 4. RPC: get_leaderboard ───────────────────────────────────────────────────
printf "  [4/4] RPC get_leaderboard... "
LB_RESP=$(curl -sf -X GET "${BASE}/v2/rpc/get_leaderboard?payload=%7B%7D" \
  -H "Authorization: Bearer ${TOKEN}" 2>/dev/null || echo "FAIL")
HAS_LB=$(echo "$LB_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
payload = json.loads(d.get('payload','{}'))
print('ok' if 'leaderboard' in payload else 'fail')
" 2>/dev/null || echo "fail")
if [ "$HAS_LB" = "ok" ]; then echo "✅ leaderboard reachable"
else echo "❌ RPC failed"; echo "$LB_RESP"; exit 1; fi

echo ""
echo "✅ All smoke tests passed! Server is healthy."
