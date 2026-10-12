export const REQUEST_STAGES = ['New', 'Approval', 'Approved', 'Fulfillment', 'Delivery', 'Closed']

export function filterRequests(rows, { searchField, query, activeOnly, approval }) {
    const search = query.trim().toLocaleLowerCase()
    return rows.filter((row) => (!activeOnly || row.active)
        && (!approval || row.approval === approval)
        && (!search || String(row[searchField] ?? '').toLocaleLowerCase().includes(search)))
}

export function stageSteps(row) {
    const current = REQUEST_STAGES.indexOf(row.stage)
    const cancelled = row.state === 'Closed Cancelled'
    return REQUEST_STAGES.map((label, index) => ({
        label,
        status: current < 0 ? 'pending' : index === current
            ? cancelled ? 'cancelled' : row.state === 'Closed Complete' ? 'complete' : 'current'
            : index < current && !cancelled ? 'complete' : 'pending',
    }))
}

export function requestsCsv(rows, columns) {
    const cell = (value) => {
        let text = String(value ?? '')
        // Prevent spreadsheet formulas in user-supplied text when opening an export.
        if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`
        return `"${text.replaceAll('"', '""')}"`
    }
    return [columns.map((column) => cell(column.columnName)).join(','),
        ...rows.map((row) => columns.map((column) => cell(row[column.dataField])).join(','))].join('\r\n')
}
