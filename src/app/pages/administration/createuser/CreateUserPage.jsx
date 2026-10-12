import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import UserRecordHeader from '../users/UserRecordHeader.jsx'
import UserAssignments from '../users/UserAssignments.jsx'
import Form from '../../../components/form/Form.jsx'
import {
    clearGridCache,
    createNewUser,
    fetchUserDetails,
    searchGroups,
    searchManagers,
    searchUserDetails,
    validateUserData,
} from '../../../api/client.js'
import { getAuthToken } from '../../../auth/session.js'
import { useToast } from '../../../components/toast/ToastProvider.jsx'
import { toSafeUserMessage } from '../../../utils/toSafeUserMessage.js'

const USERS_GRID_NAME = 'USERS_GRID'

function computeDerivedFields(values, fields = []) {
    const firstName = values.firstName?.trim() ?? ''
    const lastName = values.lastName?.trim() ?? ''

    const roleField = fields.find((field) => field.dataField === 'roleId')
    const selectedRoleIds = values.roleId ?? []
    const isSuperAdminRole = (roleField?.options ?? [])
        .filter((option) => selectedRoleIds.includes(option.value))
        .some((option) => /super\s*admin/i.test(option.label ?? ''))

    return {
        emplNm: firstName || lastName ? `${firstName} ${lastName}`.trim() : '',
        isSuperAdmin: isSuperAdminRole ? 'Y' : 'N',
    }
}

export default function CreateUserPage() {
    const navigate = useNavigate()
    const toast = useToast()
    const formApi = useRef(null)
    const [formBusy, setFormBusy] = useState(true)

    const searchHandlers = {
        manager: {
            search: (query) => searchManagers(query, getAuthToken()),
            onSelect: async (option) => ({ manager: option.label, managerId: option.value, managerSelectedLabel: option.label }),
        },
        userId: {
            resetFormOnClear: true,
            search: async (query) => {
                const token = getAuthToken()
                const results = await searchUserDetails(query, token)
                return results.map((item) => ({
                    value: String(item.id),
                    label: `${item.id} - ${item.emplNm}`,
                    id: item.id,
                }))
            },
            onSelect: async (option) => {
                const token = getAuthToken()
                const details = await fetchUserDetails(option.id, token)
                return {
                    userId: String(details.id),
                    firstName: details.firstName,
                    lastName: details.lastName,
                    emplNm: details.emplNm,
                    emailAddress: details.emailAddress,
                }
            },
        },
        groupIds: {
            search: async (query) => {
                const token = getAuthToken()
                const results = await searchGroups(query, token)
                return results.map((item) => ({ value: String(item.value), label: item.label }))
            },
        },
    }

    function toPayload(values) {
        return {
            userId: values.userId ? Number(values.userId) : null,
            managerId: values.manager && values.manager === values.managerSelectedLabel ? Number(values.managerId) : null,
            firstName: values.firstName,
            lastName: values.lastName,
            emailAddress: values.emailAddress,
            password: values.password,
            roleIds: (values.roleId ?? []).map(Number),
            groupIds: (values.groupIds ?? []).map((item) => Number(item.value)),
            isSuperAdmin: values.isSuperAdmin,
            passwordResetRequired: values.passwordResetRequired,
            isActive: values.isActive,
        }
    }

    async function handleSubmit(values) {
        const token = getAuthToken()
        const payload = toPayload(values)

        try {
            const validation = await validateUserData(payload, token)

            if (!validation.valid) {
                const message = validation.errors?.userId
                    ? 'User is already exist in NxtGen'
                    : 'Please correct the highlighted fields.'
                toast.error(toSafeUserMessage(message))
                return { fieldErrors: validation.errors }
            }

            await createNewUser(payload, token)
            clearGridCache(USERS_GRID_NAME)
            toast.success(toSafeUserMessage('User created successfully.'))
            navigate('/administration/users')
            return undefined
        } catch (requestError) {
            const fieldErrors = requestError?.details?.errors
            toast.error(toSafeUserMessage(requestError?.details?.message ?? 'Unable to create user right now.'))
            return fieldErrors ? { fieldErrors } : undefined
        }
    }

    return (
        <section className="sr-page">
            <UserRecordHeader title="Create User" record="New" formId="create-user-form" submitLabel="Submit" busy={formBusy}
                onBack={() => navigate('/administration/users')} onClear={() => formApi.current?.reset()} />
            <Form
                formId="create-user-form"
                apiRef={formApi}
                onStatusChange={setFormBusy}
                hideActions
                excludeFields={['roleId', 'groupIds']}
                renderRelated={(props) => <UserAssignments {...props} isNew />}
                formName="CREATE_USER_FORM"
                computeFields={computeDerivedFields}
                searchHandlers={searchHandlers}
                onSubmit={handleSubmit}
            />
        </section>
    )
}
