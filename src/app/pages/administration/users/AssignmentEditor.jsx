import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { searchGroups } from '../../../api/client.js'
import { getAuthToken } from '../../../auth/session.js'
import './AssignmentEditor.css'

export default function AssignmentEditor({ type, options, assigned, userName, onSave, onCancel }) {
    const dialog = useRef(null)
    const [items, setItems] = useState(assigned.map((item) => ({ ...item, value: String(item.value) })))
    const [collection, setCollection] = useState(options)
    const [query, setQuery] = useState('')
    const [leftSelection, setLeftSelection] = useState([])
    const [rightSelection, setRightSelection] = useState([])
    const [filters, setFilters] = useState([])
    const [appliedFilters, setAppliedFilters] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const title = type === 'roles' ? 'Roles' : 'Groups'

    useEffect(() => {
        const previousFocus = document.activeElement
        dialog.current.showModal()
        return () => previousFocus?.focus()
    }, [])

    useEffect(() => {
        if (type !== 'groups') return undefined
        let active = true
        setLoading(true)
        setError('')
        const timer = setTimeout(() => {
            searchGroups(query, getAuthToken()).then((results) => {
                if (active) setCollection(results.map((item) => ({ ...item, value: String(item.value) })))
            }).catch(() => { if (active) { setCollection([]); setError('Unable to load groups. Change the search to retry.') } })
                .finally(() => { if (active) setLoading(false) })
        }, 300)
        return () => { active = false; clearTimeout(timer) }
    }, [type, query])

    const available = collection.filter((item) => !items.some((entry) => entry.value === String(item.value))
        && item.label.toLowerCase().includes(query.trim().toLowerCase())
        && appliedFilters.every((filter) => {
            const name = item.label.toLowerCase(), value = filter.value.toLowerCase()
            return filter.operator === 'equals' ? name === value : filter.operator === 'starts' ? name.startsWith(value) : name.includes(value)
        })).sort((a, b) => a.label.localeCompare(b.label))
    function add() {
        setItems((previous) => [...previous, ...available.filter((item) => leftSelection.includes(String(item.value))).map((item) => ({ ...item, value: String(item.value) }))])
        setLeftSelection([])
    }
    function remove() {
        const removed = items.filter((item) => rightSelection.includes(item.value))
        setCollection((previous) => [...previous, ...removed.filter((item) => !previous.some((entry) => String(entry.value) === item.value))])
        setItems((previous) => previous.filter((item) => !rightSelection.includes(item.value)))
        setRightSelection([])
    }
    function selection(event) { return Array.from(event.target.selectedOptions, (option) => option.value) }
    const saveButtons = <><button type="button" className="sr-header-btn" onClick={onCancel}>Cancel</button><button type="button" className="assignment-save" onClick={() => onSave(items)}>Save</button></>

    return createPortal(<dialog className="assignment-page" ref={dialog} aria-labelledby="assignment-editor-title" onCancel={(event) => { event.preventDefault(); onCancel() }}>
        <header className="assignment-page-header"><button type="button" className="sr-header-btn assignment-back" aria-label="Back to user" onClick={onCancel}>‹</button><h2 id="assignment-editor-title">Edit {title}</h2><div className="assignment-header-actions">{saveButtons}</div></header>
        <main className="assignment-page-content">
            <div className="assignment-filter-actions"><button type="button" className="sr-header-btn" onClick={() => setFilters((previous) => [...previous, { operator: 'contains', value: '' }])}>Add Filter</button><button type="button" className="sr-header-btn" onClick={() => setAppliedFilters(filters.filter((filter) => filter.value.trim()).map((filter) => ({ ...filter, value: filter.value.trim() })))}>Run filter</button></div>
            {filters.map((filter, index) => <div className="assignment-filter-row" key={index}><select aria-label={`Filter ${index + 1} field`} value="name" onChange={() => {}}><option value="name">{type === 'roles' ? 'Role' : 'Group'}</option></select><select aria-label={`Filter ${index + 1} operator`} value={filter.operator} onChange={(event) => setFilters((previous) => previous.map((item, position) => position === index ? { ...item, operator: event.target.value } : item))}><option value="contains">contains</option><option value="equals">is</option><option value="starts">starts with</option></select><input aria-label={`Filter ${index + 1} value`} value={filter.value} onChange={(event) => setFilters((previous) => previous.map((item, position) => position === index ? { ...item, value: event.target.value } : item))} /><button type="button" className="sr-header-btn" aria-label={`Remove filter ${index + 1}`} onClick={() => { setFilters((previous) => previous.filter((_, position) => position !== index)); setAppliedFilters([]) }}>×</button></div>)}
            <div className="assignment-dual-list">
                <div className="assignment-list-column"><label htmlFor="assignment-collection">Collection</label><input type="search" autoFocus aria-label={`Search available ${type}`} placeholder="Search" value={query} onChange={(event) => { setQuery(event.target.value); setLeftSelection([]) }} />
                    <select id="assignment-collection" aria-label={`Available ${type}`} multiple size={15} value={leftSelection} onChange={(event) => setLeftSelection(selection(event))}>{available.map((item) => <option key={item.value} value={String(item.value)}>{item.label}</option>)}</select>
                    <span role="status">{loading ? 'Loading...' : `${available.length} available`}</span>{error ? <p role="alert">{error}</p> : null}
                </div>
                <div className="assignment-transfer"><button type="button" className="sr-header-btn" aria-label={`Add selected ${type}`} disabled={!leftSelection.length || loading} onClick={add}>›</button><button type="button" className="sr-header-btn" aria-label={`Remove selected ${type}`} disabled={!rightSelection.length} onClick={remove}>‹</button></div>
                <div className="assignment-list-column"><label htmlFor="assignment-selected">{title} List</label><span className="assignment-user-name">{userName}</span><select id="assignment-selected" aria-label={`Assigned ${type}`} multiple size={15} value={rightSelection} onChange={(event) => setRightSelection(selection(event))}>{items.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><span>{items.length} assigned</span></div>
            </div>
            <div className="assignment-footer">{saveButtons}</div><p className="assignment-save-hint">Save returns to the user form. {title} are saved with the user when you submit or update.</p>
        </main>
    </dialog>, document.body)
}
