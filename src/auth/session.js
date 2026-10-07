const SESSION_KEY = 'nxtgen-session'

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}
