// lib/reconnect.js — Automatic WebSocket reconnection with exponential backoff
import { getSession, connectSocket, getSocket } from './nakama'
import { useStore } from './store'

const MAX_RETRIES  = 5
const BASE_DELAY   = 1000   // 1s
const MAX_DELAY    = 30000  // 30s

let retryCount  = 0
let retryTimer  = null
let isReconnecting = false

function getDelay() {
  return Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY)
}

export function initReconnectHandler() {
  const sock = getSocket()
  if (!sock) return

  sock.ondisconnect = (event) => {
    console.warn('[Reconnect] Socket disconnected', event)
    const { addNotification, matchPhase } = useStore.getState()

    // Only attempt reconnect if user was in an active session
    if (matchPhase !== 'idle') {
      addNotification('Connection lost — reconnecting…', 'warn')
      scheduleReconnect()
    }
  }
}

function scheduleReconnect() {
  if (isReconnecting) return
  isReconnecting = true

  const attempt = async () => {
    const session = getSession()
    if (!session) {
      console.log('[Reconnect] No session, aborting')
      isReconnecting = false
      return
    }

    try {
      await connectSocket(session)
      retryCount = 0
      isReconnecting = false
      const { addNotification } = useStore.getState()
      addNotification('Reconnected!', 'info')
      console.log('[Reconnect] Success')
    } catch (err) {
      retryCount++
      if (retryCount > MAX_RETRIES) {
        console.error('[Reconnect] Max retries exceeded')
        const { addNotification } = useStore.getState()
        addNotification('Could not reconnect. Please refresh the page.', 'error')
        isReconnecting = false
        return
      }
      const delay = getDelay()
      console.log(`[Reconnect] Retry ${retryCount}/${MAX_RETRIES} in ${delay}ms`)
      retryTimer = setTimeout(attempt, delay)
    }
  }

  retryTimer = setTimeout(attempt, getDelay())
}

export function cancelReconnect() {
  if (retryTimer) clearTimeout(retryTimer)
  isReconnecting = false
  retryCount = 0
}
