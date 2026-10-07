import { useNavigate } from 'react-router-dom'
import Form from '../../../components/form/Form.jsx'
import { clearGridCache, createNewUser, validateUserData } from '../../../api/client.js'
import { getAuthToken } from '../../../auth/session.js'
import { useToast } from '../../../components/toast/ToastProvider.jsx'
import { toSafeUserMessage } from '../../../utils/toSafeUserMessage.js'

const EMAIL_DOMAIN = '@nxtgen.com'
const USERS_GRID_NAME = 'USERS_GRID'

function normalize(value) {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function computeDerivedFields(values, fields = []) {
    const firstName = values.firstName?.trim() ?? ''
    const lastName = values.lastName?.trim() ?? ''

    const roleField = fields.find((field) => field.dataField === 'roleId')
    const selectedRole = roleField?.options?.find((option) => option.value === values.roleId)
    const isSuperAdminRole = /super\s*admin/i.test(selectedRole?.label ?? '')

    return {
        emplNm: firstName || lastName ? `${firstName} ${lastName}`.trim() : '',
        emailAddress: firstName && lastName ? `${normalize(firstName)}.${normalize(lastName)}${EMAIL_DOMAIN}` : '',
        isSuperAdmin: isSuperAdminRole ? 'Y' : 'N',
    }
}

export default function CreateUserPage() {
    const navigate = useNavigate()
    const toast = useToast()

    function toPayload(values) {
        return {
            firstName: values.firstName,
            lastName: values.lastName,
            password: values.password,
            roleId: values.roleId ? Number(values.roleId) : null,
            isSuperAdmin: values.isSuperAdmin,
        }
    }

    async function handleSubmit(values) {
        const token = getAuthToken()
        const payload = toPayload(values)

        try {
            const validation = await validateUserData(payload, token)

            if (!validation.valid) {
                toast.error(toSafeUserMessage('Please correct the highlighted fields.'))
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
        <section>
            <h1>Create User</h1>
            <Form formName="CREATE_USER_FORM" computeFields={computeDerivedFields} onSubmit={handleSubmit} />
        </section>
    )
}
