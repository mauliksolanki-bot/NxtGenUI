import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getServiceCategories } from '../../api/client.js'
import { getAuthToken } from '../../auth/session.js'
import { useToast } from '../../components/toast/ToastProvider.jsx'
import { toSafeUserMessage } from '../../utils/toSafeUserMessage.js'
import './ServiceCatalogPage.css'

export default function ServiceCatalogPage() {
    const toast = useToast()
    const navigate = useNavigate()
    const [categories, setCategories] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        async function loadCategories() {
            try {
                const results = await getServiceCategories(getAuthToken())
                if (isMounted) {
                    setCategories(results)
                }
            } catch (requestError) {
                toast.error(toSafeUserMessage('Unable to load the Service Catalog right now.'))
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadCategories()

        return () => {
            isMounted = false
        }
    }, [])

    return (
        <section>
            <h1>Service Catalog</h1>
            <p className="muted">Choose a category to browse available services.</p>

            {isLoading ? (
                <p className="catalog-status">Loading categories...</p>
            ) : (
                <div className="catalog-tile-grid">
                    {categories.map((category) => (
                        <button
                            type="button"
                            key={category.id}
                            className="catalog-tile"
                            onClick={() => navigate(`/service-catalog/${category.slug}`)}
                        >
                            <span className="catalog-tile-icon">{category.icon}</span>
                            <span className="catalog-tile-name">{category.name}</span>
                            {category.description ? (
                                <span className="catalog-tile-description">{category.description}</span>
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
