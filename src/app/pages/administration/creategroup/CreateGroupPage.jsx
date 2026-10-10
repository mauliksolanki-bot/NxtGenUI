import { useNavigate } from 'react-router-dom'
import Form from '../../../components/form/Form.jsx'
import { clearGridCache, createGroup, searchGroupOwners } from '../../../api/client.js'
import { getAuthToken } from '../../../auth/session.js'
import { useToast } from '../../../components/toast/ToastProvider.jsx'
import { toSafeUserMessage } from '../../../utils/toSafeUserMessage.js'

const GROUPS_TEAMS_GRID_NAME = 'NXTGEN_GRP_TEAMS'

export default function CreateGroupPage() {
    const navigate = useNavigate()
    const toast = useToast()

    const searchHandlers = {
        groupOwner: {
            search: async (query) => {
                const token = getAuthToken()
                const results = await searchGroupOwners(query, token)
                return results.map((option) => ({ value: option.value, label: option.label }))
            },
            onSelect: async (option) => ({ groupOwner: option.label }),
        },
    }

    function toPayload(values) {
        return {
            grpName: values.grpName,
            grpDescription: values.grpDescription,
            groupOwner: values.groupOwner,
            isActive: values.isActive,
        }
    }

    async function handleSubmit(values) {
        const payload = toPayload(values)

        try {
            await createGroup(payload)
            clearGridCache(GROUPS_TEAMS_GRID_NAME)
            toast.success(toSafeUserMessage('Group created successfully.'))
            navigate('/administration/groups')
            return undefined
        } catch (requestError) {
            const fieldErrors = requestError?.details?.errors
            toast.error(toSafeUserMessage(requestError?.details?.message ?? 'Unable to create group right now.'))
            return fieldErrors ? { fieldErrors } : undefined
        }
    }

    return (
        <section>
            <h1>Create Group</h1>
            <Form formName="CREATE_GROUP_FORM" searchHandlers={searchHandlers} onSubmit={handleSubmit} submitLabel="Save" />
        </section>
    )
}
