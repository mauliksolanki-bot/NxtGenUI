import test from 'node:test'
import assert from 'node:assert/strict'
import { filterRequests, stageSteps, requestsCsv } from '../src/app/pages/requests/requestGrid.js'
import { sortGridRows } from '../src/app/components/grid/gridRows.js'

const rows = [
    { id: 'RITM2', number: 'RITM2', item: 'Laptop', active: true, approval: 'Requested', quantity: 12 },
    { id: 'RITM10', number: 'RITM10', item: 'Desktop', active: false, approval: 'Approved', quantity: 2 },
    { id: 'RITM1', number: 'RITM1', item: 'LAPTOP', active: true, approval: 'Approved', quantity: 1 },
]

test('request filters combine active scope, approval and case insensitive search', () => {
    assert.deepEqual(filterRequests(rows, { searchField: 'item', query: ' laptop ', activeOnly: true, approval: 'Approved' }).map((row) => row.id), ['RITM1'])
    assert.equal(filterRequests(rows, { searchField: 'number', query: '', activeOnly: false, approval: '' }).length, 3)
})

test('numeric and natural number sorting do not mutate source rows', () => {
    assert.deepEqual(sortGridRows(rows, { field: 'quantity', direction: 'asc' }).map((row) => row.quantity), [1, 2, 12])
    assert.deepEqual(sortGridRows(rows, { field: 'number', direction: 'desc' }).map((row) => row.id), ['RITM10', 'RITM2', 'RITM1'])
    assert.equal(rows[0].id, 'RITM2')
})

test('stage indicators reflect current, completed, cancelled and unknown stages', () => {
    assert.deepEqual(stageSteps({ stage: 'Approved', state: 'In Progress' }).map((step) => step.status), ['complete', 'complete', 'current', 'pending', 'pending', 'pending'])
    assert.deepEqual(stageSteps({ stage: 'Fulfillment', state: 'In Progress' }).map((step) => step.status), ['complete', 'complete', 'complete', 'current', 'pending', 'pending'])
    assert.equal(stageSteps({ stage: 'Closed', state: 'Closed Complete' }).every((step) => step.status === 'complete'), true)
    assert.deepEqual(stageSteps({ stage: 'Closed', state: 'Closed Cancelled' }).map((step) => step.status), ['pending', 'pending', 'pending', 'pending', 'pending', 'cancelled'])
    assert.equal(stageSteps({ stage: 'Unknown', state: 'Submitted' }).every((step) => step.status === 'pending'), true)
})

test('CSV preserves quoted fields and blocks spreadsheet formulas', () => {
    assert.equal(requestsCsv([{ item: '=1+1', catalog: 'Hardware, "IT"' }], [{ columnName: 'Item', dataField: 'item' }, { columnName: 'Catalog', dataField: 'catalog' }]), '"Item","Catalog"\r\n"\'=1+1","Hardware, ""IT"""')
})
