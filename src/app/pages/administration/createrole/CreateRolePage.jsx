import { useNavigate } from 'react-router-dom'
import Form from '../../../components/form/Form.jsx'
import { clearGridCache, createNewRole } from '../../../api/client.js'
import { useToast } from '../../../components/toast/ToastProvider.jsx'
import { toSafeUserMessage } from '../../../utils/toSafeUserMessage.js'

const ROLES_GRID_NAME = 'ROLES_GRID'

export default function CreateRolePage() {
    const navigate = useNavigate()
    const toast = useToast()

    function toPayload(values) {
        return {
            roleName: values.roleName,
            description: values.description,
            isActive: values.isActive,
        }
    }

    async function handleSubmit(values) {
        const payload = toPayload(values)

        try {
            await createNewRole(payload)
            clearGridCache(ROLES_GRID_NAME)
            toast.success(toSafeUserMessage('Role created successfully.'))
            navigate('/administration/roles')
            return undefined
        } catch (requestError) {
            const fieldErrors = requestError?.details?.errors
            toast.error(toSafeUserMessage(requestError?.details?.message ?? 'Unable to create role right now.'))
            return fieldErrors ? { fieldErrors } : undefined
        }
    }

    return (
        <section>
            <h1>Create Role</h1>
            <Form formName="CREATE_ROLE_FORM" onSubmit={handleSubmit} submitLabel="Save" />
        </section>
    )
}
