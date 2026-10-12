import { useEffect, useRef, useState } from 'react'
import {
    deleteServiceRequestAttachments,
    downloadServiceRequestAttachment,
    getServiceRequestAttachments,
    uploadServiceRequestAttachment,
    renameServiceRequestAttachment,
} from '../../api/client.js'
import { getAuthToken } from '../../auth/session.js'
import { useToast } from '../../components/toast/ToastProvider.jsx'
import { toSafeUserMessage } from '../../utils/toSafeUserMessage.js'
import '../administration/users/UsersPage.css'
import './ServiceRequestPage.css'
import './AttachmentsPopup.css'

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
    const popup = useRef(null)
    const [renaming, setRenaming] = useState(null)
    const [newName, setNewName] = useState('')
    const [attachments, setAttachments] = useState([])
    const [selectedIds, setSelectedIds] = useState([])
    const [isLoading, setIsLoading] = useState(Boolean(srId))
    const isLocal = !srId
    const localAttachments = pendingFiles.map((file, index) => ({ id: index, fileName: file.name, file }))
    const visibleAttachments = isLocal ? localAttachments : attachments
    const [isBusy, setIsBusy] = useState(false)

    useEffect(() => {
        const previousFocus = document.activeElement
        popup.current.showModal()
        return () => previousFocus?.focus()
    }, [])

    async function handleRename() {
        if (!renaming || isBusy) return
        const name = newName.trim()
        if (!name || name.length > 255 || /[\\/\x00-\x1f\x7f]/.test(name) || extensionOf(name) !== extensionOf(renaming.fileName)) {
            toast.error('Enter a valid file name and keep the original extension.')
            return
        }
        setIsBusy(true)
        try {
            if (isLocal) onPendingChange(pendingFiles.map((file, index) => index === renaming.id ? new File([file], name, { type: file.type, lastModified: file.lastModified }) : file))
            else setAttachments(await renameServiceRequestAttachment(srId, renaming.id, name, getAuthToken()))
            setRenaming(null)
        } catch { toast.error('Unable to rename attachment right now.') }
        finally { setIsBusy(false) }
    }

    async function handleDownloadAll() {
        setIsBusy(true)
        try {
            for (const attachment of visibleAttachments) {
                const blob = isLocal ? attachment.file : await downloadServiceRequestAttachment(srId, attachment.id, getAuthToken())
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = attachment.fileName
                link.click()
                window.setTimeout(() => URL.revokeObjectURL(url), 60000)
            }
        } catch { toast.error('Unable to download all attachments right now.') }
        finally { setIsBusy(false) }
    }

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
        <dialog ref={popup} className="attachments-dialog" aria-labelledby="sr-attachments-title" onCancel={(event) => { event.preventDefault(); if (!isBusy) onClose() }}>
            <header className="attachments-dialog-header"><h2 id="sr-attachments-title">Attachments</h2><button type="button" aria-label="Close attachments" title="Close" disabled={isBusy} onClick={onClose}>×</button></header>
            <input ref={fileInput} type="file" hidden accept={ALLOWED_EXTENSIONS.map((extension) => `.${extension}`).join(',')} onChange={handleFileChosen} />
            {isLoading ? <p className="grid-status" role="status">Loading attachments...</p> : visibleAttachments.length === 0 ? <div className="attachments-empty-state">
                <svg viewBox="0 0 220 190" aria-hidden="true"><ellipse cx="110" cy="178" rx="58" ry="6" fill="#e6eef1" /><path d="M75 15h60l30 30v113q0 18-18 18H75q-18 0-18-18V33q0-18 18-18z" fill="#fff" stroke="#c8d9df" strokeWidth="2.5" /><path d="M135 15v22q0 8 8 8h22" fill="#f4f8f9" stroke="#c8d9df" strokeWidth="2.5" /><path d="M130 105l-17 22q-12 15-25 5t-2-24l26-32q8-10 17-3t2 17l-25 31q-4 5-8 1t0-9l18-23" fill="none" stroke="#55adc4" strokeWidth="7" strokeLinecap="round" /><path d="M30 65h8m142-20h12M22 139h12m145-22h15" stroke="#d4e2e7" strokeWidth="2" strokeDasharray="4 5" /></svg>
                <p>There are no attachments</p><button type="button" className="attachments-choose" disabled={isBusy || !editable} onClick={() => fileInput.current?.click()}>Choose file</button>
            </div> : <div className="attachments-dialog-body">
                <button type="button" className="attachments-choose" disabled={isBusy || !editable} onClick={() => fileInput.current?.click()}>Choose file</button>
                <ul className="attachments-files">{visibleAttachments.map((attachment) => <li key={attachment.id}>
                    <input type="checkbox" checked={selectedIds.includes(attachment.id)} disabled={isBusy || !editable} onChange={() => toggle(attachment.id)} aria-label={`Select ${attachment.fileName}`} />
                    <span aria-hidden="true">{iconFor(attachment.fileName)}</span><button type="button" className="attachments-link attachments-file-name" disabled={isBusy} onClick={() => handleView(attachment)}>{attachment.fileName}</button>
                    {editable ? <button type="button" className="attachments-link" disabled={isBusy} onClick={() => { setRenaming(attachment); setNewName(attachment.fileName) }}>[rename]</button> : null}<button type="button" className="attachments-link" disabled={isBusy} onClick={() => handleView(attachment)}>[view]</button>
                </li>)}</ul>
                {renaming ? <div className="attachments-rename"><label htmlFor="attachment-new-name">File name</label><input id="attachment-new-name" autoFocus maxLength={255} value={newName} disabled={isBusy} onChange={(event) => setNewName(event.target.value)} /><button type="button" className="attachments-outline" disabled={isBusy} onClick={handleRename}>Save</button><button type="button" className="attachments-outline" disabled={isBusy} onClick={() => setRenaming(null)}>Cancel</button></div> : null}
                <footer className="attachments-dialog-footer"><button type="button" className="attachments-outline" disabled={isBusy} onClick={handleDownloadAll}>Download All</button><button type="button" className="attachments-outline attachments-remove" disabled={isBusy || !editable || !selectedIds.length} onClick={handleDelete}>Remove</button></footer>
            </div>}
        </dialog>
    )
}
