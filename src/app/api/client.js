const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

async function parseErrorMessage(response) {
  try {
    const body = await response.json()
    return body?.message || `Request failed: ${response.status}`
  } catch {
    return `Request failed: ${response.status}`
  }
}

export async function apiGet(path) {
  const response = await fetch(`${API_BASE_URL}${path}`)

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return response.json()
}

export async function apiPost(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return response.json()
}

export function getNavMenu() {
  return apiGet('/api/navmenu')
}

export function login(credentials) {
  return apiPost('/api/login', credentials)
}
