// lib/nakama.js — Nakama client singleton & helpers
import { Client } from '@heroiclabs/nakama-js'

// ─── Config (override via .env) ──────────────────────────────────────────────
const HOST       = import.meta.env.VITE_NAKAMA_HOST      || 'localhost'
const PORT       = Number(import.meta.env.VITE_NAKAMA_PORT)   || 7350
const SERVER_KEY = import.meta.env.VITE_NAKAMA_SERVER_KEY || 'defaultkey'
const USE_SSL    = import.meta.env.VITE_NAKAMA_SSL === 'true'

// ─── Op-codes (must match tictactoe.lua) ────────────────────────────────────
export const OP = {
  // Server → Client
  GAME_STATE:   1,
  MOVE_REJECT:  2,
  GAME_OVER:    3,
  PLAYER_JOIN:  4,
  PLAYER_LEAVE: 5,
  TIMER_UPDATE: 6,
  WAITING:      7,
  // Client → Server
  MAKE_MOVE:  101,
  REMATCH:    102,
  FORFEIT:    103,
}

// ─── Singleton client ─────────────────────────────────────────────────────────
let _client  = null
let _session = null
let _socket  = null

export function getClient() {
  if (!_client) {
    _client = new Client(SERVER_KEY, HOST, PORT, USE_SSL)
    _client.timeout = 7000
  }
  return _client
}

export function getSession()      { return _session }
export function setSession(s)     { _session = s }
export function getSocket()       { return _socket }
export function setSocket(sock)   { _socket = sock }

export function clearSession() {
  _session = null
  _socket = null
  _client = null
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export async function authenticateDevice(deviceId, username) {
  const client = getClient()
  const session = await client.authenticateDevice(deviceId, true, username)
  setSession(session)
  return session
}

// ─── WebSocket ───────────────────────────────────────────────────────────────
export async function connectSocket(session) {
  const client = getClient()
  const sock = client.createSocket(USE_SSL)
  await sock.connect(session, true)
  setSocket(sock)
  return sock
}

// ─── Match helpers ────────────────────────────────────────────────────────────
export async function rpc(name, payload = {}) {
  const client = getClient()
  const session = getSession()
  const result = await client.apiClient.rpcFunc(session.token, name, JSON.stringify(payload))
  const p = result.payload; if (!p) return {}; if (typeof p === "string") return JSON.parse(p); return p
}

export async function joinMatch(matchId) {
  const sock = getSocket()
  return await sock.joinMatch(matchId)
}

export async function leaveMatch(matchId) {
  const sock = getSocket()
  try { await sock.leaveMatch(matchId) } catch (_) {}
}

export function sendMatchMessage(matchId, opCode, data) {
  const sock = getSocket()
  const encoded = JSON.stringify(data)
  sock.sendMatchState(matchId, opCode, encoded)
}
