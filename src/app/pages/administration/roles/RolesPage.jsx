import { useNavigate } from 'react-router-dom'
import Grid from '../../../components/grid/Grid.jsx'
import '../users/UsersPage.css'

const ROLES_GRID_NAME = 'ROLES_GRID'

export default function RolesPage() {
    const navigate = useNavigate()

    return (
        <section>
            <div className="page-header-row">
                <h1>Roles</h1>
                <button
                    type="button"
                    className="create-user-button"
                    onClick={() => navigate('/administration/createrole')}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M15 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 20a7 7 0 0 1 11-5.7V16h-1a2 2 0 0 0-2 2v2H6a2 2 0 0 1-2-2zm15-3h2v2h2v2h-2v2h-2v-2h-2v-2h2z" />
                    </svg>
                    Add Role
                </button>
            </div>
            <Grid
                gridName={ROLES_GRID_NAME}
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
        </section>
    )
}
