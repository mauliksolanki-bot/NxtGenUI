import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Form from '../../../components/form/Form.jsx'
import { clearGridCache, getGroupById, searchGroupOwners, updateGroup } from '../../../api/client.js'
import { getAuthToken } from '../../../auth/session.js'
import { useToast } from '../../../components/toast/ToastProvider.jsx'
import { toSafeUserMessage } from '../../../utils/toSafeUserMessage.js'

const GROUPS_TEAMS_GRID_NAME = 'NXTGEN_GRP_TEAMS'

export default function EditGroupPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const toast = useToast()
    const [initialValues, setInitialValues] = useState(null)
    const [loadError, setLoadError] = useState('')

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

    useEffect(() => {
        let isMounted = true

        async function loadGroup() {
            try {
                const token = getAuthToken()
                const details = await getGroupById(id, token)

                if (isMounted) {
                    setInitialValues({
                        grpName: details.grpName ?? '',
                        grpDescription: details.grpDescription ?? '',
                        groupOwner: details.groupOwner ?? '',
                        isActive: details.isActive ?? 'Y',
                    })
                }
            } catch {
                if (isMounted) {
                    setLoadError(toSafeUserMessage('Unable to load group details right now.'))
                }
            }
        }

        loadGroup()

        return () => {
            isMounted = false
        }
    }, [id])

    function toPayload(values) {
        return {
            id: Number(id),
            grpName: values.grpName,
            grpDescription: values.grpDescription,
            groupOwner: values.groupOwner,
            isActive: values.isActive,
        }
    }

    async function handleSubmit(values) {
        const token = getAuthToken()
        const payload = toPayload(values)

        try {
            await updateGroup(payload, token)
            clearGridCache(GROUPS_TEAMS_GRID_NAME)
            toast.success(toSafeUserMessage('Group updated successfully.'))
            navigate('/administration/groups')
            return undefined
        } catch (requestError) {
            const fieldErrors = requestError?.details?.errors
            toast.error(toSafeUserMessage(requestError?.details?.message ?? 'Unable to update group right now.'))
            return fieldErrors ? { fieldErrors } : undefined
        }
    }

    if (loadError) {
        return (
            <section>
                <h1>Edit Group</h1>
                <p className="grid-status grid-status-error">{loadError}</p>
            </section>
        )
    }

    if (!initialValues) {
        return (
            <section>
                <h1>Edit Group</h1>
                <p className="grid-status">Loading group...</p>
            </section>
        )
    }

    return (
        <section>
            <h1>Edit Group</h1>
            <Form
                formName="EDIT_GROUP_FORM"
                searchHandlers={searchHandlers}
                initialValues={initialValues}
                submitLabel="Save"
                onSubmit={handleSubmit}
            />
        </section>
    )
}
