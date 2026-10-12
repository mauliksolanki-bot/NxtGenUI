export function sortGridRows(rows, sort) {
    if (!sort?.field) return rows
    return [...rows].sort((left, right) => {
        const a = left[sort.field]
        const b = right[sort.field]
        const comparison = typeof a === 'number' && typeof b === 'number'
            ? a - b
            : String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true, sensitivity: 'base' })
        return sort.direction === 'desc' ? -comparison : comparison
    })
}
