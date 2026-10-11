import { Link } from 'react-router-dom'
import './NotAuthorizedPage.css'

export default function NotAuthorizedPage() {
  return (
      <section className="not-authorized">
        <div className="not-authorized-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 2 4 5v6c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10V5l-8-3zm1 13h-2v-2h2zm0-4h-2V7h2z" />
          </svg>
        </div>
        <h1 className="not-authorized-title">Access Denied</h1>
        <p className="not-authorized-message">
          You are not authorized to view this page. If you believe you should have access, please contact your
          administrator.
        </p>
        <Link className="not-authorized-link" to="/dashboard">
          Go to Dashboard
        </Link>
      </section>
  )
}
