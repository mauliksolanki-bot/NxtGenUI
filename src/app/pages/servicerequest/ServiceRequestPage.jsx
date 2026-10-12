import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Form from '../../components/form/Form.jsx'
import ConfirmPopup from '../../components/popup/ConfirmPopup.jsx'
import { useToast } from '../../components/toast/ToastProvider.jsx'
import {
    deleteServiceRequest,
    getNewServiceRequest,
    getServiceRequest,
    getServiceRequestAttachments,
    uploadServiceRequestAttachment,
    searchRequestedForUsers,
    submitServiceRequest,
    updateServiceRequest,
    getServiceRequestActivities,
    postServiceRequestActivity,
} from '../../api/client.js'
import { getAuthToken } from '../../auth/session.js'
import { toSafeUserMessage } from '../../utils/toSafeUserMessage.js'
import AttachmentsPopup from './AttachmentsPopup.jsx'
import ApproversList from './ApproversList.jsx'
import '../administration/users/UsersPage.css'
import './ServiceRequestPage.css'

const SAVE_FIELDS = [
    'requestType',
    'requestedFor',
    'dueDate',
    'quantity',
    'ciItem',
    'estimatedDelivery',
    'title',
    'description',
    'workNotes',
    'watchList',
    'backordered',
    'orderGuide',
]

const searchHandlers = {
    requestedFor: {
        search: async (query) => {
            const results = await searchRequestedForUsers(query, getAuthToken())
            return results.map((item) => ({
                value: String(item.id),
                label: `${item.emplNm} (${item.username}, ID: ${item.id})`,
                name: item.emplNm,
            }))
        },
        onSelect: async (option) => ({ requestedFor: option.name }),
    },
    // Values for Configuration Item will be provided later.
    ciItem: {
        search: async () => [],
        onSelect: async (option) => ({ ciItem: option.label }),
    },
}

function toPayload(values) {
    return SAVE_FIELDS.reduce((payload, field) => {
        const value = values?.[field]
        payload[field] = field === 'backordered' ? value === true || value === 'true' : value === undefined || value === null ? '' : String(value)
        return payload
    }, {})
}

export default function ServiceRequestPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const toast = useToast()
    const { categorySlug, subcategorySlug, srId } = useParams()
    const [serviceRequest, setServiceRequest] = useState(null)
    const [reloadKey, setReloadKey] = useState(0)
    const [isBusy, setIsBusy] = useState(false)
    const [showAttachments, setShowAttachments] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const formApi = useRef(null)
    const [pendingFiles, setPendingFiles] = useState([])
    const [attachments, setAttachments] = useState([])
    const [activities, setActivities] = useState([])
    const [activityError, setActivityError] = useState('')
    const [note, setNote] = useState('')
    const [customerVisible, setCustomerVisible] = useState(false)
    const [activityFilter, setActivityFilter] = useState('All')
    const [activityReload, setActivityReload] = useState(0)

    useEffect(() => {
        let active = true
        setActivityError('')
        setActivities([])
        if (!srId) { setActivities([]); return undefined }
        getServiceRequestActivities(srId, getAuthToken()).then((result) => {
            if (active) setActivities(result)
        }).catch(() => {
            if (active) setActivityError('Unable to load activities. Please retry.')
        })
        return () => { active = false }
    }, [srId, reloadKey, showAttachments, activityReload])

    async function handlePostNote() {
        if (isBusy || !note.trim()) return
        setIsBusy(true)
        try {
            const result = await postServiceRequestActivity(srId, { body: note, customerVisible }, getAuthToken())
            setActivities(result)
            setActivityError('')
            setNote('')
            toast.success('Note posted successfully.')
        } catch (error) {
            toast.error(toSafeUserMessage(error?.details?.message ?? 'Unable to post note right now.'))
        } finally { setIsBusy(false) }
    }

    const listPath = categorySlug ? `/service-catalog/${categorySlug}` : location.pathname.startsWith('/my-approvals') ? '/my-approvals' : '/requests'
    const basePath = `/service-catalog/${categorySlug}/${subcategorySlug}`

    useEffect(() => {
        if (srId) {
            return undefined
        }

        let isMounted = true
        setServiceRequest(null)
        setPendingFiles([])

        setAttachments([])
        getNewServiceRequest(categorySlug, subcategorySlug, getAuthToken())
            .then((result) => {
                if (isMounted) {
                    setServiceRequest(result)
                }
            })
            .catch(() => {
                if (isMounted) {
                    toast.error(toSafeUserMessage('Unable to load service request right now.'))
                    navigate(listPath, { replace: true })
                }
            })

        return () => {
            isMounted = false
        }
    }, [srId, categorySlug, subcategorySlug])
    useEffect(() => {
        if (!srId) {
            return undefined
        }

        let isMounted = true

        getServiceRequest(srId, getAuthToken())
            .then((result) => {
                if (isMounted) {
                    setServiceRequest(result)
                }
            })
            .catch((requestError) => {
                if (isMounted) {
                    toast.error(toSafeUserMessage(requestError?.details?.message ?? 'Unable to load service request right now.'))
                    navigate(listPath, { replace: true })
                }
            })

        return () => {
            isMounted = false
        }
    }, [srId, reloadKey])

    useEffect(() => {
        if (!srId) {
            return undefined
        }

        let isMounted = true

        getServiceRequestAttachments(srId, getAuthToken())
            .then((result) => {
                if (isMounted) {
                    setAttachments(result)
                }
            })
            .catch(() => {
                if (isMounted) {
                    setAttachments([])
                }
            })

        return () => {
            isMounted = false
        }
    }, [srId, reloadKey, showAttachments])

    async function runAction(action, successMessage, failureMessage) {
        if (isBusy || !serviceRequest) {
            return
        }

        setIsBusy(true)
        try {
            const values = formApi.current?.getValues() ?? {}
            await action(serviceRequest.srId, toPayload(values), getAuthToken())
            toast.success(toSafeUserMessage(successMessage))
            formApi.current?.setErrors({})
            setReloadKey((key) => key + 1)
        } catch (requestError) {
            const fieldErrors = requestError?.details?.errors
            formApi.current?.setErrors(fieldErrors)
            const message = fieldErrors?.state ?? (fieldErrors ? 'Please correct the highlighted fields.' : failureMessage)
            toast.error(toSafeUserMessage(message))
        } finally {
            setIsBusy(false)
        }
    }

    async function handleSubmit() {
        if (isBusy || !serviceRequest) {
            return
        }

        setIsBusy(true)
        try {
            const values = formApi.current?.getValues() ?? {}
            const created = await submitServiceRequest({ ...toPayload(values), categorySlug, subcategorySlug }, getAuthToken())
            formApi.current?.setErrors({})

            const failedUploads = []
            for (const file of pendingFiles) {
                try {
                    await uploadServiceRequestAttachment(created.srId, file, getAuthToken())
                } catch {
                    failedUploads.push(file.name)
                }
            }

            toast.success(toSafeUserMessage('Service request submitted successfully.'))
            if (failedUploads.length > 0) {
                toast.error(toSafeUserMessage('Unable to attach file right now.'))
            }
            setPendingFiles([])
            navigate(`${basePath}/${created.srId}`, { replace: true })
        } catch (requestError) {
            const fieldErrors = requestError?.details?.errors
            formApi.current?.setErrors(fieldErrors)
            const message = fieldErrors ? 'Please correct the highlighted fields.' : 'Unable to submit service request right now.'
            toast.error(toSafeUserMessage(message))
        } finally {
            setIsBusy(false)
        }
    }
    async function handleDelete() {
        setIsBusy(true)
        try {
            await deleteServiceRequest(serviceRequest.srId, getAuthToken())
            toast.success(toSafeUserMessage('Service request deleted successfully.'))
            navigate(listPath, { replace: true })
        } catch {
            toast.error(toSafeUserMessage('Unable to delete service request right now.'))
            setShowDeleteConfirm(false)
        } finally {
            setIsBusy(false)
        }
    }

    const editable = Boolean(serviceRequest?.editable)
    const isNew = !srId
    const visibleAttachments = isNew ? pendingFiles.map((file) => ({ id: file.name, fileName: file.name })) : attachments
    const recordNumber = serviceRequest?.srId || 'New'

    return (
        <section className="sr-page">
            <div className="sr-record-header">
                <button type="button" className="sr-back-btn" aria-label="Back" onClick={() => navigate(listPath)}>
                    ‹
                </button>
                <div className="sr-record-title">
                    <span className="sr-record-type">Requested Item</span>
                    <strong>{recordNumber}</strong>
                </div>
                {serviceRequest ? (
                    <div className="sr-toolbar">
                        <button
                            type="button"
                            className="sr-header-btn sr-icon-only"
                            aria-label="Attachments"
                            title="Attachments"
                            onClick={() => setShowAttachments(true)}
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M16.5 6v11.5a4 4 0 0 1-8 0V5a2.5 2.5 0 0 1 5 0v10.5a1 1 0 0 1-2 0V6H10v9.5a2.5 2.5 0 0 0 5 0V5a4 4 0 0 0-8 0v12.5a5.5 5.5 0 0 0 11 0V6z" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="sr-header-btn"
                            disabled={isBusy || !editable || isNew}
                            onClick={() =>
                                runAction(updateServiceRequest, 'Service request updated successfully.', 'Unable to update service request right now.')
                            }
                        >
                            Update
                        </button>
                        <button
                            type="button"
                            className="sr-header-btn"
                            disabled={isBusy || isNew || !editable}
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            Delete
                        </button>
                        <button
                            type="button"
                            className="sr-header-btn sr-header-btn-primary"
                            disabled={isBusy || !editable || !isNew}
                            onClick={handleSubmit}
                        >
                            Submit
                        </button>
                    </div>
                ) : null}
            </div>

            {serviceRequest ? (
                <>
                    <div className="sr-attachments-line">
                        <button type="button" className="sr-attachments-link" onClick={() => setShowAttachments(true)}>
                            Manage Attachments
                        </button>
                        <span>({visibleAttachments.length}):</span>
                        {visibleAttachments.length === 0 ? (
                            <span className="sr-attachments-none">None</span>
                        ) : (
                            visibleAttachments.map((attachment) => (
                                <span className="sr-attachment-chip" key={attachment.id}>
                                    {attachment.fileName}
                                </span>
                            ))
                        )}
                    </div>
                    <Form
                        key={`${serviceRequest.srId}-${reloadKey}`}
                        formName={serviceRequest.formName || 'CREATE_SR_FORM'}
                        searchHandlers={searchHandlers}
                        initialValues={serviceRequest}
                        onSubmit={async () => undefined}
                        hideActions
                        locked={!editable}
                        variant="record"
                        excludeFields={isNew ? [] : ['workNotes']}
                        apiRef={formApi}
                    />
                    {!isNew ? (
                        <div className="sr-journal">
                            <div className="sr-journal-row">
                                <label htmlFor="sr-journal-note">{customerVisible ? 'Comments' : 'Work notes'}</label>
                                <div>
                                    <textarea id="sr-journal-note" className="form-field-input form-field-textarea sr-journal-input"
                                        value={note} onChange={(event) => setNote(event.target.value)} maxLength={10000}
                                        disabled={!editable || isBusy} placeholder={customerVisible ? 'Add a customer visible comment' : 'Add work notes'} />
                                    <div className="sr-journal-actions">
                                        <label><input type="checkbox" checked={customerVisible} onChange={(event) => setCustomerVisible(event.target.checked)} disabled={!editable || isBusy} /> Comments (Customer visible)</label>
                                        <button className="sr-header-btn" type="button" disabled={!editable || isBusy || !note.trim()} onClick={handlePostNote}>Post</button>
                                    </div>
                                </div>
                            </div>
                            <div className="sr-journal-row">
                                <span>Activities: {activities.length}</span>
                                <div>
                                    <label className="sr-activity-filter">Show
                                        <select value={activityFilter} onChange={(event) => setActivityFilter(event.target.value)}>
                                            {['All', 'Work notes', 'Comments', 'Field changes', 'Attachments', 'Request created', 'Approval updated'].map((type) => <option key={type}>{type}</option>)}
                                        </select>
                                    </label>
                                    {activityError ? <p role="alert">{activityError} <button type="button" className="sr-header-btn" onClick={() => setActivityReload((key) => key + 1)}>Retry</button></p> : null}
                                    <div aria-live="polite">
                                        {activities.filter((activity) => activityFilter === 'All' || (activityFilter === 'Attachments' ? activity.type.startsWith('Attachment') : activity.type === activityFilter)).map((activity) => (
                                            <article key={activity.id} className="sr-activity-card">
                                                <div className="sr-activity-meta"><strong>{activity.author}</strong><span>{activity.type} · <time dateTime={activity.createdAt}>{activity.createdAt.replace('T', ' ').substring(0, 19)}</time></span></div>
                                                <p>{activity.body}</p>
                                            </article>
                                        ))}
                                        {!activityError && activities.length === 0 ? <p className="sr-attachments-none">No activities yet.</p> : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                    {!isNew ? <section className="sr-related-section" aria-label="Related records">
                        <div className="sr-bottom-actions"><button type="button" className="sr-header-btn" disabled={isBusy || !editable} onClick={() => runAction(updateServiceRequest, 'Service request updated successfully.', 'Unable to update service request right now.')}>Update</button><button type="button" className="sr-header-btn" disabled={isBusy || !editable} onClick={() => setShowDeleteConfirm(true)}>Delete</button></div>
                        <ApproversList key={serviceRequest.srId} srId={serviceRequest.srId} refreshToken={reloadKey} onUpdated={() => setReloadKey((key) => key + 1)} />
                    </section> : null}
                </>
            ) : (
                <p className="grid-status">Loading request...</p>
            )}

            {showAttachments && serviceRequest ? (
                <AttachmentsPopup
                    srId={isNew ? null : serviceRequest.srId}
                    pendingFiles={pendingFiles}
                    onPendingChange={setPendingFiles}
                    editable={editable}
                    onClose={() => setShowAttachments(false)}
                />
            ) : null}

            {showDeleteConfirm ? (
                <ConfirmPopup
                    popupName="DELETE_SR_POPUP"
                    fallbackTitle="Delete Request"
                    fallbackMessage="Are you sure you want to delete this request? All its data and attachments will be permanently removed."
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                    isBusy={isBusy}
                />
            ) : null}
        </section>
    )
}
