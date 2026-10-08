import { useNavigate } from 'react-router-dom'
import Grid from '../../../components/grid/Grid.jsx'
import '../users/UsersPage.css'

const GROUPS_TEAMS_GRID_NAME = 'NXTGEN_GRP_TEAMS'

export default function GroupsPage() {
    const navigate = useNavigate()

    return (
        <section>
            <div className="page-header-row">
                <h1>Groups &amp; Teams</h1>
                <button
                    type="button"
                    className="create-user-button"
                    onClick={() => navigate('/administration/creategroup')}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M15 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 20a7 7 0 0 1 11-5.7V16h-1a2 2 0 0 0-2 2v2H6a2 2 0 0 1-2-2zm15-3h2v2h2v2h-2v2h-2v-2h-2v-2h2z" />
                    </svg>
                    Create Group
                </button>
            </div>
            <Grid
                gridName={GROUPS_TEAMS_GRID_NAME}
                renderActions={(row) => (
                    <>
                        <button
                            type="button"
                            className="grid-action-button"
                            title="Edit"
                            aria-label="Edit"
                            onClick={() => navigate(`/administration/editgroup/${row.id}`)}
                        >
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
