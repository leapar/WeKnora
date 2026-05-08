import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { UserPlus, Loader2 } from 'lucide-react'
import { joinOrganization } from '@/api/organization'

export function JoinOrganization() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const code = searchParams.get('code')

    if (!code) {
      setError(t('organization.join.noCode', 'No invitation code provided'))
      setLoading(false)
      return
    }

    const join = async () => {
      try {
        const result = await joinOrganization(code)
        if (result.success) {
          setSuccess(true)
        } else {
          setError(result.message || t('organization.join.failed', 'Failed to join organization'))
        }
      } catch (e: any) {
        setError(e?.message || t('organization.join.failed', 'Failed to join organization'))
      } finally {
        setLoading(false)
      }
    }

    join()
  }, [searchParams, t])

  const goToOrganizations = () => {
    navigate('/platform/organizations')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--td-bg-color-page)] p-5">
      <div className="bg-white rounded-2xl p-12 text-center shadow-lg max-w-md w-full">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          {loading ? (
            <Loader2 className="animate-spin text-green-600" size={48} />
          ) : success ? (
            <UserPlus className="text-green-600" size={48} />
          ) : (
            <UserPlus className="text-red-500" size={48} />
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-[var(--td-text-color-primary)] mb-4">
          {t('organization.join.title', 'Join Organization')}
        </h2>

        {/* Message */}
        {loading ? (
          <p className="text-sm text-[var(--td-text-color-secondary)] mb-6">
            {t('organization.join.joining', 'Joining organization...')}
          </p>
        ) : error ? (
          <p className="text-sm text-red-500 mb-6">{error}</p>
        ) : (
          <p className="text-sm text-green-600 mb-6">
            {t('organization.join.success', 'Successfully joined organization!')}
          </p>
        )}

        {/* Button */}
        {!loading && (
          <button
            onClick={goToOrganizations}
            className="px-6 py-2.5 rounded-lg bg-[var(--td-brand-color)] text-white hover:bg-[var(--td-brand-color-hover)] transition-colors font-medium"
          >
            {t('organization.join.goToOrganizations', 'Go to Organizations')}
          </button>
        )}
      </div>
    </div>
  )
}
