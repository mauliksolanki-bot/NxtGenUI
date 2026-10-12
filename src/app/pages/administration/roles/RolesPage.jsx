import { useNavigate } from 'react-router-dom'
import AdminRecordGrid from '../../../components/grid/AdminRecordGrid.jsx'

const ROLES_GRID_NAME = 'ROLES_GRID'

export default function RolesPage() {
    const navigate = useNavigate()

    return (
            <AdminRecordGrid
                title="Roles"
                gridName={ROLES_GRID_NAME}
                columnLabels={{ id: 'Role ID', roleName: 'Name', description: 'Description', isActive: 'Active', actions: 'Actions' }}
                nameField="roleName"
                descriptionField="description"
                createLabel="Add Role"
                onCreate={() => navigate('/administration/createrole')}
                renderActions={() => (
                    <>
                        <button type="button" className="grid-action-button" title="Edit" aria-label="Edit">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M4 20.5h4.5l10-10-4.5-4.5-10 10zm13.3-13.3 1.7-1.7a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-1.7 1.7z" />
                            </svg>
                        </button>
                    </>
                )}
            />
    )
}
