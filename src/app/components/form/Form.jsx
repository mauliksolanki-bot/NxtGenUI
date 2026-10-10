import { useEffect, useMemo, useRef, useState } from 'react'
import { getFormConfig } from '../../api/client.js'
import { getAuthToken } from '../../auth/session.js'
import { toSafeUserMessage } from '../../utils/toSafeUserMessage.js'
import './Form.css'

const SEARCH_DEBOUNCE_MS = 300

function buildInitialValues(fields, overrides = {}) {
    return fields.reduce((acc, field) => {
        const overrideValue = overrides[field.dataField]
        acc[field.dataField] =
            overrideValue !== undefined
                ? overrideValue
                : field.fieldType === 'MULTISELECT' || field.fieldType === 'SEARCHMULTISELECT'
                    ? []
                    : field.defaultValue ?? ''
        return acc
    }, {})
}

export default function Form({
                                 formName,
                                 computeFields,
                                 searchHandlers = {},
                                 initialValues: initialValuesProp,
                                 onSubmit,
                                 submitLabel = 'Submit',
                                 clearLabel = 'Clear',
                                 showClear = true,
                                 actionsOutside = false,
                             }) {
    const [config, setConfig] = useState(null)
    const [values, setValues] = useState({})
    const [fieldErrors, setFieldErrors] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [selectionError, setSelectionError] = useState('')
    const [searchResults, setSearchResults] = useState({})
    const [openSearchField, setOpenSearchField] = useState(null)
    const [openMultiSelectField, setOpenMultiSelectField] = useState(null)
    const [searchMultiQueries, setSearchMultiQueries] = useState({})
    const [confirmedSearchFields, setConfirmedSearchFields] = useState({})
    const searchTimers = useRef({})
    const multiSelectRef = useRef(null)

    useEffect(() => {
        if (!openMultiSelectField) {
            return undefined
        }

        function handleDocumentMouseDown(event) {
            if (multiSelectRef.current && !multiSelectRef.current.contains(event.target)) {
                setOpenMultiSelectField(null)
            }
        }

        document.addEventListener('mousedown', handleDocumentMouseDown)

        return () => {
            document.removeEventListener('mousedown', handleDocumentMouseDown)
        }
    }, [openMultiSelectField])

    useEffect(() => {
        let isMounted = true

        async function loadConfig() {
            try {
                const formConfig = await getFormConfig(formName, getAuthToken())

                if (isMounted) {
                    setConfig(formConfig)
                    const initialValues = buildInitialValues(formConfig.fields ?? [], initialValuesProp ?? {})
                    const computed = computeFields ? computeFields(initialValues, formConfig.fields ?? []) : {}
                    setValues({ ...initialValues, ...computed })
                    const confirmed = (formConfig.fields ?? []).reduce((acc, field) => {
                        if (field.fieldType === 'SEARCH' && initialValues[field.dataField]) {
                            acc[field.dataField] = true
                        }
                        return acc
                    }, {})
                    setConfirmedSearchFields(confirmed)
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

    useEffect(() => {
        const timers = searchTimers.current
        return () => {
            Object.values(timers).forEach((timerId) => window.clearTimeout(timerId))
        }
    }, [])

    function handleChange(dataField, value) {
        const handler = searchHandlers[dataField]

        if (handler && (!value || !value.trim())) {
            if (searchTimers.current[dataField]) {
                window.clearTimeout(searchTimers.current[dataField])
            }
            setSearchResults((previous) => ({ ...previous, [dataField]: [] }))
            setOpenSearchField(null)
            setConfirmedSearchFields((previous) => {
                if (!previous[dataField]) {
                    return previous
                }
                const next = { ...previous }
                delete next[dataField]
                return next
            })

            if (handler.resetFormOnClear) {
                resetForm()
            } else {
                setValues((previous) => {
                    const next = { ...previous, [dataField]: value }
                    const computed = computeFields ? computeFields(next, fields) : {}
                    return { ...next, ...computed }
                })
            }
            return
        }

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

        if (handler) {
            runDebouncedSearch(dataField, value, handler)
        }
    }

    function runDebouncedSearch(dataField, query, handler) {
        if (searchTimers.current[dataField]) {
            window.clearTimeout(searchTimers.current[dataField])
        }

        searchTimers.current[dataField] = window.setTimeout(async () => {
            try {
                const results = await handler.search(query)
                setSearchResults((previous) => ({ ...previous, [dataField]: results ?? [] }))
                setOpenSearchField(dataField)
            } catch {
                setSearchResults((previous) => ({ ...previous, [dataField]: [] }))
            }
        }, SEARCH_DEBOUNCE_MS)
    }

    async function handleSearchSelect(dataField, option) {
        const handler = searchHandlers[dataField]
        setOpenSearchField(null)
        setSearchResults((previous) => ({ ...previous, [dataField]: [] }))

        if (!handler) {
            return
        }

        try {
            const selectedValues = (await handler.onSelect(option)) ?? {}
            setValues((previous) => {
                const next = { ...previous, ...selectedValues }
                const computed = computeFields ? computeFields(next, fields) : {}
                return { ...next, ...computed }
            })
            setFieldErrors((previous) => {
                const next = { ...previous }
                Object.keys(selectedValues).forEach((key) => delete next[key])
                return next
            })
            setConfirmedSearchFields((previous) => ({ ...previous, [dataField]: true }))
            setSelectionError('')
        } catch {
            setSelectionError(toSafeUserMessage('Unable to load the selected user right now.'))
        }
    }

    function handleSearchMultiQueryChange(dataField, query, handler) {
        setSearchMultiQueries((previous) => ({ ...previous, [dataField]: query }))

        if (!query || !query.trim()) {
            if (searchTimers.current[dataField]) {
                window.clearTimeout(searchTimers.current[dataField])
            }
            setSearchResults((previous) => ({ ...previous, [dataField]: [] }))
            setOpenSearchField(null)
            return
        }

        if (handler) {
            runDebouncedSearch(dataField, query, handler)
        }
    }

    function handleSearchMultiSelect(dataField, option) {
        setSearchMultiQueries((previous) => ({ ...previous, [dataField]: '' }))
        setSearchResults((previous) => ({ ...previous, [dataField]: [] }))
        setOpenSearchField(null)

        setValues((previous) => {
            const current = previous[dataField] ?? []
            const alreadySelected = current.some((item) => item.value === option.value)
            const next = alreadySelected ? current : [...current, option]
            const nextValues = { ...previous, [dataField]: next }
            const computed = computeFields ? computeFields(nextValues, fields) : {}
            return { ...nextValues, ...computed }
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

    function handleSearchMultiRemove(dataField, optionValue) {
        setValues((previous) => {
            const current = previous[dataField] ?? []
            const next = current.filter((item) => item.value !== optionValue)
            const nextValues = { ...previous, [dataField]: next }
            const computed = computeFields ? computeFields(nextValues, fields) : {}
            return { ...nextValues, ...computed }
        })
    }

    function handleMultiSelectToggle(dataField, optionValue) {
        setValues((previous) => {
            const current = previous[dataField] ?? []
            const next = current.includes(optionValue)
                ? current.filter((value) => value !== optionValue)
                : [...current, optionValue]
            const nextValues = { ...previous, [dataField]: next }
            const computed = computeFields ? computeFields(nextValues, fields) : {}
            return { ...nextValues, ...computed }
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

    function resetForm() {
        const initialValues = buildInitialValues(fields, initialValuesProp ?? {})
        const computed = computeFields ? computeFields(initialValues, fields) : {}
        setValues({ ...initialValues, ...computed })
        setFieldErrors({})
        setSearchResults({})
        setOpenSearchField(null)
        setOpenMultiSelectField(null)
        setSearchMultiQueries({})
        setConfirmedSearchFields({})
    }

    function handleClear() {
        resetForm()
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

    const actionsBlock = (
        <div className="form-actions">
            <button type="submit" className="form-submit-button" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : config?.submitLabel || submitLabel}
            </button>
            {showClear ? (
                <button type="button" className="form-clear-button" onClick={handleClear} disabled={isSubmitting}>
                    {clearLabel}
                </button>
            ) : null}
        </div>
    )

    return (
        <form
            className={actionsOutside ? 'nxtgen-form-wrapper nxtgen-form-split' : 'nxtgen-form-wrapper'}
            onSubmit={handleSubmit}
            noValidate
        >
            {selectionError ? <p className="grid-status grid-status-error">{selectionError}</p> : null}
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
                        ) : field.fieldType === 'MULTISELECT' ? (
                            <div
                                className="form-field-multiselect"
                                ref={openMultiSelectField === field.dataField ? multiSelectRef : null}
                            >
                                <div
                                    id={field.dataField}
                                    className="form-field-search-multi-box form-field-multiselect-trigger"
                                    role="button"
                                    tabIndex={field.readOnly ? -1 : 0}
                                    onClick={() => {
                                        if (field.readOnly) {
                                            return
                                        }
                                        setOpenMultiSelectField((current) => (current === field.dataField ? null : field.dataField))
                                    }}
                                >
                                    {(field.options ?? [])
                                        .filter((option) => (values[field.dataField] ?? []).includes(option.value))
                                        .map((option) => (
                                            <span className="form-field-chip" key={option.value}>
                        {option.label}
                                                {field.readOnly ? null : (
                                                    <button
                                                        type="button"
                                                        className="form-field-chip-remove"
                                                        onClick={(event) => {
                                                            event.stopPropagation()
                                                            handleMultiSelectToggle(field.dataField, option.value)
                                                        }}
                                                        aria-label={`Remove ${option.label}`}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                      </span>
                                        ))}
                                    {(values[field.dataField] ?? []).length === 0 ? (
                                        <span className="form-field-multiselect-placeholder">
                      {field.placeholder || 'Select an option'}
                    </span>
                                    ) : null}
                                </div>
                                {openMultiSelectField === field.dataField ? (
                                    <ul className="form-field-multiselect-options">
                                        {(field.options ?? []).map((option) => (
                                            <li key={option.value}>
                                                <label className="form-field-multiselect-option">
                                                    <input
                                                        type="checkbox"
                                                        checked={(values[field.dataField] ?? []).includes(option.value)}
                                                        onChange={() => handleMultiSelectToggle(field.dataField, option.value)}
                                                    />
                                                    {option.label}
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                        ) : field.fieldType === 'SEARCHMULTISELECT' ? (
                            <div className="form-field-search">
                                <div className="form-field-search-multi-box">
                                    {(values[field.dataField] ?? []).map((item) => (
                                        <span className="form-field-chip" key={item.value}>
                      {item.label}
                                            {field.readOnly ? null : (
                                                <button
                                                    type="button"
                                                    className="form-field-chip-remove"
                                                    onClick={() => handleSearchMultiRemove(field.dataField, item.value)}
                                                    aria-label={`Remove ${item.label}`}
                                                >
                                                    ×
                                                </button>
                                            )}
                    </span>
                                    ))}
                                    <input
                                        id={field.dataField}
                                        name={`${field.dataField}-search`}
                                        className="form-field-search-multi-input"
                                        type="text"
                                        autoComplete="off"
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                        spellCheck="false"
                                        placeholder={(values[field.dataField] ?? []).length > 0 ? '' : field.placeholder || ''}
                                        readOnly={field.readOnly}
                                        value={searchMultiQueries[field.dataField] ?? ''}
                                        onChange={(event) =>
                                            handleSearchMultiQueryChange(field.dataField, event.target.value, searchHandlers[field.dataField])
                                        }
                                        onFocus={() => {
                                            if ((searchResults[field.dataField] ?? []).length > 0) {
                                                setOpenSearchField(field.dataField)
                                            }
                                        }}
                                        onBlur={() => {
                                            window.setTimeout(() => setOpenSearchField(null), 150)
                                        }}
                                    />
                                </div>
                                {openSearchField === field.dataField && (searchResults[field.dataField] ?? []).length > 0 ? (
                                    <ul className="form-field-search-results">
                                        {searchResults[field.dataField].map((option) => (
                                            <li key={option.value}>
                                                <button
                                                    type="button"
                                                    className="form-field-search-result"
                                                    onMouseDown={(event) => event.preventDefault()}
                                                    onClick={() => handleSearchMultiSelect(field.dataField, option)}
                                                >
                                                    {option.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                        ) : field.fieldType === 'SEARCH' ? (
                            <div className="form-field-search">
                                {field.dataField === 'userId' ? (
                                    <input
                                        id={field.dataField}
                                        name={`${field.dataField}-search`}
                                        className="form-field-input"
                                        type="text"
                                        autoComplete="off"
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                        spellCheck="false"
                                        placeholder={field.placeholder || ''}
                                        readOnly={field.readOnly}
                                        value={values[field.dataField] ?? ''}
                                        onChange={(event) => handleChange(field.dataField, event.target.value)}
                                        onFocus={() => {
                                            if ((searchResults[field.dataField] ?? []).length > 0) {
                                                setOpenSearchField(field.dataField)
                                            }
                                        }}
                                        onBlur={() => {
                                            window.setTimeout(() => setOpenSearchField(null), 150)
                                        }}
                                    />
                                ) : (
                                    <div className="form-field-search-multi-box">
                                        {confirmedSearchFields[field.dataField] && values[field.dataField] ? (
                                            <span className="form-field-chip">
                        {values[field.dataField]}
                                                {field.readOnly ? null : (
                                                    <button
                                                        type="button"
                                                        className="form-field-chip-remove"
                                                        onClick={() => handleChange(field.dataField, '')}
                                                        aria-label={`Remove ${values[field.dataField]}`}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                      </span>
                                        ) : (
                                            <input
                                                id={field.dataField}
                                                name={`${field.dataField}-search`}
                                                className="form-field-search-multi-input"
                                                type="text"
                                                autoComplete="off"
                                                autoCorrect="off"
                                                autoCapitalize="off"
                                                spellCheck="false"
                                                placeholder={field.placeholder || ''}
                                                readOnly={field.readOnly}
                                                value={values[field.dataField] ?? ''}
                                                onChange={(event) => handleChange(field.dataField, event.target.value)}
                                                onFocus={() => {
                                                    if ((searchResults[field.dataField] ?? []).length > 0) {
                                                        setOpenSearchField(field.dataField)
                                                    }
                                                }}
                                                onBlur={() => {
                                                    window.setTimeout(() => setOpenSearchField(null), 150)
                                                }}
                                            />
                                        )}
                                    </div>
                                )}
                                {openSearchField === field.dataField && (searchResults[field.dataField] ?? []).length > 0 ? (
                                    <ul className="form-field-search-results">
                                        {searchResults[field.dataField].map((option) => (
                                            <li key={option.value}>
                                                <button
                                                    type="button"
                                                    className="form-field-search-result"
                                                    onMouseDown={(event) => event.preventDefault()}
                                                    onClick={() => handleSearchSelect(field.dataField, option)}
                                                >
                                                    {option.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
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
                {actionsOutside ? null : actionsBlock}
            </div>
            {actionsOutside ? actionsBlock : null}
        </form>
    )
}
