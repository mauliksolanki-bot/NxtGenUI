import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearNavMenuCache, getNavMenu, logout } from '../api/client.js'
import Logo from '../components/Logo.jsx'
import { clearSession, getAuthToken, getSession } from '../auth/session.js'
import { useToast } from '../components/toast/ToastProvider.jsx'
import { toSafeUserMessage } from '../utils/toSafeUserMessage.js'
import './AppShell.css'

const NAV_ICONS = {
  DASHBOARD: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4h7v7H4zm9 0h7v4h-7zM4 13h4v7H4zm6 3h10v4H10z" />
      </svg>
  ),
  SERVICE_CATALOG: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 4h14a1 1 0 0 1 1 1v14l-4-2-4 2-4-2-4 2V5a1 1 0 0 1 1-1z" />
      </svg>
  ),
  INCIDENTS: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 2 21h20L12 3zm1 13h-2v-2h2zm0-4h-2v-4h2z" />
      </svg>
  ),
  REQUESTS: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 4h9l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm8 1.5V10h4.5" />
      </svg>
  ),
  ADMINISTRATION: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2 4 5v6c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10V5l-8-3zm0 4.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6zM7 17.2c.6-2 2.7-3.2 5-3.2s4.4 1.2 5 3.2a8.7 8.7 0 0 1-10 0z" />
      </svg>
  ),
  DEFAULT: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5h14v14H5z" />
      </svg>
  ),
}

function NavMenuItem({ item, level = 0 }) {
  const label = item.menuDisplayName || item.menuName
  const icon = level === 0 ? NAV_ICONS[item.menuCode] || NAV_ICONS.DEFAULT : null
  const hasChildren = Array.isArray(item.children) && item.children.length > 0
  const className = level === 0 ? 'nav-link' : 'nav-link nav-link-child'
  const isHome = item.menuUrl === '/dashboard'
  const [isExpanded, setIsExpanded] = useState(false)
  const content = (
      <>
        {icon ? <span className="nav-icon">{icon}</span> : null}
        <span className="nav-label">{label}</span>
      </>
  )

  return (
      <div className={level === 0 ? 'nav-group' : 'nav-branch'} key={item.id}>
        <div className="nav-link-row">
          {item.menuUrl ? (
              <NavLink
                  to={item.menuUrl}
                  end={isHome}
                  className={({ isActive }) => (isActive ? `${className} active` : className)}
              >
                {content}
              </NavLink>
          ) : (
              <div
                  className={`${className} ${hasChildren ? '' : 'nav-link-static'}`}
                  role={hasChildren ? 'button' : undefined}
                  tabIndex={hasChildren ? 0 : undefined}
                  onClick={hasChildren ? () => setIsExpanded((value) => !value) : undefined}
                  onKeyDown={
                    hasChildren
                        ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setIsExpanded((value) => !value)
                          }
                        }
                        : undefined
                  }
              >
                {content}
              </div>
          )}
          {hasChildren ? (
              <button
                  type="button"
                  className={`nav-toggle ${isExpanded ? 'nav-toggle-open' : ''}`}
                  onClick={() => setIsExpanded((value) => !value)}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${label}`}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5l8 7-8 7" />
                </svg>
              </button>
          ) : null}
        </div>
        {hasChildren && isExpanded ? (
            <div className="nav-children">
              {item.children.map((child) => (
                  <NavMenuItem key={child.id} item={child} level={level + 1} />
              ))}
            </div>
        ) : null}
      </div>
  )
}

export default function AppShell() {
  const toast = useToast()
  const navigate = useNavigate()
  const [navItems, setNavItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadNavMenu() {
      try {
        const items = await getNavMenu(getAuthToken())
        if (isMounted) {
          setNavItems(items)
          setError('')
        }
      } catch (requestError) {
        const safeMessage = toSafeUserMessage('Navigation menu is unavailable right now.')
        if (isMounted) {
          setError(safeMessage)
          toast.error(safeMessage)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadNavMenu()

    return () => {
      isMounted = false
    }
  }, [])

  const navContent = useMemo(() => {
    if (isLoading) {
      return <p className="nav-status">Loading menu...</p>
    }

    if (error) {
      return <p className="nav-status nav-status-error">{error}</p>
    }

    return navItems.map((item) => <NavMenuItem key={item.id} item={item} />)
  }, [error, isLoading, navItems])

  async function handleLogout() {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)
    const token = getAuthToken()

    try {
      if (token) {
        await logout(token)
      }
    } catch {
      // Best-effort server-side invalidation; proceed with client-side logout regardless.
    } finally {
      clearSession()
      clearNavMenuCache()
      setIsLoggingOut(false)
      toast.success(toSafeUserMessage('You have been logged out successfully.'))
      navigate('/login', { replace: true })
    }
  }

  return (
      <div className="app-shell">
        <header className="app-header">
          <div className="brand">
            <Logo size={32} inverted />
          </div>
          <form className="global-search" onSubmit={(event) => event.preventDefault()}>
            <input type="search" placeholder="Search" disabled aria-label="Global search" />
          </form>
          <div className="header-actions">
          <span className="user-chip">
            {getSession()?.displayName ?? getSession()?.username ?? 'Guest'}
          </span>
            <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
                disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </header>
        <div className="app-body">
          <nav className="app-nav" aria-label="Application navigator">
            {navContent}
          </nav>
          <main className="app-main">
            <Outlet />
          </main>
        </div>
      </div>
  )
}
