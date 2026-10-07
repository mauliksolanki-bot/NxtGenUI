import { useEffect, useState } from 'react'
import { getGridConfig, getGridData } from '../../api/client.js'
import { getAuthToken } from '../../auth/session.js'
import { toSafeUserMessage } from '../../utils/toSafeUserMessage.js'
import './Grid.css'

export default function Grid({ gridName, renderActions }) {
    const [config, setConfig] = useState(null)
    const [rows, setRows] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let isMounted = true

        async function loadGrid() {
            const token = getAuthToken()

            try {
                const [gridConfig, gridData] = await Promise.all([
                    getGridConfig(gridName, token),
                    getGridData(gridName, token),
                ])

                if (isMounted) {
                    setConfig(gridConfig)
                    setRows(gridData)
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
    }, [gridName])

    if (isLoading) {
        return <p className="grid-status">{config?.loadingMessage ?? 'Loading...'}</p>
    }

    if (error) {
        return <p className="grid-status grid-status-error">{error}</p>
    }

    const visibleColumns = (config?.columns ?? []).filter((column) => !column.hidden)

    return (
        <div className="nxtgen-grid-wrapper">
            <table className="nxtgen-grid">
                <thead>
                <tr>
                    {visibleColumns.map((column) => (
                        <th key={column.id} style={column.width ? { width: column.width } : undefined}>
                            {column.columnName}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {rows.length === 0 ? (
                    <tr>
                        <td className="grid-empty-cell" colSpan={visibleColumns.length}>
                            No records found.
                        </td>
                    </tr>
                ) : (
                    rows.map((row) => (
                        <tr key={row.id}>
                            {visibleColumns.map((column) => (
                                <td key={column.id}>
                                    {column.dataField === 'actions'
                                        ? renderActions?.(row) ?? null
                                        : String(row[column.dataField] ?? '')}
                                </td>
                            ))}
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
    )
}
