import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Grid from '../../../components/grid/Grid.jsx'
import GridToolbar from '../../../components/grid/GridToolbar.jsx'
import ConfirmPopup from '../../../components/popup/ConfirmPopup.jsx'
import { clearGridCache, deleteUser, unlockUser } from '../../../api/client.js'
import { getAuthToken } from '../../../auth/session.js'
import { useToast } from '../../../components/toast/ToastProvider.jsx'
import { toSafeUserMessage } from '../../../utils/toSafeUserMessage.js'
import './UsersPage.css'

const USERS_GRID_NAME = 'USERS_GRID'
const COLUMN_LABELS = { emplNm: 'Employee name', username: 'Username', emailAddress: 'Email address', actvFlag: 'Active', isLocked: 'Locked', lastLoginDate: 'Last login date', actions: 'Actions', id: 'ID' }
const columnLabel = (column) => COLUMN_LABELS[column.dataField] || column.columnName

export default function UsersPage() {
    const navigate = useNavigate()
    const toast = useToast()
    const [userPendingDeletion, setUserPendingDeletion] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isUnlocking, setIsUnlocking] = useState(false)
    const [refreshToken, setRefreshToken] = useState(0)
    const [config, setConfig] = useState(null)
    const [searchField, setSearchField] = useState('emplNm')
    const [query, setQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState('')
    const [lockedFilter, setLockedFilter] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [showColumns, setShowColumns] = useState(false)
    const [hiddenFields, setHiddenFields] = useState([])
    const columns = (config?.columns ?? []).filter((column) => !column.hidden).map((column) => ({ ...column, columnName: columnLabel(column) }))

    function resetFilters() { setQuery(''); setActiveFilter(''); setLockedFilter('') }
    function refresh() { clearGridCache(USERS_GRID_NAME); setRefreshToken((value) => value + 1) }
    function filterRows(rows) {
        const search = query.trim().toLocaleLowerCase()
        return rows.filter((row) => (!search || String(typeof row[searchField] === 'boolean' ? row[searchField] ? 'Yes' : 'No' : row[searchField] ?? '').toLocaleLowerCase().includes(search))
            && (!activeFilter || String(row.actvFlag) === activeFilter)
            && (!lockedFilter || String(row.isLocked) === lockedFilter))
    }
    function renderCell(row, column) {
        if (column.dataField === 'emplNm' || column.dataField === 'username') return <Link className="users-record-link" to={`/administration/edituser/${row.id}`}>{row[column.dataField]}</Link>
        if (column.dataField === 'actvFlag' || column.dataField === 'isLocked') {
            const value = row[column.dataField] === true
            return <span className="users-grid-status"><span aria-hidden="true" className={`users-status-dot ${column.dataField === 'isLocked' ? value ? 'is-warning' : 'is-neutral' : value ? 'is-active' : 'is-neutral'}`} />{value ? 'Yes' : 'No'}</span>
        }
        return row[column.dataField] === '' || row[column.dataField] == null ? '—' : String(row[column.dataField])
    }

    async function handleUnlock(row) {
        if (isUnlocking) {
            return
        }

        setIsUnlocking(true)

        try {
            await unlockUser(row.id, getAuthToken())
            clearGridCache(USERS_GRID_NAME)
            setRefreshToken((value) => value + 1)
            toast.success(toSafeUserMessage('User unlocked successfully.'))
        } catch {
            toast.error(toSafeUserMessage('Unable to unlock user right now.'))
        } finally {
            setIsUnlocking(false)
        }
    }

    function handleDeleteClick(row) {
        setUserPendingDeletion(row)
    }

    function handleCancelDelete() {
        if (isDeleting) {
            return
        }
        setUserPendingDeletion(null)
    }

    async function handleConfirmDelete() {
        if (!userPendingDeletion) {
            return
        }

        setIsDeleting(true)

        try {
            await deleteUser(userPendingDeletion.id, getAuthToken())
            clearGridCache(USERS_GRID_NAME)
            setRefreshToken((value) => value + 1)
            toast.success(toSafeUserMessage('User deleted successfully.'))
            setUserPendingDeletion(null)
        } catch {
            toast.error(toSafeUserMessage('Unable to delete user right now.'))
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <section className="users-record-page">
            <GridToolbar title="Users" columns={columns.filter((column) => column.filterable).length ? columns.filter((column) => column.filterable) : [{ dataField: 'emplNm', columnName: 'Employee name' }]}
                searchField={searchField} onSearchFieldChange={setSearchField} query={query} onQueryChange={setQuery}
                onRefresh={refresh} onToggleFilters={() => setShowFilters((value) => !value)} filtersExpanded={showFilters}
                onToggleColumns={() => setShowColumns((value) => !value)} columnsExpanded={showColumns}
                createLabel="Create User" onCreate={() => navigate('/administration/createuser')} />
            <div className="grid-list-breadcrumb"><button type="button" onClick={resetFilters}>All</button><span>› Users</span>
                {activeFilter ? <><span>›</span><button type="button" onClick={() => setActiveFilter('')}>Active = {activeFilter === 'true' ? 'Yes' : 'No'} ×</button></> : null}
                {lockedFilter ? <><span>›</span><button type="button" onClick={() => setLockedFilter('')}>Locked = {lockedFilter === 'true' ? 'Yes' : 'No'} ×</button></> : null}
                {query ? <><span>›</span><span>{columns.find((column) => column.dataField === searchField)?.columnName || 'Employee name'} contains “{query}”</span></> : null}
            </div>
            {showFilters ? <div className="grid-list-filter-panel">
                <label>Active <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}><option value="">All</option><option value="true">Yes</option><option value="false">No</option></select></label>
                <label>Locked <select value={lockedFilter} onChange={(event) => setLockedFilter(event.target.value)}><option value="">All</option><option value="true">Yes</option><option value="false">No</option></select></label>
                <button type="button" onClick={resetFilters}>Clear filters</button>
            </div> : null}
            {showColumns ? <fieldset className="grid-list-column-panel"><legend>Visible columns</legend>{columns.map((column) => <label key={column.id}><input type="checkbox" checked={!hiddenFields.includes(column.dataField)} disabled={column.dataField === 'emplNm' || column.dataField === 'actions'}
                onChange={(event) => setHiddenFields((previous) => event.target.checked ? previous.filter((field) => field !== column.dataField) : [...previous, column.dataField])} />{column.columnName}</label>)}</fieldset> : null}
            <Grid
                gridName={USERS_GRID_NAME}
                variant="record"
                onConfigLoaded={setConfig}
                filterRows={filterRows}
                hiddenFields={hiddenFields}
                renderCell={renderCell}
                getColumnLabel={columnLabel}
                defaultSort={{ field: 'emplNm', direction: 'asc' }}
                refreshToken={refreshToken}
                renderActions={(row) =>
                    row.isLocked === true ? (
                        <button
                            type="button"
                            className="grid-action-button"
                            title="Unlock"
                            aria-label="Unlock"
                            disabled={isUnlocking}
                            onClick={() => handleUnlock(row)}
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V7a3 3 0 0 0-6 0z" />
                            </svg>
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="grid-action-button"
                                title="Edit"
                                aria-label="Edit"
                                onClick={() => navigate(`/administration/edituser/${row.id}`)}
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M4 20.5h4.5l10-10-4.5-4.5-10 10zm13.3-13.3 1.7-1.7a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-1.7 1.7z" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                className="grid-action-button grid-action-button-danger"
                                title="Delete"
                                aria-label="Delete"
                                onClick={() => handleDeleteClick(row)}
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M9 3h6l1 2h4v2H4V5h4zM6 9h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2zm4 3v7h2v-7zm4 0v7h2v-7z" />
                                </svg>
                            </button>
                        </>
                    )
                }
            />
            {userPendingDeletion ? (
                <ConfirmPopup
                    popupName="DELETE_USER_CONFIRM"
                    fallbackTitle="Delete User"
                    fallbackMessage="Are you sure you want to delete this user?"
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                    isBusy={isDeleting}
                />
            ) : null}
        </section>
    )
}
