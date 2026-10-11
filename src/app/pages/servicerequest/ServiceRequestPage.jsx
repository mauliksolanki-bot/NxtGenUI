import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
} from '../../api/client.js'
import { getAuthToken } from '../../auth/session.js'
import { toSafeUserMessage } from '../../utils/toSafeUserMessage.js'
import AttachmentsPopup from './AttachmentsPopup.jsx'
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
        payload[field] = value === undefined || value === null ? '' : String(value)
        return payload
    }, {})
}

export default function ServiceRequestPage() {
    const navigate = useNavigate()
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

    const listPath = `/service-catalog/${categorySlug}`
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
                            disabled={isBusy || isNew}
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
                        apiRef={formApi}
                    />
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
