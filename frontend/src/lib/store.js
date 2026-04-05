// lib/store.js — Zustand global state
import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // ─── Auth ─────────────────────────────────────────────────────────────────
  session:  null,
  username: '',
  deviceId: null,
  setSession:  (s)  => set({ session: s }),
  setUsername: (u)  => set({ username: u }),
  setDeviceId: (id) => set({ deviceId: id }),

  // ─── Match ────────────────────────────────────────────────────────────────
  matchId:     null,
  matchPhase:  'idle',     // idle | waiting | playing | game_over
  board:       Array(9).fill(''),
  currentTurn: 'X',
  mySymbol:    null,
  players:     [],
  moveNumber:  0,
  timedMode:   false,
  turnDeadline: 0,
  timerRemaining: null,

  // ─── Game result ──────────────────────────────────────────────────────────
  result: null,  // { winner, winnerId, winnerName, winningLine, reason }

  // ─── Notifications ────────────────────────────────────────────────────────
  notifications: [],

  // ─── Actions ──────────────────────────────────────────────────────────────
  setMatch: (id)  => set({ matchId: id }),
  setMySymbol: (s) => set({ mySymbol: s }),
  setTimedMode: (t) => set({ timedMode: t }),

  applyGameState: (payload) => set((state) => {
    const session = state.session
    const myPlayer = session && payload.players
      ? payload.players.find(p => p.user_id === session.user_id)
      : null
    return {
      board:        payload.board,
      currentTurn:  payload.current_turn,
      players:      payload.players,
      matchPhase:   payload.phase,
      moveNumber:   payload.move_number,
      timedMode:    payload.timed_mode,
      turnDeadline: payload.turn_deadline,
      result:       null,
      mySymbol:     myPlayer ? myPlayer.symbol : state.mySymbol,
    }
  }),

  setWaiting: () => set({ matchPhase: 'waiting', result: null }),

  setGameOver: (result) => set({ matchPhase: 'game_over', result }),

  setTimerRemaining: (t) => set({ timerRemaining: t }),

  addNotification: (msg, type = 'info') => {
    const id = Date.now()
    set(s => ({ notifications: [...s.notifications, { id, msg, type }] }))
    setTimeout(() => {
      set(s => ({ notifications: s.notifications.filter(n => n.id !== id) }))
    }, 4000)
  },

  resetMatch: () => set({
    matchId:        null,
    matchPhase:     'idle',
    board:          Array(9).fill(''),
    currentTurn:    'X',
    mySymbol:       null,
    players:        [],
    moveNumber:     0,
    result:         null,
    timerRemaining: null,
  }),
}))
