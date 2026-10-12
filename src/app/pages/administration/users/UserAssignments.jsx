import { useState } from 'react'
import AssignmentEditor from './AssignmentEditor.jsx'
import '../../../components/grid/Grid.css'
import '../../../components/grid/GridToolbar.css'
import '../../servicerequest/ApproversList.css'
import './UserAssignments.css'

export default function UserAssignments({ values, fields, onChange, errors, disabled, isNew }) {
    const [tab, setTab] = useState('roles')
    const [query, setQuery] = useState('')
    const [selected, setSelected] = useState([])
    const [editing, setEditing] = useState(false)
    const [collapsed, setCollapsed] = useState(false)
    const roleOptions = fields.find((field) => field.dataField === 'roleId')?.options ?? []
    const roles = (values.roleId ?? []).map((value) => ({ value: String(value), label: roleOptions.find((option) => String(option.value) === String(value))?.label || `Role ${value}` }))
    const groups = values.groupIds ?? []
    const assignments = tab === 'roles' ? roles : groups
    const visible = assignments.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))
    const field = tab === 'roles' ? 'roleId' : 'groupIds'

    function switchTab(next) { setTab(next); setQuery(''); setSelected([]); setEditing(false); setCollapsed(false) }
    function startEdit() { setEditing(true) }
    function apply(items) { onChange(field, tab === 'roles' ? items.map((item) => item.value) : items); setEditing(false); setSelected([]) }

    return <section className="sr-related-section user-assignments" aria-label="User roles and groups">
        <div className="sr-bottom-actions"><button type="submit" className="sr-header-btn" disabled={disabled}>{isNew ? 'Submit' : 'Update'}</button><span>Assignment changes are saved when you {isNew ? 'submit' : 'update'} the user.</span></div>
        <div className="sr-related-tabs" role="tablist" aria-label="User related records">
            {['roles', 'groups'].map((name) => <button type="button" key={name} id={`user-${name}-tab`} role="tab" aria-selected={tab === name} aria-controls={`user-${name}-panel`} className={`sr-related-tab${tab === name ? '' : ' user-tab-inactive'}`} onClick={() => switchTab(name)}>{name === 'roles' ? `Roles (${roles.length})` : `Groups (${groups.length})`}</button>)}
        </div>
        <div className="sr-related-panel" role="tabpanel" id={`user-${tab}-panel`} aria-labelledby={`user-${tab}-tab`}>
            <div className="grid-list-toolbar">
                <div className="grid-list-search"><label htmlFor="user-assignment-search">{tab === 'roles' ? 'Role' : 'Group'}</label><input id="user-assignment-search" type="search" placeholder="Search" aria-label={`Search assigned ${tab}`} value={query} onChange={(event) => setQuery(event.target.value)} /></div>
                <div className="grid-list-toolbar-actions"><button type="button" className="sr-header-btn" disabled={disabled || !selected.length} onClick={() => apply(assignments.filter((item) => !selected.includes(String(item.value))))}>Remove selected</button><button type="button" className="grid-list-create-button" disabled={disabled} onClick={startEdit}>Add {tab === 'roles' ? 'Role' : 'Group'}</button><button type="button" className="grid-list-create-button" disabled={disabled} onClick={startEdit}>Edit...</button></div>
            </div>
            <div className="sr-approvers-breadcrumb"><span>User = {values.emplNm || values.username || 'New user'}</span><button type="button" aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${tab}`} aria-expanded={!collapsed} onClick={() => setCollapsed((value) => !value)}>{collapsed ? '+' : '−'}</button></div>
            {errors[field] ? <p role="alert" className="grid-status-error">{errors[field]}</p> : null}
            {editing ? <AssignmentEditor type={tab} options={roleOptions} assigned={assignments} userName={values.emplNm || values.username || 'New user'} onSave={apply} onCancel={() => setEditing(false)} /> : null}
            {!collapsed ? <div className="nxtgen-grid-wrapper nxtgen-grid-record"><table className="nxtgen-grid"><thead><tr><th className="grid-selection-cell"><input type="checkbox" aria-label={`Select all visible ${tab}`} disabled={disabled || !visible.length} checked={visible.length > 0 && visible.every((item) => selected.includes(String(item.value)))} onChange={(event) => setSelected(event.target.checked ? visible.map((item) => String(item.value)) : [])} /></th><th>{tab === 'roles' ? 'Role' : 'Group'}</th></tr></thead><tbody>
                {visible.map((item) => <tr key={item.value}><td className="grid-selection-cell"><input type="checkbox" aria-label={`Select ${item.label}`} disabled={disabled} checked={selected.includes(String(item.value))} onChange={(event) => setSelected((previous) => event.target.checked ? [...previous, String(item.value)] : previous.filter((value) => value !== String(item.value)))} /></td><td>{item.label}</td></tr>)}
                {!visible.length ? <tr><td colSpan={2} className="grid-empty-cell">No records to display</td></tr> : null}
            </tbody></table><div className="grid-record-count">{visible.length} of {assignments.length} records</div></div> : null}
        </div>
    </section>
}

