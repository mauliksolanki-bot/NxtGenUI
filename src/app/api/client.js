const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

async function parseErrorBody(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function buildHttpError(body, status) {
  const error = new Error(body?.message || `Request failed: ${status}`)
  error.details = body
  return error
}

function buildAuthHeader(token) {
  return { Authorization: ['Bearer', token].join(' ') }
}

export async function apiGet(path, options = {}) {
  const authHeaders = options.token ? buildAuthHeader(options.token) : {}
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: authHeaders, cache: 'no-store' })

  if (!response.ok) {
    throw buildHttpError(await parseErrorBody(response), response.status)
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
    throw buildHttpError(await parseErrorBody(response), response.status)
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

const gridConfigRequests = new Map()
const gridDataRequests = new Map()

// De-dupes concurrent/duplicate calls per gridName (e.g. React StrictMode
// double-invoking effects in development) while still refetching fresh data
// every time a grid is (re)mounted/visited, by clearing the cache entry once
// the in-flight request settles (success or failure) rather than leaving the
// resolved promise cached forever.
export function getGridConfig(gridName, token) {
  if (!gridConfigRequests.has(gridName)) {
    const request = apiGet(`/api/gridconfig?gridName=${encodeURIComponent(gridName)}`, { token })
    gridConfigRequests.set(
        gridName,
        request.finally(() => {
          gridConfigRequests.delete(gridName)
        })
    )
  }

  return gridConfigRequests.get(gridName)
}

export function getGridData(gridName, token) {
  if (!gridDataRequests.has(gridName)) {
    const request = apiGet(`/api/griddata?gridName=${encodeURIComponent(gridName)}`, { token })
    gridDataRequests.set(
        gridName,
        request.finally(() => {
          gridDataRequests.delete(gridName)
        })
    )
  }

  return gridDataRequests.get(gridName)
}

export function clearGridCache(gridName) {
  if (gridName) {
    gridConfigRequests.delete(gridName)
    gridDataRequests.delete(gridName)
    return
  }

  gridConfigRequests.clear()
  gridDataRequests.clear()
}

export function getFormConfig(formName, token) {
  return apiGet(`/api/formconfig?formName=${encodeURIComponent(formName)}`, { token })
}

export function validateUserData(payload, token) {
  return apiPost('/api/validateuserdata', payload, { token })
}

export function createNewUser(payload, token) {
  return apiPost('/api/createnewuser', payload, { token })
}

export function deleteUser(id, token) {
  return apiPost(`/api/deleteuser?id=${encodeURIComponent(id)}`, {}, { token })
}

export function getUserById(id, token) {
  return apiGet(`/api/getuserbyid?id=${encodeURIComponent(id)}`, { token })
}

export function updateUser(payload, token) {
  return apiPost('/api/updateuser', payload, { token })
}

export function createNewRole(payload, token) {
  return apiPost('/api/createnewrole', payload, { token })
}

export function createGroup(payload, token) {
  return apiPost('/api/creategroup', payload, { token })
}

export function searchGroupOwners(query, token) {
  return apiGet(`/api/searchgroupowners?query=${encodeURIComponent(query)}`, { token })
}

export function searchGroups(query, token) {
  return apiGet(`/api/searchgroups?query=${encodeURIComponent(query)}`, { token })
}

export function getGroupById(id, token) {
  return apiGet(`/api/getgroupbyid?id=${encodeURIComponent(id)}`, { token })
}

export function updateGroup(payload, token) {
  return apiPost('/api/updategroup', payload, { token })
}

export function searchUserDetails(query, token) {
  return apiGet(`/api/searchuserdetails?query=${encodeURIComponent(query)}`, { token })
}

export function fetchUserDetails(id, token) {
  return apiGet(`/api/fetchuserdetails?id=${encodeURIComponent(id)}`, { token })
}

const popupConfigRequests = new Map()

// De-dupes concurrent/duplicate calls per popupName (e.g. React StrictMode
// double-invoking effects in development) so each popup is only fetched once at a time.
export function getPopupConfig(popupName, token) {
  if (!popupConfigRequests.has(popupName)) {
    const request = apiGet(`/api/popupconfig?popupName=${encodeURIComponent(popupName)}`, { token })
    popupConfigRequests.set(
        popupName,
        request.finally(() => {
          popupConfigRequests.delete(popupName)
        })
    )
  }

  return popupConfigRequests.get(popupName)
}
