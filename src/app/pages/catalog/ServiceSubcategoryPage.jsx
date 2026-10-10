import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getServiceCategoryBySlug, getServiceSubcategories } from '../../api/client.js'
import { getAuthToken } from '../../auth/session.js'
import { useToast } from '../../components/toast/ToastProvider.jsx'
import { toSafeUserMessage } from '../../utils/toSafeUserMessage.js'
import './ServiceCatalogPage.css'

export default function ServiceSubcategoryPage() {
    const toast = useToast()
    const navigate = useNavigate()
    const { categorySlug } = useParams()
    const [category, setCategory] = useState(null)
    const [subcategories, setSubcategories] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        async function loadSubcategories() {
            setIsLoading(true)
            try {
                const token = getAuthToken()
                const [categoryResult, subcategoryResults] = await Promise.all([
                    getServiceCategoryBySlug(categorySlug, token),
                    getServiceSubcategories(categorySlug, token),
                ])
                if (isMounted) {
                    setCategory(categoryResult)
                    setSubcategories(subcategoryResults)
                }
            } catch (requestError) {
                toast.error(toSafeUserMessage('Unable to load this service category right now.'))
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadSubcategories()

        return () => {
            isMounted = false
        }
    }, [categorySlug])

    return (
        <section>
            <button type="button" className="catalog-back-link" onClick={() => navigate('/service-catalog')}>
                ← Service Catalog
            </button>
            <h1>{category?.name ?? 'Service Category'}</h1>
            <p className="muted">Choose a service to continue.</p>

            {isLoading ? (
                <p className="catalog-status">Loading services...</p>
            ) : (
                <div className="catalog-tile-grid">
                    {subcategories.map((subcategory) => (
                        <button
                            type="button"
                            key={subcategory.id}
                            className="catalog-tile"
                            onClick={() => navigate(`/service-catalog/${categorySlug}/${subcategory.slug}`)}
                        >
                            <span className="catalog-tile-icon">{subcategory.icon}</span>
                            <span className="catalog-tile-name">{subcategory.name}</span>
                            {subcategory.description ? (
                                <span className="catalog-tile-description">{subcategory.description}</span>
                            ) : null}
                            <span className="catalog-tile-arrow" aria-hidden="true">
                →
              </span>
                        </button>
                    ))}
                </div>
            )}
        </section>
    )
}
