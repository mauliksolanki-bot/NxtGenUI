import { useEffect, useRef, useState } from 'react'
import { clearGridCache, getGridConfig, getGridData } from '../../api/client.js'
import { getAuthToken } from '../../auth/session.js'
import { toSafeUserMessage } from '../../utils/toSafeUserMessage.js'
import './Grid.css'
import { sortGridRows } from './gridRows.js'

export default function Grid({ gridName, renderActions, refreshToken, variant = 'default', renderCell,
    filterRows, hiddenFields = [], selectable = false, selectedIds = [], onSelectionChange,
    onRowsLoaded, onConfigLoaded, defaultSort, getColumnLabel = (column) => column.columnName, loadData, emptyContent }) {
    const [config, setConfig] = useState(null)
    const [rows, setRows] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [retryKey, setRetryKey] = useState(0)
    const [sort, setSort] = useState(defaultSort ?? null)
    const selectAllRef = useRef(null)

    useEffect(() => {
        let isMounted = true
        setIsLoading(true)
        setError('')

        async function loadGrid() {
            const token = getAuthToken()

            try {
                const [gridConfig, gridData] = await Promise.all([
                    getGridConfig(gridName, token),
                    loadData ? loadData(token) : getGridData(gridName, token),
                ])

                if (isMounted) {
                    setConfig(gridConfig)
                    setRows(gridData)
                    onRowsLoaded?.(gridData)
                    onConfigLoaded?.(gridConfig)
                    setError('')
                }
            } catch {
                if (isMounted) {
                    setError(toSafeUserMessage('Unable to load the grid right now.'))
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadGrid()

        return () => {
            isMounted = false
        }
    }, [gridName, refreshToken, retryKey, onRowsLoaded, onConfigLoaded, loadData])

    const visibleColumns = (config?.columns ?? []).filter((column) => !column.hidden && !hiddenFields.includes(column.dataField))
    const displayRows = sortGridRows(filterRows ? filterRows(rows) : rows, sort)
    const allSelected = displayRows.length > 0 && displayRows.every((row) => selectedIds.includes(row.id))
    const someSelected = displayRows.some((row) => selectedIds.includes(row.id))
    useEffect(() => {
        if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected && !allSelected
    }, [someSelected, allSelected, isLoading])

    function toggleSelection(rowId) {
        onSelectionChange?.(selectedIds.includes(rowId)
            ? selectedIds.filter((id) => id !== rowId) : [...selectedIds, rowId])
    }

    function toggleAll() {
        const visibleIds = displayRows.map((row) => row.id)
        onSelectionChange?.(allSelected ? selectedIds.filter((id) => !visibleIds.includes(id))
            : [...new Set([...selectedIds, ...visibleIds])])
    }

    if (isLoading) {
        return <p className="grid-status">{config?.loadingMessage ?? 'Loading...'}</p>
    }

    if (error) {
        return <p className="grid-status grid-status-error" role="alert">{error} <button type="button" onClick={() => {
            clearGridCache(gridName)
            setRetryKey((key) => key + 1)
        }}>Retry</button></p>
    }

    return (
        <div className={`nxtgen-grid-wrapper${variant === 'record' ? ' nxtgen-grid-record' : ''}`}>
            <table className="nxtgen-grid">
                <thead>
                <tr>
                    {selectable ? <th className="grid-selection-cell"><input ref={selectAllRef} type="checkbox" aria-label="Select all visible requests" checked={allSelected} onChange={toggleAll} disabled={!displayRows.length} /></th> : null}
                    {visibleColumns.map((column) => (
                        <th key={column.id} className={`grid-column-${column.dataField}`} style={column.width ? { width: column.width } : undefined}
                            aria-sort={sort?.field === column.dataField ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}>
                            {column.sortable ? <button type="button" className="grid-sort-button" onClick={() => setSort((previous) => ({
                                field: column.dataField,
                                direction: previous?.field === column.dataField && previous.direction === 'asc' ? 'desc' : 'asc',
                            }))}>{getColumnLabel(column)}{sort?.field === column.dataField ? <span aria-hidden="true">{sort.direction === 'asc' ? ' ▴' : ' ▾'}</span> : null}</button> : getColumnLabel(column)}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {displayRows.length === 0 ? (
                    <tr>
                        <td className="grid-empty-cell" colSpan={visibleColumns.length + (selectable ? 1 : 0)}>
                            {emptyContent ?? 'No records found.'}
                        </td>
                    </tr>
                ) : (
                    displayRows.map((row) => (
                        <tr key={row.id} className={selectedIds.includes(row.id) ? 'grid-row-selected' : undefined}>
                            {selectable ? <td className="grid-selection-cell"><input type="checkbox" aria-label={`Select ${row.number ?? row.id}`} checked={selectedIds.includes(row.id)} onChange={() => toggleSelection(row.id)} /></td> : null}
                            {visibleColumns.map((column) => (
                                <td key={column.id} className={`grid-column-${column.dataField}`}>
                                    {column.dataField === 'actions'
                                        ? renderActions?.(row) ?? null
                                        : renderCell?.(row, column) ?? String(row[column.dataField] ?? '')}
                                </td>
                            ))}
                        </tr>
                    ))
                )}
                </tbody>
            </table>
            {variant === 'record' ? <div className="grid-record-count" aria-live="polite">{displayRows.length} of {rows.length} records{selectedIds.length ? ` · ${selectedIds.length} selected` : ''}</div> : null}
        </div>
    )
}
