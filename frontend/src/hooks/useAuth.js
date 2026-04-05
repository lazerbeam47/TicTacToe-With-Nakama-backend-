// hooks/useAuth.js — Device-based authentication + socket + reconnect
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authenticateDevice, connectSocket } from '@/lib/nakama'
import { initReconnectHandler, cancelReconnect } from '@/lib/reconnect'
import { clearSession } from '@/lib/nakama'
import { useStore } from '@/lib/store'

const DEVICE_ID_KEY = 'lila_device_id'
const USERNAME_KEY  = 'lila_username'

function getOrCreateDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

export function useAuth() {
  const { setSession, setUsername, setDeviceId, session } = useStore()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const navigate = useNavigate()



  async function login(username) {
    setLoading(true)
    setError(null)
    try {
      const baseId = getOrCreateDeviceId()
      const deviceId = baseId + '-' + username.trim().toLowerCase()
      const cleanName = username.trim().slice(0, 20) || `Player_${deviceId.slice(0, 6)}`

      const newSession = await authenticateDevice(deviceId, cleanName)
      await connectSocket(newSession)

      // Set up reconnect handler after initial connect
      initReconnectHandler()

      setSession(newSession)
      setUsername(cleanName)
      setDeviceId(deviceId)
      localStorage.setItem(USERNAME_KEY, cleanName)

      navigate('/')
    } catch (err) {
      console.error('Auth error:', err)
      setError(err.message || 'Failed to connect. Check your server.')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    cancelReconnect()
    clearSession()
    localStorage.removeItem(USERNAME_KEY)
    setSession(null)
    navigate('/login')
  }

  // Restore session on refresh for the last logged-in user
  useEffect(() => {
    const savedName = localStorage.getItem(USERNAME_KEY)
    if (savedName && !session) {
      login(savedName)
    }
  }, [])

  return { login, logout, loading, error, session }
}
