import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Form from '../../../components/form/Form.jsx'
import { clearGridCache, getUserById, searchGroups, updateUser } from '../../../api/client.js'
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

    useEffect(() => {
        let isMounted = true

        async function loadUser() {
            try {
                const token = getAuthToken()
                const details = await getUserById(id, token)

                if (isMounted) {
                    setInitialValues({
                        userId: details.userId != null ? String(details.userId) : '',
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

    if (loadError) {
        return (
            <section>
                <h1>Edit User</h1>
                <p className="grid-status grid-status-error">{loadError}</p>
            </section>
        )
    }

    if (!initialValues) {
        return (
            <section>
                <h1>Edit User</h1>
                <p className="grid-status">Loading user...</p>
            </section>
        )
    }

    return (
        <section>
            <h1>Edit User</h1>
            <Form
                formName="EDIT_USER_FORM"
                computeFields={computeDerivedFields}
                initialValues={initialValues}
                searchHandlers={searchHandlers}
                submitLabel="Save"
                onSubmit={handleSubmit}
            />
        </section>
    )
}
