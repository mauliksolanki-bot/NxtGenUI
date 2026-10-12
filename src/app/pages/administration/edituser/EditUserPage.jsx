import { useEffect, useRef, useState } from 'react'
import UserRecordHeader from '../users/UserRecordHeader.jsx'
import UserAssignments from '../users/UserAssignments.jsx'
import { useNavigate, useParams } from 'react-router-dom'
import Form from '../../../components/form/Form.jsx'
import { clearGridCache, getUserById, searchGroups, searchManagers, updateUser } from '../../../api/client.js'
import { getAuthToken } from '../../../auth/session.js'
import { useToast } from '../../../components/toast/ToastProvider.jsx'
import { toSafeUserMessage } from '../../../utils/toSafeUserMessage.js'

const USERS_GRID_NAME = 'USERS_GRID'

function computeDerivedFields(values, fields = []) {
    const roleField = fields.find((field) => field.dataField === 'roleId')
    const selectedRoleIds = values.roleId ?? []
    const isSuperAdminRole = (roleField?.options ?? [])
        .filter((option) => selectedRoleIds.includes(option.value))
        .some((option) => /super\s*admin/i.test(option.label ?? ''))

    return {
        isSuperAdmin: isSuperAdminRole ? 'Y' : 'N',
    }
}

export default function EditUserPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const toast = useToast()
    const [initialValues, setInitialValues] = useState(null)
    const [loadError, setLoadError] = useState('')
    const formApi = useRef(null)
    const [formBusy, setFormBusy] = useState(true)

    useEffect(() => {
        let isMounted = true

        async function loadUser() {
            try {
                const token = getAuthToken()
                const details = await getUserById(id, token)

                if (isMounted) {
                    setInitialValues({
                        userId: details.userId != null ? String(details.userId) : '',
                        manager: details.managerName ?? '',
                        managerId: details.managerId != null ? String(details.managerId) : '',
                        managerSelectedLabel: details.managerName ?? '',
                        firstName: details.firstName ?? '',
                        lastName: details.lastName ?? '',
                        emplNm: details.emplNm ?? '',
                        username: details.username ?? '',
                        emailAddress: details.emailAddress ?? '',
                        roleId: (details.roleIds ?? []).map(String),
                        groupIds: (details.groups ?? []).map((group) => ({
                            value: String(group.value),
                            label: group.label,
                        })),
                        isSuperAdmin: details.isSuperAdmin ?? 'N',
                        passwordResetRequired: details.passwordResetRequired ?? 'N',
                        isActive: details.isActive ?? 'Y',
                    })
                }
            } catch {
                if (isMounted) {
                    setLoadError(toSafeUserMessage('Unable to load user details right now.'))
                }
            }
        }

        loadUser()

        return () => {
            isMounted = false
        }
    }, [id])

    function toPayload(values) {
        return {
            id: Number(id),
            managerId: values.manager && values.manager === values.managerSelectedLabel ? Number(values.managerId) : null,
            userId: values.userId ? Number(values.userId) : null,
            firstName: values.firstName,
            lastName: values.lastName,
            emailAddress: values.emailAddress,
            roleIds: (values.roleId ?? []).map(Number),
            groupIds: (values.groupIds ?? []).map((item) => Number(item.value)),
            isSuperAdmin: values.isSuperAdmin,
            passwordResetRequired: values.passwordResetRequired,
            isActive: values.isActive,
        }
    }

    const searchHandlers = {
        manager: {
            search: (query) => searchManagers(query, getAuthToken(), id),
            onSelect: async (option) => ({ manager: option.label, managerId: option.value, managerSelectedLabel: option.label }),
        },
        groupIds: {
            search: async (query) => {
                const token = getAuthToken()
                const results = await searchGroups(query, token)
                return results.map((item) => ({ value: String(item.value), label: item.label }))
            },
        },
    }

    async function handleSubmit(values) {
        const token = getAuthToken()
        const payload = toPayload(values)

        try {
            await updateUser(payload, token)
            clearGridCache(USERS_GRID_NAME)
            toast.success(toSafeUserMessage('User updated successfully.'))
            navigate('/administration/users')
            return undefined
        } catch (requestError) {
            const fieldErrors = requestError?.details?.errors
            toast.error(toSafeUserMessage(requestError?.details?.message ?? 'Unable to update user right now.'))
            return fieldErrors ? { fieldErrors } : undefined
        }
    }

    return (
        <section className="sr-page">
            <UserRecordHeader title="Edit User" record={initialValues?.emplNm || initialValues?.username || `User ${id}`} formId="edit-user-form" submitLabel="Update"
                busy={formBusy || !initialValues || Boolean(loadError)} onBack={() => navigate('/administration/users')} onClear={() => formApi.current?.reset()} />
            {loadError ? <p className="grid-status grid-status-error" role="alert">{loadError}</p> : !initialValues ? <p className="grid-status">Loading user...</p> : <Form
                formId="edit-user-form"
                apiRef={formApi}
                onStatusChange={setFormBusy}
                hideActions
                excludeFields={['roleId', 'groupIds']}
                renderRelated={(props) => <UserAssignments {...props} />}
                formName="EDIT_USER_FORM"
                computeFields={computeDerivedFields}
                initialValues={initialValues}
                searchHandlers={searchHandlers}
                submitLabel="Save"
                onSubmit={handleSubmit}
            />}
        </section>
    )
}
