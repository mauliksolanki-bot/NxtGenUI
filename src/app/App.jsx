import { Navigate, Route, Routes } from 'react-router-dom'
import RequireSession from './auth/RequireSession.jsx'
import AppShell from './layout/AppShell.jsx'
import HomePage from './pages/home/HomePage.jsx'
import LoginPage from './pages/login/LoginPage.jsx'
import PlaceholderPage from './pages/placeholder/PlaceholderPage.jsx'
import UsersPage from './pages/administration/users/UsersPage.jsx'
import RolesPage from './pages/administration/roles/RolesPage.jsx'
import GroupsPage from './pages/administration/groups/GroupsPage.jsx'
import CreateUserPage from './pages/administration/createuser/CreateUserPage.jsx'
import EditUserPage from './pages/administration/edituser/EditUserPage.jsx'
import CreateRolePage from './pages/administration/createrole/CreateRolePage.jsx'
import CreateGroupPage from './pages/administration/creategroup/CreateGroupPage.jsx'
import EditGroupPage from './pages/administration/editgroup/EditGroupPage.jsx'
import ServiceCatalogPage from './pages/catalog/ServiceCatalogPage.jsx'
import ServiceSubcategoryPage from './pages/catalog/ServiceSubcategoryPage.jsx'

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
                <Route path="/service-catalog" element={<ServiceCatalogPage />} />
                <Route path="/service-catalog/:categorySlug" element={<ServiceSubcategoryPage />} />
                <Route
                    path="/service-catalog/:categorySlug/:subcategorySlug"
                    element={<PlaceholderPage title="Request Form" />}
                />
                <Route path="/knowledge" element={<PlaceholderPage title="Knowledge" />} />
                <Route path="/requests" element={<PlaceholderPage title="Requests" />} />
                <Route path="/cmdb/ciclasses" element={<PlaceholderPage title="CI Classes" />} />
                <Route path="/cmdb/cirelationships" element={<PlaceholderPage title="CI Relationships" />} />
                <Route path="/cmdb/cidata" element={<PlaceholderPage title="CI Data" />} />
                <Route path="/administration/users" element={<UsersPage />} />
                <Route path="/administration/roles" element={<RolesPage />} />
                <Route path="/administration/groups" element={<GroupsPage />} />
                <Route path="/administration/createuser" element={<CreateUserPage />} />
                <Route path="/administration/edituser/:id" element={<EditUserPage />} />
                <Route path="/administration/createrole" element={<CreateRolePage />} />
                <Route path="/administration/creategroup" element={<CreateGroupPage />} />
                <Route path="/administration/editgroup/:id" element={<EditGroupPage />} />
            </Route>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    )
}
