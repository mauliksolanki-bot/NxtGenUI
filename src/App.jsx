import { Navigate, Route, Routes } from 'react-router-dom'
import RequireSession from './auth/RequireSession.jsx'
import AppShell from './layout/AppShell.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireSession>
            <AppShell />
          </RequireSession>
        }
      >
        <Route path="/home" element={<HomePage />} />
        <Route path="/incidents" element={<PlaceholderPage title="Incidents" />} />
        <Route path="/catalog" element={<PlaceholderPage title="Service Catalog" />} />
        <Route path="/knowledge" element={<PlaceholderPage title="Knowledge" />} />
        <Route path="/requests" element={<PlaceholderPage title="Requests" />} />
        <Route path="/admin" element={<PlaceholderPage title="Admin" />} />
      </Route>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
