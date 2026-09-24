import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api`
const TOKEN_KEY = 'northstarToken'
const USER_KEY = 'northstarUser'
const AuthContext = createContext(null)

function readStoredUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
}

async function requestAuth(path, email, password, inviteCode) {
  const response = await fetch(`${API_URL}/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, ...(inviteCode ? { inviteCode } : {}) }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Unable to complete authentication.')
  return data
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readStoredUser)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) { setIsLoading(false); return undefined }

    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${storedToken}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Session expired')
        const currentUser = await response.json()
        if (!currentUser.couple) {
          const coupleResponse = await fetch(`${API_URL}/couple`, { headers: { Authorization: `Bearer ${storedToken}` } })
          if (coupleResponse.ok) currentUser.couple = await coupleResponse.json()
        }
        const refreshedToken = currentUser.token || storedToken
        setToken(refreshedToken)
        setUser(currentUser)
        localStorage.setItem(TOKEN_KEY, refreshedToken)
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser))
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))

    return undefined
  }, [])

  async function authenticate(path, email, password, inviteCode) {
    const data = await requestAuth(path, email, password, inviteCode)
    setToken(data.token)
    const sessionUser = { ...data.user, couple: data.couple }
    setUser(sessionUser)
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(sessionUser))
    return data
  }

  async function login(email, password, inviteCode) { return authenticate('login', email, password, inviteCode) }
  async function signup(email, password, inviteCode) { return authenticate('signup', email, password, inviteCode) }
  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  function updateUser(nextUser, nextToken = token) {
    const mergedUser = { ...user, ...nextUser }
    setUser(mergedUser)
    setToken(nextToken)
    localStorage.setItem(USER_KEY, JSON.stringify(mergedUser))
    localStorage.setItem(TOKEN_KEY, nextToken)
  }

  function updateCouple(nextCouple) {
    const mergedUser = { ...user, couple: { ...user?.couple, ...nextCouple } }
    setUser(mergedUser)
    localStorage.setItem(USER_KEY, JSON.stringify(mergedUser))
  }

  const value = useMemo(() => ({ token, user, isLoading, login, signup, logout, updateUser, updateCouple }), [token, user, isLoading, updateUser, updateCouple])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
