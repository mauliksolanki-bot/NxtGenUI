import { useCallback, useEffect, useRef, useState } from 'react'
import Grid from '../../components/grid/Grid.jsx'
import GridToolbar from '../../components/grid/GridToolbar.jsx'
import { getServiceRequestApprovers, updateServiceRequestApprover } from '../../api/client.js'
import { getAuthToken } from '../../auth/session.js'
import { useToast } from '../../components/toast/ToastProvider.jsx'
import { toSafeUserMessage } from '../../utils/toSafeUserMessage.js'
import '../../components/popup/ConfirmPopup.css'
import './ApproversList.css'

const SEARCH_FIELDS = [
    { dataField: 'state', columnName: 'State' }, { dataField: 'approver', columnName: 'Approver' },
    { dataField: 'comments', columnName: 'Comments' }, { dataField: 'createdAt', columnName: 'Created' },
]

function EmptyApprovers() {
    return <div className="sr-approvers-empty"><svg viewBox="0 0 160 125" aria-hidden="true">
        <ellipse cx="80" cy="112" rx="65" ry="5" fill="#e5eef1" />
        <rect x="20" y="25" width="120" height="85" rx="6" fill="#fff" stroke="#cbdce2" strokeWidth="2" />
        <path d="M20 42h120" stroke="#cbdce2" strokeWidth="2" />
        <circle cx="108" cy="34" r="3" fill="#d6e4e9" /><circle cx="119" cy="34" r="3" fill="#d6e4e9" /><circle cx="130" cy="34" r="3" fill="#d6e4e9" />
        <circle cx="80" cy="75" r="22" fill="#fff" stroke="#56afc3" strokeWidth="5" />
        <text x="80" y="86" textAnchor="middle" fill="#007e9e" fontSize="32">?</text>
    </svg><span>No records to display</span></div>
}

function ApproverEditor({ rows, selected, onClose, onSaved, srId }) {
    const toast = useToast()
    const [row, setRow] = useState(selected)
    const [state, setState] = useState(selected.state)
    const [approver, setApprover] = useState(selected.approver)
    const [comments, setComments] = useState(selected.comments)
    const [busy, setBusy] = useState(false)
    const [errors, setErrors] = useState({})
    const dialogRef = useRef(null)
    const previousFocus = useRef(document.activeElement)

    useEffect(() => {
        dialogRef.current?.showModal()
        return () => { previousFocus.current?.focus() }
    }, [])

    function selectRow(id) {
        const next = rows.find((value) => String(value.id) === id)
        setRow(next); setState(next.state); setApprover(next.approver); setComments(next.comments); setErrors({})
    }
    async function save(event) {
        event.preventDefault()
        if (busy) return
        setBusy(true)
        try {
            await updateServiceRequestApprover(srId, row.id, { state, approver, comments }, getAuthToken())
            toast.success('Approval updated successfully.')
            onSaved()
        } catch (error) {
            setErrors(error?.details?.errors ?? {})
            toast.error(toSafeUserMessage(error?.details?.message ?? 'Unable to update approval right now.'))
        } finally { setBusy(false) }
    }
    const stateOptions = row.state === 'Pending' ? ['Pending', 'Approved', 'Rejected', 'Cancelled'] : [row.state]
    return <dialog ref={dialogRef} className="sr-approver-dialog" aria-labelledby="sr-approver-edit-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}>
        <form onSubmit={save}>
            <h2 id="sr-approver-edit-title">Edit approver</h2>
            <fieldset disabled={busy} className="sr-approver-editor-fields">
                <label>Approval step<select value={row.id} onChange={(event) => selectRow(event.target.value)}>{rows.filter((value) => value.editable).map((value) => <option key={value.id} value={value.id}>{value.level}. {value.approver}</option>)}</select></label>
                <label>State<select value={state} onChange={(event) => setState(event.target.value)}>{stateOptions.map((value) => <option key={value}>{value}</option>)}</select>{errors.state ? <span className="form-field-error">{errors.state}</span> : null}</label>
                <label>Approver<input value={approver} onChange={(event) => setApprover(event.target.value)} maxLength={200} required />{errors.approver ? <span className="form-field-error">{errors.approver}</span> : null}</label>
                <label>Comments<textarea value={comments} onChange={(event) => setComments(event.target.value)} maxLength={10000} rows={4} />{errors.comments ? <span className="form-field-error">{errors.comments}</span> : null}</label>
            </fieldset>
            <div className="sr-approver-dialog-actions"><button type="submit" className="sr-header-btn sr-header-btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button><button type="button" className="sr-header-btn" disabled={busy} onClick={onClose}>Cancel</button></div>
        </form>
    </dialog>
}

export default function ApproversList({ srId, refreshToken, onUpdated }) {
    const [rows, setRows] = useState([])
    const [config, setConfig] = useState(null)
    const [query, setQuery] = useState('')
    const [searchField, setSearchField] = useState('state')
    const [stateFilter, setStateFilter] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [showColumns, setShowColumns] = useState(false)
    const [hiddenFields, setHiddenFields] = useState([])
    const [collapsed, setCollapsed] = useState(false)
    const [reloadKey, setReloadKey] = useState(0)
    const [editing, setEditing] = useState(null)
    const loadData = useCallback((token) => getServiceRequestApprovers(srId, token), [srId])
    const editableRows = rows.filter((row) => row.editable)
    const columns = (config?.columns ?? []).filter((column) => !column.hidden)
    const firstEditable = editableRows.find((row) => row.state === 'Pending') || editableRows[0]

    function clearFilters() { setQuery(''); setStateFilter('') }
    function renderCell(row, column) {
        if (column.dataField === 'state') return row.editable
            ? <button type="button" className="sr-approver-state-link" onClick={() => setEditing(row)}>{row.state}</button> : row.state
        if (column.dataField === 'createdAt') return row.createdAt ? row.createdAt.replace('T', ' ').substring(0, 19) : '—'
        return row[column.dataField] || '—'
    }

    return <div className="sr-related-lists">
        <div className="sr-related-tabs" role="tablist" aria-label="Request related records"><button type="button" id="sr-approvers-tab" className="sr-related-tab" role="tab" aria-selected="true" aria-controls="sr-approvers-panel" onClick={() => setCollapsed(false)}>Approvers</button></div>
        <div className="sr-related-panel" id="sr-approvers-panel" role="tabpanel" aria-labelledby="sr-approvers-tab">
            <GridToolbar title="Approvers" columns={SEARCH_FIELDS} searchField={searchField} onSearchFieldChange={setSearchField}
                query={query} onQueryChange={setQuery} onRefresh={() => setReloadKey((key) => key + 1)}
                onToggleFilters={() => setShowFilters((value) => !value)} filtersExpanded={showFilters}
                onToggleColumns={() => setShowColumns((value) => !value)} columnsExpanded={showColumns}
                createLabel="Edit" onCreate={() => setEditing(firstEditable)} createDisabled={!firstEditable}
                createTitle={firstEditable ? 'Edit approvers' : 'Approval editing is available to administrators on open requests'} />
            <div className="sr-approvers-breadcrumb"><span>Approval for = {srId}</span><button type="button" aria-label={collapsed ? 'Expand approvers' : 'Collapse approvers'} aria-expanded={!collapsed} onClick={() => setCollapsed((value) => !value)}>{collapsed ? '+' : '−'}</button></div>
            {showFilters ? <div className="grid-list-filter-panel"><label>State<select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}><option value="">All</option>{['Pending', 'Not Started', 'Approved', 'Rejected', 'Cancelled'].map((value) => <option key={value}>{value}</option>)}</select></label><button type="button" onClick={clearFilters}>Clear filters</button></div> : null}
            {showColumns ? <fieldset className="grid-list-column-panel"><legend>Visible columns</legend>{columns.map((column) => <label key={column.id}><input type="checkbox" checked={!hiddenFields.includes(column.dataField)} disabled={column.dataField === 'state'} onChange={(event) => setHiddenFields((previous) => event.target.checked ? previous.filter((field) => field !== column.dataField) : [...previous, column.dataField])} />{column.columnName}</label>)}</fieldset> : null}
            <div hidden={collapsed}><Grid gridName="SR_APPROVERS_GRID" variant="record" loadData={loadData}
                onRowsLoaded={setRows} onConfigLoaded={setConfig} refreshToken={`${refreshToken}-${reloadKey}`} hiddenFields={hiddenFields}
                filterRows={(data) => data.filter((row) => (!stateFilter || row.state === stateFilter) && String(row[searchField] ?? '').toLowerCase().includes(query.trim().toLowerCase()))}
                renderCell={renderCell} defaultSort={{ field: 'level', direction: 'asc' }} emptyContent={<EmptyApprovers />} /></div>
        </div>
        {editing ? <ApproverEditor srId={srId} rows={rows} selected={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onUpdated() }} /> : null}
    </div>
}
