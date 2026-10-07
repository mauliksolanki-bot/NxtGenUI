const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

async function parseErrorMessage(response) {
  try {
    const body = await response.json()
    return body?.message || `Request failed: ${response.status}`
  } catch {
    return `Request failed: ${response.status}`
  }
}

function buildAuthHeader(token) {
  return { Authorization: ['Bearer', token].join(' ') }
}

export async function apiGet(path, options = {}) {
  const authHeaders = options.token ? buildAuthHeader(options.token) : {}
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: authHeaders })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return response.json()
}

export async function apiPost(path, body, options = {}) {
  const authHeaders = options.token ? buildAuthHeader(options.token) : {}
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(body ?? {}),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return response.json()
}

let navMenuRequest = null

// De-dupes concurrent/duplicate calls (e.g. React StrictMode double-invoking
// effects in development) so the nav menu is only ever fetched once at a time.
export function getNavMenu(token) {
  if (!navMenuRequest) {
    navMenuRequest = apiGet('/api/navmenu', { token }).catch((error) => {
      navMenuRequest = null
      throw error
    })
  }

  return navMenuRequest
}

export function clearNavMenuCache() {
  navMenuRequest = null
}

export function login(credentials) {
  return apiPost('/api/login', credentials)
}

export function logout(token) {
  return apiPost('/api/logout', {}, { token })
}
