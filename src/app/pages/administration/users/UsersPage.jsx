import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Grid from '../../../components/grid/Grid.jsx'
import ConfirmPopup from '../../../components/popup/ConfirmPopup.jsx'
import { clearGridCache, deleteUser } from '../../../api/client.js'
import { getAuthToken } from '../../../auth/session.js'
import { useToast } from '../../../components/toast/ToastProvider.jsx'
import { toSafeUserMessage } from '../../../utils/toSafeUserMessage.js'
import './UsersPage.css'

const USERS_GRID_NAME = 'USERS_GRID'

export default function UsersPage() {
    const navigate = useNavigate()
    const toast = useToast()
    const [userPendingDeletion, setUserPendingDeletion] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [refreshToken, setRefreshToken] = useState(0)

    function handleDeleteClick(row) {
        setUserPendingDeletion(row)
    }

    function handleCancelDelete() {
        if (isDeleting) {
            return
        }
        setUserPendingDeletion(null)
    }

    async function handleConfirmDelete() {
        if (!userPendingDeletion) {
            return
        }

        setIsDeleting(true)

        try {
            await deleteUser(userPendingDeletion.id, getAuthToken())
            clearGridCache(USERS_GRID_NAME)
            setRefreshToken((value) => value + 1)
            toast.success(toSafeUserMessage('User deleted successfully.'))
            setUserPendingDeletion(null)
        } catch {
            toast.error(toSafeUserMessage('Unable to delete user right now.'))
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <section>
            <div className="page-header-row">
                <h1>Users</h1>
                <button
                    type="button"
                    className="create-user-button"
                    onClick={() => navigate('/administration/createuser')}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M15 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 20a7 7 0 0 1 11-5.7V16h-1a2 2 0 0 0-2 2v2H6a2 2 0 0 1-2-2zm15-3h2v2h2v2h-2v2h-2v-2h-2v-2h2z" />
                    </svg>
                    Create User
                </button>
            </div>
            <Grid
                gridName={USERS_GRID_NAME}
                refreshToken={refreshToken}
                renderActions={(row) => (
                    <>
                        <button type="button" className="grid-action-button" title="Edit" aria-label="Edit">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M4 20.5h4.5l10-10-4.5-4.5-10 10zm13.3-13.3 1.7-1.7a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-1.7 1.7z" />
                            </svg>
                        </button>
                        <button type="button" className="grid-action-button" title="Lock" aria-label="Lock">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V7a3 3 0 0 0-6 0z" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="grid-action-button grid-action-button-danger"
                            title="Delete"
                            aria-label="Delete"
                            onClick={() => handleDeleteClick(row)}
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M9 3h6l1 2h4v2H4V5h4zM6 9h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2zm4 3v7h2v-7zm4 0v7h2v-7z" />
                            </svg>
                        </button>
                    </>
                )}
            />
            {userPendingDeletion ? (
                <ConfirmPopup
                    popupName="DELETE_USER_CONFIRM"
                    fallbackMessage="Are you sure you want to delete this user?"
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                    isBusy={isDeleting}
                />
            ) : null}
        </section>
    )
}
