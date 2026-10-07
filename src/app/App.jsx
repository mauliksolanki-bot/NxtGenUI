import { Navigate, Route, Routes } from 'react-router-dom'
import RequireSession from './auth/RequireSession.jsx'
import AppShell from './layout/AppShell.jsx'
import HomePage from './pages/home/HomePage.jsx'
import LoginPage from './pages/login/LoginPage.jsx'
import PlaceholderPage from './pages/placeholder/PlaceholderPage.jsx'
import UsersPage from './pages/administration/users/UsersPage.jsx'
import CreateUserPage from './pages/administration/createuser/CreateUserPage.jsx'

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
                <Route path="/dashboard" element={<HomePage />} />
                <Route path="/incidents" element={<PlaceholderPage title="Incidents" />} />
                <Route path="/catalog" element={<PlaceholderPage title="Service Catalog" />} />
                <Route path="/knowledge" element={<PlaceholderPage title="Knowledge" />} />
                <Route path="/requests" element={<PlaceholderPage title="Requests" />} />
                <Route path="/administration/users" element={<UsersPage />} />
                <Route path="/administration/createuser" element={<CreateUserPage />} />
            </Route>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    )
}
