import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { getSession, setSession } from '../auth/session.js'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const existingSession = getSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const destination = location.state?.from?.pathname || '/home'

  const year = useMemo(() => new Date().getFullYear(), [])

  if (existingSession) {
    return <Navigate to={destination} replace />
  }

  function handleSubmit(event) {
    event.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Enter your work email and password to continue.')
      return
    }

    setError('')
    setSession({
      email: trimmedEmail,
      remember,
    })
    navigate(destination, { replace: true })
  }

  return (
    <div className="login-screen">
      <section className="login-showcase" aria-label="NxtGen introduction">
        <div className="login-aurora" aria-hidden="true" />
        <div className="login-grid" aria-hidden="true" />
        <svg className="login-constellation" viewBox="0 0 520 640" aria-hidden="true">
          <defs>
            <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#81B5A1" stopOpacity="0.1" />
              <stop offset="1" stopColor="#81B5A1" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          <path
            d="M80 120 L180 90 L250 170 L360 140 L430 230 L340 300 L390 410 L270 450 L180 380 L90 430 L120 300 Z"
            fill="none"
            stroke="url(#lineGlow)"
            strokeWidth="1.4"
          />
          <circle cx="80" cy="120" r="4" fill="#9FD4C2" />
          <circle cx="180" cy="90" r="5" fill="#E8F4EF" />
          <circle cx="250" cy="170" r="4" fill="#81B5A1" />
          <circle cx="360" cy="140" r="6" fill="#C9F0E3" />
          <circle cx="430" cy="230" r="4" fill="#9FD4C2" />
          <circle cx="340" cy="300" r="5" fill="#E8F4EF" />
          <circle cx="390" cy="410" r="4" fill="#81B5A1" />
          <circle cx="270" cy="450" r="6" fill="#C9F0E3" />
          <circle cx="180" cy="380" r="4" fill="#9FD4C2" />
          <circle cx="90" cy="430" r="5" fill="#E8F4EF" />
          <circle cx="120" cy="300" r="4" fill="#81B5A1" />
        </svg>

        <div className="showcase-content">
          <Logo size={48} inverted />
          <p className="eyebrow">Enterprise service workspace</p>
          <h1>
            Clarity for every
            <span> request, incident, and change.</span>
          </h1>
          <p className="lede">
            NxtGen brings catalog, knowledge, and operations into one composed
            workspace — designed for teams who need speed without losing control.
          </p>

          <ul className="showcase-pills">
            <li>Service Catalog</li>
            <li>Incident Flow</li>
            <li>Knowledge Graph</li>
          </ul>
        </div>

        <figure className="floating-card card-one">
          <span className="card-kicker">INC0001842</span>
          <strong>VPN access restored</strong>
          <em>Priority 2 · Assigned</em>
        </figure>
        <figure className="floating-card card-two">
          <span className="card-kicker">Catalog</span>
          <strong>Laptop refresh</strong>
          <em>Awaiting approval</em>
        </figure>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-brand">
            <Logo size={36} />
          </div>
          <h2>Sign in to NxtGen</h2>
          <p className="login-subtitle">Use your organization account to open the workspace.</p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {error ? (
              <p className="login-error" role="alert">
                {error}
              </p>
            ) : null}

            <label htmlFor="email">Work email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="you@nxtgen.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="ghost-toggle"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="login-row">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                Keep me signed in
              </label>
              <span className="quiet-link">Forgot password</span>
            </div>

            <button type="submit" className="sign-in">
              Continue
            </button>
          </form>

          <p className="login-footnote">
            Access is limited to authorized NxtGen users. Sessions stay on this
            device until you close the browser.
          </p>
        </div>

        <p className="login-legal">© {year} NxtGen · Secure service platform</p>
      </section>
    </div>
  )
}
