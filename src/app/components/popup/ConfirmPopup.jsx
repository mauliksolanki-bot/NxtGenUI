import { useEffect, useState } from 'react'
import { getPopupConfig } from '../../api/client.js'
import { getAuthToken } from '../../auth/session.js'
import './ConfirmPopup.css'

/**
 * Metadata-driven confirmation dialog. Fetches its display message from the
 * NXTGEN_POPUP_CONFIG-backed /api/popupconfig endpoint instead of hard-coding
 * the warning text, so new confirmations only need a DB row to configure.
 */
export default function ConfirmPopup({ popupName, fallbackMessage, onConfirm, onCancel, isBusy }) {
    const [message, setMessage] = useState(fallbackMessage ?? '')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        async function loadPopupConfig() {
            try {
                const config = await getPopupConfig(popupName, getAuthToken())

                if (isMounted && config?.enabled) {
                    setMessage(config.displayMsg)
                }
            } catch {
                // Keep the fallback message if the popup config cannot be loaded.
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadPopupConfig()

        return () => {
            isMounted = false
        }
    }, [popupName])

    if (isLoading) {
        return null
    }

    return (
        <div className="confirm-popup-overlay" role="presentation" onClick={onCancel}>
            <div
                className="confirm-popup"
                role="alertdialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
            >
                <p className="confirm-popup-message">{message}</p>
                <div className="confirm-popup-actions">
                    <button type="button" className="confirm-popup-yes" onClick={onConfirm} disabled={isBusy}>
                        {isBusy ? 'Please wait...' : 'Yes'}
                    </button>
                    <button type="button" className="confirm-popup-no" onClick={onCancel} disabled={isBusy}>
                        No
                    </button>
                </div>
            </div>
        </div>
    )
}
