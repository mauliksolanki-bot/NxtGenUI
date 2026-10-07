import { useEffect, useMemo, useState } from 'react'
import { getFormConfig } from '../../api/client.js'
import { getAuthToken } from '../../auth/session.js'
import { toSafeUserMessage } from '../../utils/toSafeUserMessage.js'
import './Form.css'

function buildInitialValues(fields) {
    return fields.reduce((acc, field) => {
        acc[field.dataField] = field.defaultValue ?? ''
        return acc
    }, {})
}

export default function Form({ formName, computeFields, onSubmit, submitLabel = 'Submit', clearLabel = 'Clear' }) {
    const [config, setConfig] = useState(null)
    const [values, setValues] = useState({})
    const [fieldErrors, setFieldErrors] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        let isMounted = true

        async function loadConfig() {
            try {
                const formConfig = await getFormConfig(formName, getAuthToken())

                if (isMounted) {
                    setConfig(formConfig)
                    const initialValues = buildInitialValues(formConfig.fields ?? [])
                    const computed = computeFields ? computeFields(initialValues, formConfig.fields ?? []) : {}
                    setValues({ ...initialValues, ...computed })
                    setError('')
                }
            } catch {
                if (isMounted) {
                    setError(toSafeUserMessage('Unable to load the form right now.'))
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadConfig()

        return () => {
            isMounted = false
        }
    }, [formName])

    const fields = useMemo(() => config?.fields ?? [], [config])

    function handleChange(dataField, value) {
        setValues((previous) => {
            const next = { ...previous, [dataField]: value }
            const computed = computeFields ? computeFields(next, fields) : {}
            return { ...next, ...computed }
        })
        setFieldErrors((previous) => {
            if (!previous[dataField]) {
                return previous
            }
            const next = { ...previous }
            delete next[dataField]
            return next
        })
    }

    function handleClear() {
        const initialValues = buildInitialValues(fields)
        const computed = computeFields ? computeFields(initialValues, fields) : {}
        setValues({ ...initialValues, ...computed })
        setFieldErrors({})
    }

    async function handleSubmit(event) {
        event.preventDefault()

        if (isSubmitting) {
            return
        }

        setIsSubmitting(true)

        try {
            const result = await onSubmit(values)

            if (result?.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
                setFieldErrors(result.fieldErrors)
            } else {
                handleClear()
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return <p className="grid-status">Loading form...</p>
    }

    if (error) {
        return <p className="grid-status grid-status-error">{error}</p>
    }

    return (
        <form className="nxtgen-form-wrapper" onSubmit={handleSubmit} noValidate>
            <div className="nxtgen-form-grid">
                {fields.map((field) => (
                    <div className="form-field" key={field.id}>
                        <label className="form-field-label" htmlFor={field.dataField}>
                            {field.fieldLabel}
                            {field.mandatory ? <span className="form-field-mandatory">*</span> : null}
                        </label>
                        {field.fieldType === 'DROPDOWN' ? (
                            <select
                                id={field.dataField}
                                className="form-field-select"
                                value={values[field.dataField] ?? ''}
                                onChange={(event) => handleChange(field.dataField, event.target.value)}
                                disabled={field.readOnly}
                            >
                                <option value="" disabled>
                                    {field.placeholder || 'Select an option'}
                                </option>
                                {(field.options ?? []).map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                id={field.dataField}
                                className="form-field-input"
                                type={field.fieldType === 'PASSWORD' ? 'password' : 'text'}
                                placeholder={field.placeholder || ''}
                                readOnly={field.readOnly}
                                value={values[field.dataField] ?? ''}
                                onChange={(event) => handleChange(field.dataField, event.target.value)}
                            />
                        )}
                        {fieldErrors[field.dataField] ? (
                            <span className="form-field-error">{fieldErrors[field.dataField]}</span>
                        ) : null}
                    </div>
                ))}
                <div className="form-actions">
                    <button type="submit" className="form-submit-button" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : submitLabel}
                    </button>
                    <button type="button" className="form-clear-button" onClick={handleClear} disabled={isSubmitting}>
                        {clearLabel}
                    </button>
                </div>
            </div>
        </form>
    )
}
