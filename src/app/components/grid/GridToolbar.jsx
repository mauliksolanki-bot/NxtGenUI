import './GridToolbar.css'

function ToolbarIcon({ type }) {
    const paths = {
        filter: 'M3 4h18l-7 8v7l-4 2v-9z',
        refresh: 'M20 7v5h-5M4 17v-5h5M19 12a7 7 0 0 0-12-5L4 10M5 12a7 7 0 0 0 12 5l3-3',
        columns: 'M4 4h16v16H4zM9 4v16M15 4v16',
    }
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[type]} /></svg>
}

export default function GridToolbar({ title, columns, searchField, onSearchFieldChange, query, onQueryChange,
    onRefresh, onToggleFilters, filtersExpanded, onToggleColumns, columnsExpanded, createLabel, onCreate, createDisabled = false, createTitle }) {
    return <div className="grid-list-toolbar">
        <button type="button" className="grid-list-icon-button" aria-label="Show filters" title="Filters" aria-expanded={filtersExpanded} onClick={onToggleFilters}><ToolbarIcon type="filter" /></button>
        <h1>{title}</h1>
        <div className="grid-list-search">
            <select aria-label="Search field" value={searchField} onChange={(event) => onSearchFieldChange(event.target.value)}>
                {columns.map((column) => <option key={column.dataField} value={column.dataField}>{column.columnName}</option>)}
            </select>
            <input type="search" aria-label={`Search ${title.toLowerCase()}`} placeholder="Search" value={query} onChange={(event) => onQueryChange(event.target.value)} />
        </div>
        <div className="grid-list-toolbar-actions">
            <button type="button" className="grid-list-icon-button" aria-label={`Refresh ${title.toLowerCase()}`} title="Refresh" onClick={onRefresh}><ToolbarIcon type="refresh" /></button>
            <button type="button" className="grid-list-icon-button" aria-label="Choose columns" title="Choose columns" aria-expanded={columnsExpanded} onClick={onToggleColumns}><ToolbarIcon type="columns" /></button>
            <button type="button" className="grid-list-create-button" onClick={onCreate} disabled={createDisabled} title={createTitle}>{createLabel}</button>
        </div>
    </div>
}
