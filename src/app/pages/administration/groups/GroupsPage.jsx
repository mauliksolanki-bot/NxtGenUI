import { useNavigate } from 'react-router-dom'
import AdminRecordGrid from '../../../components/grid/AdminRecordGrid.jsx'

const GROUPS_TEAMS_GRID_NAME = 'NXTGEN_GRP_TEAMS'

export default function GroupsPage() {
    const navigate = useNavigate()

    return (
            <AdminRecordGrid
                title="Groups & Teams"
                gridName={GROUPS_TEAMS_GRID_NAME}
                columnLabels={{ id: 'ID', grpName: 'Group name', grpDescription: 'Description', groupOwner: 'Owner', isActive: 'Active', actions: 'Actions' }}
                nameField="grpName"
                descriptionField="grpDescription"
                createLabel="Create Group"
                onCreate={() => navigate('/administration/creategroup')}
                editPath={(row) => `/administration/editgroup/${row.id}`}
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
    )
}
