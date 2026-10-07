import { Navigate, useLocation } from 'react-router-dom'
import { getSession } from './session.js'

export default function RequireSession({ children }) {
  const location = useLocation()

  if (!getSession()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
