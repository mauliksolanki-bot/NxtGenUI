import { useState } from 'react'
import { Link } from 'react-router-dom'
import { clearGridCache } from '../../api/client.js'
import Grid from './Grid.jsx'
import GridToolbar from './GridToolbar.jsx'
import './AdminRecordGrid.css'

function activeValue(value) {
    if (value === true || value === 'Y' || value === 'true') return 'Yes'
    if (value === false || value === 'N' || value === 'false') return 'No'
    return '—'
}

export default function AdminRecordGrid({ title, gridName, columnLabels, nameField, descriptionField,
    createLabel, onCreate, editPath, renderActions }) {
    const [config, setConfig] = useState(null)
    const [refreshToken, setRefreshToken] = useState(0)
    const [searchField, setSearchField] = useState(nameField)
    const [query, setQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [showColumns, setShowColumns] = useState(false)
    const [hiddenFields, setHiddenFields] = useState([])
    const columnLabel = (column) => columnLabels[column.dataField] || column.columnName
    const columns = (config?.columns ?? []).filter((column) => !column.hidden)
        .map((column) => ({ ...column, columnName: columnLabel(column) }))
    const searchColumns = columns.filter((column) => column.filterable && column.dataField !== 'actions')

    function resetFilters() { setQuery(''); setActiveFilter('') }
    function refresh() { clearGridCache(gridName); setRefreshToken((value) => value + 1) }
    function filterRows(rows) {
        const search = query.trim().toLocaleLowerCase()
        return rows.filter((row) => {
            const value = searchField === 'isActive' ? activeValue(row.isActive) : row[searchField]
            return (!search || String(value ?? '').toLocaleLowerCase().includes(search))
                && (!activeFilter || activeValue(row.isActive) === activeFilter)
        })
    }
    function renderCell(row, column) {
        if (column.dataField === 'isActive') {
            const active = activeValue(row.isActive)
            return <span className="admin-record-status"><span aria-hidden="true" className={`admin-record-status-dot${active === 'Yes' ? ' is-active' : ''}`} />{active}</span>
        }
        const value = row[column.dataField] === '' || row[column.dataField] == null ? '—' : String(row[column.dataField])
        if (column.dataField === nameField && editPath) return <Link className="admin-record-link" to={editPath(row)}>{value}</Link>
        if (column.dataField === descriptionField) return <span className="admin-record-description" title={value}>{value}</span>
        return value
    }

    return <section className="admin-record-page">
        <GridToolbar title={title} columns={searchColumns.length ? searchColumns : [{ dataField: nameField, columnName: columnLabels[nameField] }]}
            searchField={searchField} onSearchFieldChange={setSearchField} query={query} onQueryChange={setQuery}
            onRefresh={refresh} onToggleFilters={() => setShowFilters((value) => !value)} filtersExpanded={showFilters}
            onToggleColumns={() => setShowColumns((value) => !value)} columnsExpanded={showColumns}
            createLabel={createLabel} onCreate={onCreate} />
        <div className="grid-list-breadcrumb"><button type="button" onClick={resetFilters}>All</button><span>› {title}</span>
            {activeFilter ? <><span>›</span><button type="button" onClick={() => setActiveFilter('')}>Active = {activeFilter} ×</button></> : null}
            {query ? <><span>›</span><span>{columnLabels[searchField] || searchField} contains “{query}”</span></> : null}
        </div>
        {showFilters ? <div className="grid-list-filter-panel"><label>Active <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}><option value="">All</option><option>Yes</option><option>No</option></select></label><button type="button" onClick={resetFilters}>Clear filters</button></div> : null}
        {showColumns ? <fieldset className="grid-list-column-panel"><legend>Visible columns</legend>{columns.map((column) => <label key={column.id}><input type="checkbox" checked={!hiddenFields.includes(column.dataField)} disabled={column.dataField === nameField || column.dataField === 'actions'}
            onChange={(event) => setHiddenFields((previous) => event.target.checked ? previous.filter((field) => field !== column.dataField) : [...previous, column.dataField])} />{column.columnName}</label>)}</fieldset> : null}
        <Grid gridName={gridName} variant="record" onConfigLoaded={setConfig} refreshToken={refreshToken}
            getColumnLabel={columnLabel} filterRows={filterRows} hiddenFields={hiddenFields}
            renderCell={renderCell} renderActions={renderActions} defaultSort={{ field: 'id', direction: 'asc' }} />
    </section>
}
