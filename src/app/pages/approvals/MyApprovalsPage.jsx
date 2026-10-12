import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import Grid from '../../components/grid/Grid.jsx'
import GridToolbar from '../../components/grid/GridToolbar.jsx'
import { getMyApprovals } from '../../api/client.js'

const columns = [{ dataField: 'number', columnName: 'Requested Item' }, { dataField: 'approvalName', columnName: 'Approval' }, { dataField: 'state', columnName: 'State' }, { dataField: 'approver', columnName: 'Approver' }]
export default function MyApprovalsPage() {
    const [query, setQuery] = useState('')
    const [field, setField] = useState('number')
    const [showFilters, setShowFilters] = useState(false)
    const [state, setState] = useState('')
    const [refresh, setRefresh] = useState(0)
    const [showColumns, setShowColumns] = useState(false)
    const [config, setConfig] = useState(null)
    const [hidden, setHidden] = useState([])
    const load = useCallback((token) => getMyApprovals(token), [])
    return <section>
        <GridToolbar title="My Approvals" columns={columns} searchField={field} onSearchFieldChange={setField} query={query} onQueryChange={setQuery}
            onRefresh={() => setRefresh((value) => value + 1)} onToggleFilters={() => setShowFilters((value) => !value)} filtersExpanded={showFilters}
            onToggleColumns={() => setShowColumns((value) => !value)} columnsExpanded={showColumns} createLabel="Clear filters" onCreate={() => { setQuery(''); setState('') }} />
        <div className="grid-list-breadcrumb">All › Assigned to me{state ? ` › State = ${state}` : ''}</div>
        {showFilters ? <div className="grid-list-filter-panel"><label>State <select value={state} onChange={(event) => setState(event.target.value)}>{['', 'Pending', 'Not Started', 'Approved', 'Rejected', 'Cancelled'].map((value) => <option key={value} value={value}>{value || 'All'}</option>)}</select></label></div> : null}
        {showColumns ? <fieldset className="grid-list-column-panel"><legend>Visible columns</legend>{(config?.columns ?? []).filter((column) => !column.hidden).map((column) => <label key={column.dataField}><input type="checkbox" checked={!hidden.includes(column.dataField)} disabled={column.dataField === 'number'} onChange={(event) => setHidden((previous) => event.target.checked ? previous.filter((value) => value !== column.dataField) : [...previous, column.dataField])} />{column.columnName}</label>)}</fieldset> : null}
        <Grid gridName="MY_APPROVALS_GRID" variant="record" loadData={load} refreshToken={refresh} onConfigLoaded={setConfig} hiddenFields={hidden}
            renderCell={(row, column) => column.dataField === 'number' ? <Link to={`/my-approvals/${encodeURIComponent(row.number)}`}>{row.number}</Link> : row[column.dataField] ?? '—'}
            filterRows={(rows) => rows.filter((row) => (!state || row.state === state) && String(row[field] ?? '').toLowerCase().includes(query.trim().toLowerCase()))} />
    </section>
}
