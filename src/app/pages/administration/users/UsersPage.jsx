import Grid from '../../../components/grid/Grid.jsx'

export default function UsersPage() {
    return (
        <section>
            <h1>Users</h1>
            <Grid
                gridName="USERS_GRID"
                renderActions={() => (
                    <>
                        <button type="button" className="grid-action-button" title="Edit" aria-label="Edit">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M4 20.5h4.5l10-10-4.5-4.5-10 10zm13.3-13.3 1.7-1.7a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-1.7 1.7z" />
                            </svg>
                        </button>
                        <button type="button" className="grid-action-button" title="Lock" aria-label="Lock">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V7a3 3 0 0 0-6 0z" />
                            </svg>
                        </button>
                    </>
                )}
            />
        </section>
    )
}
