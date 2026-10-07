import { NavLink, Outlet } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { getSession } from '../auth/session.js'
import './AppShell.css'

const NAV_ITEMS = [
  { to: '/home', label: 'Home', end: true },
  { to: '/incidents', label: 'Incidents' },
  { to: '/catalog', label: 'Service Catalog' },
  { to: '/knowledge', label: 'Knowledge' },
  { to: '/requests', label: 'Requests' },
  { to: '/admin', label: 'Admin' },
]

export default function AppShell() {
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
          <span className="user-chip">{getSession()?.email ?? 'Guest'}</span>
        </div>
      </header>
      <div className="app-body">
        <nav className="app-nav" aria-label="Application navigator">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
