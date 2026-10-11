import { useEffect, useRef, useState } from 'react'
import {
    deleteServiceRequestAttachments,
    downloadServiceRequestAttachment,
    getServiceRequestAttachments,
    uploadServiceRequestAttachment,
} from '../../api/client.js'
import { getAuthToken } from '../../auth/session.js'
import { useToast } from '../../components/toast/ToastProvider.jsx'
import { toSafeUserMessage } from '../../utils/toSafeUserMessage.js'
import '../administration/users/UsersPage.css'
import './ServiceRequestPage.css'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'png', 'jpg', 'jpeg', 'gif']
const INLINE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'txt']

function extensionOf(fileName) {
    const dot = fileName.lastIndexOf('.')
    return dot < 0 ? '' : fileName.slice(dot + 1).toLowerCase()
}

function iconFor(fileName) {
    const extension = extensionOf(fileName)
    if (extension === 'pdf') return '📕'
    if (['doc', 'docx'].includes(extension)) return '📘'
    if (['xls', 'xlsx', 'csv'].includes(extension)) return '📗'
    if (['ppt', 'pptx'].includes(extension)) return '📙'
    if (['png', 'jpg', 'jpeg', 'gif'].includes(extension)) return '🖼️'
    return '📄'
}

export default function AttachmentsPopup({ srId, pendingFiles = [], onPendingChange, editable, onClose }) {
    const toast = useToast()
    const fileInput = useRef(null)
    const [attachments, setAttachments] = useState([])
    const [selectedIds, setSelectedIds] = useState([])
    const [isLoading, setIsLoading] = useState(Boolean(srId))
    const isLocal = !srId
    const localAttachments = pendingFiles.map((file, index) => ({ id: index, fileName: file.name, file }))
    const visibleAttachments = isLocal ? localAttachments : attachments
    const [isBusy, setIsBusy] = useState(false)

    useEffect(() => {
        if (!srId) {
            return undefined
        }

        let isMounted = true

        getServiceRequestAttachments(srId, getAuthToken())
            .then((result) => isMounted && setAttachments(result))
            .catch(() => isMounted && toast.error(toSafeUserMessage('Unable to load attachments right now.')))
            .finally(() => isMounted && setIsLoading(false))

        return () => {
            isMounted = false
        }
    }, [srId])

    function validateFile(file) {
        if (!ALLOWED_EXTENSIONS.includes(extensionOf(file.name))) {
            return 'This file type is not allowed.'
        }
        if (file.size > MAX_FILE_BYTES) {
            return 'File size must not exceed 5 MB.'
        }
        return ''
    }

    async function handleFileChosen(event) {
        const file = event.target.files?.[0]
        event.target.value = ''

        if (!file) {
            return
        }

        const problem = validateFile(file)
        if (problem) {
            toast.error(toSafeUserMessage(problem))
            return
        }

        if (isLocal) {
            onPendingChange([...pendingFiles, file])
            return
        }

        setIsBusy(true)
        try {
            setAttachments(await uploadServiceRequestAttachment(srId, file, getAuthToken()))
        } catch (requestError) {
            toast.error(toSafeUserMessage(requestError?.details?.message ?? 'Unable to attach file right now.'))
        } finally {
            setIsBusy(false)
        }
    }

    async function handleDelete() {
        if (selectedIds.length === 0) {
            toast.error(toSafeUserMessage('Select at least one file to delete.'))
            return
        }

        if (isLocal) {
            onPendingChange(pendingFiles.filter((_, index) => !selectedIds.includes(index)))
            setSelectedIds([])
            return
        }

        setIsBusy(true)
        try {
            setAttachments(await deleteServiceRequestAttachments(srId, selectedIds, getAuthToken()))
            setSelectedIds([])
        } catch {
            toast.error(toSafeUserMessage('Unable to delete attachments right now.'))
        } finally {
            setIsBusy(false)
        }
    }

    async function handleView(attachment) {
        try {
            const blob = isLocal ? attachment.file : await downloadServiceRequestAttachment(srId, attachment.id, getAuthToken())
            const url = URL.createObjectURL(blob)

            if (INLINE_EXTENSIONS.includes(extensionOf(attachment.fileName))) {
                window.open(url, '_blank', 'noopener')
            } else {
                const link = document.createElement('a')
                link.href = url
                link.download = attachment.fileName
                link.click()
            }
            window.setTimeout(() => URL.revokeObjectURL(url), 60000)
        } catch {
            toast.error(toSafeUserMessage('Unable to open attachment right now.'))
        }
    }

    function toggle(id) {
        setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
    }

    return (
        <div className="confirm-popup-overlay" role="presentation" onClick={onClose}>
            <div
                className="confirm-popup sr-attachments-popup"
                role="dialog"
                aria-modal="true"
                aria-labelledby="sr-attachments-title"
                onClick={(event) => event.stopPropagation()}
            >
                <h2 className="confirm-popup-title" id="sr-attachments-title">
                    Attachments
                </h2>

                {isLoading ? (
                    <p className="grid-status">Loading attachments...</p>
                ) : visibleAttachments.length === 0 ? (
                    <p className="sr-attachments-empty">No attachments added.</p>
                ) : (
                    <ul className="sr-attachments-list">
                        {visibleAttachments.map((attachment) => (
                            <li key={attachment.id} className="sr-attachments-item">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(attachment.id)}
                                    disabled={!editable}
                                    onChange={() => toggle(attachment.id)}
                                    aria-label={`Select ${attachment.fileName}`}
                                />
                                <span className="sr-attachments-icon" aria-hidden="true">
                  {iconFor(attachment.fileName)}
                </span>
                                <span className="sr-attachments-name" title={attachment.fileName}>
                  {attachment.fileName}
                </span>
                                <button type="button" className="sr-button sr-button-small" onClick={() => handleView(attachment)}>
                                    View
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="sr-attachments-actions sr-attachments-footer">
                    <input
                        ref={fileInput}
                        type="file"
                        hidden
                        accept={ALLOWED_EXTENSIONS.map((extension) => `.${extension}`).join(',')}
                        onChange={handleFileChosen}
                    />
                    <button
                        type="button"
                        className="create-user-button"
                        disabled={isBusy || !editable}
                        onClick={() => fileInput.current?.click()}
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                        </svg>
                        Choose File
                    </button>
                    <button
                        type="button"
                        className="create-user-button"
                        disabled={isBusy || !editable || selectedIds.length === 0}
                        onClick={handleDelete}
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M9 3h6l1 2h4v2H4V5h4zM6 9h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2zm4 3v7h2v-7zm4 0v7h2v-7z" />
                        </svg>
                        Delete
                    </button>
                </div>

            </div>
        </div>
    )
}
