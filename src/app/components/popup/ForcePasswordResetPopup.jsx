import { useEffect, useState } from 'react'
import Form from '../form/Form.jsx'
import { changePassword, getPopupConfig } from '../../api/client.js'
import { getAuthToken } from '../../auth/session.js'
import { useToast } from '../toast/ToastProvider.jsx'
import { toSafeUserMessage } from '../../utils/toSafeUserMessage.js'
import './ConfirmPopup.css'

const POPUP_NAME = 'FORCE_PASSWORD_RESET'
const FORM_NAME = 'CHANGE_PASSWORD_FORM'

/**
 * Blocking popup shown after login when the user must reset their password.
 * Title/message come from NXTGEN_POPUP_CONFIG and the form (fields, button
 * label) from NXTGEN_FORM / NXTGEN_FORM_FIELDS. It cannot be dismissed.
 */
export default function ForcePasswordResetPopup({ onCompleted }) {
    const toast = useToast()
    const [title, setTitle] = useState('Reset Your Password')
    const [message, setMessage] = useState('')

    useEffect(() => {
        let isMounted = true

        getPopupConfig(POPUP_NAME, getAuthToken())
            .then((config) => {
                if (isMounted && config?.enabled) {
                    setTitle(config.title ?? '')
                    setMessage(config.displayMsg ?? '')
                }
            })
            .catch(() => {})

        return () => {
            isMounted = false
        }
    }, [])

    async function handleSubmit(values) {
        try {
            await changePassword(
                { newPassword: values.newPassword, confirmPassword: values.confirmPassword },
                getAuthToken()
            )
            toast.success(toSafeUserMessage('Password changed successfully.'))
            onCompleted()
            return undefined
        } catch (requestError) {
            const fieldErrors = requestError?.details?.errors
            toast.error(toSafeUserMessage(requestError?.details?.message ?? 'Unable to change password right now.'))
            return fieldErrors ? { fieldErrors } : undefined
        }
    }

    return (
        <div className="confirm-popup-overlay" role="presentation">
            <div className="confirm-popup force-reset-popup" role="dialog" aria-modal="true">
                {title ? <h2 className="confirm-popup-title">{title}</h2> : null}
                {message ? <p className="confirm-popup-message">{message}</p> : null}
                <Form formName={FORM_NAME} onSubmit={handleSubmit} showClear={false} actionsOutside submitLabel="Change Password" />
            </div>
        </div>
    )
}
