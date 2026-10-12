import '../../servicerequest/ServiceRequestPage.css'

export default function UserRecordHeader({ title, record, formId, submitLabel, busy, onBack, onClear }) {
    return <div className="sr-record-header">
        <button type="button" className="sr-back-btn" aria-label="Back to users" onClick={onBack}>‹</button>
        <div className="sr-record-title"><span className="sr-record-type">{title}</span><strong>{record}</strong></div>
        <div className="sr-toolbar">
            <button type="submit" form={formId} className={`sr-header-btn${submitLabel === 'Submit' ? ' sr-header-btn-primary' : ''}`} disabled={busy}>{busy ? 'Please wait...' : submitLabel}</button>
            <button type="button" className="sr-header-btn" disabled={busy} onClick={onClear}>Clear</button>
        </div>
    </div>
}
