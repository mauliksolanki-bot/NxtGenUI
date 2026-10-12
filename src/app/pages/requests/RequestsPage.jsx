import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Grid from '../../components/grid/Grid.jsx'
import { clearGridCache } from '../../api/client.js'
import { getSession } from '../../auth/session.js'
import { filterRequests, requestsCsv, stageSteps } from './requestGrid.js'
import './RequestsPage.css'

const GRID_NAME = 'REQUESTS_GRID'

function ListIcon({ type }) {
    const paths = {
        menu: 'M4 6h16M4 12h16M4 18h16',
        filter: 'M3 4h18l-7 8v7l-4 2v-9z',
        search: 'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
        refresh: 'M20 7v5h-5M4 17v-5h5M19 12a7 7 0 0 0-12-5L4 10M5 12a7 7 0 0 0 12 5l3-3',
        settings: 'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    }
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[type]} /></svg>
}

function StageProgress({ row }) {
    const [expanded, setExpanded] = useState(false)
    const steps = stageSteps(row)
    return (
        <div className="requests-stage">
            <button type="button" className="requests-stage-toggle" aria-expanded={expanded}
                aria-label={`${row.number}: ${row.stage || 'Stage unavailable'}. ${expanded ? 'Hide' : 'Show'} stage details`}
                onClick={() => setExpanded((value) => !value)}>
                <span className={expanded ? 'requests-stage-arrow is-expanded' : 'requests-stage-arrow'} aria-hidden="true">▸</span>
                <span className="requests-stage-circles" aria-hidden="true">
                    {steps.map((step) => <span key={step.label} title={`${step.label}: ${step.status}`} className={`requests-stage-dot is-${step.status}`}>
                        {step.status === 'complete' ? '✓' : step.status === 'current' ? '→' : step.status === 'cancelled' ? '×' : ''}
                    </span>)}
                </span>
            </button>
            {expanded ? <div className="requests-stage-detail">
                <strong>{row.stage || 'Stage unavailable'}</strong><span>State: {row.state || '(empty)'}</span>
                <ol>{steps.map((step) => <li key={step.label}>{step.label}: {step.status}</li>)}</ol>
            </div> : null}
        </div>
    )
}

export default function RequestsPage() {
    const navigate = useNavigate()
    const [refreshToken, setRefreshToken] = useState(0)
    const [rows, setRows] = useState([])
    const [config, setConfig] = useState(null)
    const [searchField, setSearchField] = useState('number')
    const [query, setQuery] = useState('')
    const [activeOnly, setActiveOnly] = useState(true)
    const [approval, setApproval] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [showColumns, setShowColumns] = useState(false)
    const [hiddenFields, setHiddenFields] = useState([])
    const [selectedIds, setSelectedIds] = useState([])
    const columns = (config?.columns ?? []).filter((column) => !column.hidden)
    const searchColumns = columns.filter((column) => column.filterable)
    const filters = { searchField, query, activeOnly, approval }
    const filteredRows = filterRequests(rows, filters)

    function changeFilter(setter, value) {
        setter(value)
        setSelectedIds([])
    }

    function resetFilters() {
        setQuery('')
        setApproval('')
        setActiveOnly(false)
        setSelectedIds([])
    }

    function refresh() {
        clearGridCache(GRID_NAME)
        setSelectedIds([])
        setRefreshToken((value) => value + 1)
    }

    function handleSelectedAction(action) {
        if (action === 'clear') { setSelectedIds([]); return }
        if (action !== 'export') return
        const selected = filteredRows.filter((row) => selectedIds.includes(row.id))
        if (!selected.length) return
        const csv = requestsCsv(selected, columns.filter((column) => !hiddenFields.includes(column.dataField)))
        const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'requested-items.csv'
        anchor.click()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    }

    function renderCell(row, column) {
        if (column.dataField === 'number' || column.dataField === 'item') {
            return <Link className="requests-record-link" to={`/requests/${encodeURIComponent(row.id)}`}>{row[column.dataField] || '(empty)'}</Link>
        }
        if (column.dataField === 'approval') {
            const status = row.approval === 'Approved' ? 'approved' : row.approval === 'Requested' ? 'requested'
                : row.approval === 'Rejected' ? 'rejected' : 'neutral'
            return <span className="requests-approval"><span aria-hidden="true" className={`requests-approval-dot is-${status}`} />{row.approval}</span>
        }
        if (column.dataField === 'stage') return <StageProgress row={row} />
        return row[column.dataField] === '' || row[column.dataField] == null ? '(empty)' : row[column.dataField]
    }

    return (
        <section className="requests-page" aria-label="Requested Items">
            <div className="requests-toolbar">
                <button type="button" className="requests-icon-button" aria-label="Choose columns" title="Choose columns" aria-expanded={showColumns} onClick={() => setShowColumns((value) => !value)}><ListIcon type="menu" /></button>
                <button type="button" className="requests-icon-button" aria-label="Show filters" title="Filters" aria-expanded={showFilters} onClick={() => setShowFilters((value) => !value)}><ListIcon type="filter" /></button>
                <h1>Requested Items</h1><span className="requests-view">View: Self Service</span>
                <div className="requests-search">
                    <select aria-label="Search field" value={searchField} onChange={(event) => changeFilter(setSearchField, event.target.value)}>
                        {searchColumns.length ? searchColumns.map((column) => <option key={column.id} value={column.dataField}>{column.columnName}</option>) : <option value="number">Number</option>}
                    </select>
                    <input type="search" aria-label="Search requests" placeholder="Search" value={query} onChange={(event) => changeFilter(setQuery, event.target.value)} />
                </div>
                <div className="requests-toolbar-actions">
                    <button type="button" className="requests-icon-button" aria-label="Refresh requests" title="Refresh" onClick={refresh}><ListIcon type="refresh" /></button>
                    <button type="button" className="requests-icon-button" aria-label="List settings" title="List settings" aria-expanded={showColumns} onClick={() => setShowColumns((value) => !value)}><ListIcon type="settings" /></button>
                    <select className="requests-selected-actions" aria-label="Actions on selected rows" value="" disabled={!selectedIds.length} onChange={(event) => handleSelectedAction(event.target.value)}>
                        <option value="" disabled>Actions on selected rows...</option><option value="export">Export selected rows</option><option value="clear">Clear selection</option>
                    </select>
                    <button type="button" className="requests-new-button" onClick={() => navigate('/service-catalog')}>New</button>
                </div>
            </div>
            <div className="requests-breadcrumb">
                <button type="button" onClick={resetFilters}>All</button><span>›</span>
                <span>Opened by = {getSession()?.displayName || getSession()?.username || 'Me'}</span>
                {activeOnly ? <><span>›</span><button type="button" title="Remove Active filter" onClick={() => changeFilter(setActiveOnly, false)}>Active = true ×</button></> : null}
                {approval ? <><span>›</span><button type="button" title="Remove Approval filter" onClick={() => changeFilter(setApproval, '')}>Approval = {approval} ×</button></> : null}
                {query ? <><span>›</span><span>{searchColumns.find((column) => column.dataField === searchField)?.columnName || 'Number'} contains “{query}”</span></> : null}
            </div>
            {showFilters ? <div className="requests-filter-panel">
                <label><input type="checkbox" checked={activeOnly} onChange={(event) => changeFilter(setActiveOnly, event.target.checked)} /> Active requests only</label>
                <label>Approval <select value={approval} onChange={(event) => changeFilter(setApproval, event.target.value)}><option value="">All</option>
                    {['Requested', 'Approved', 'Rejected', 'Cancelled', 'Not required', 'Not requested'].map((status) => <option key={status}>{status}</option>)}
                </select></label>
                <button type="button" className="requests-text-button" onClick={resetFilters}>Clear filters</button>
            </div> : null}
            {showColumns ? <fieldset className="requests-column-panel"><legend>Visible columns</legend>
                {columns.map((column) => <label key={column.id}><input type="checkbox" checked={!hiddenFields.includes(column.dataField)} disabled={column.dataField === 'number'}
                    onChange={(event) => setHiddenFields((previous) => event.target.checked ? previous.filter((field) => field !== column.dataField) : [...previous, column.dataField])} />{column.columnName}</label>)}
            </fieldset> : null}
            <Grid gridName={GRID_NAME} variant="record" selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
                onRowsLoaded={setRows} onConfigLoaded={setConfig} refreshToken={refreshToken} hiddenFields={hiddenFields}
                filterRows={(data) => filterRequests(data, filters)} renderCell={renderCell}
                defaultSort={{ field: 'number', direction: 'desc' }} />
        </section>
    )
}
