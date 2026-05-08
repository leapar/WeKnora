import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Search, X, Check } from 'lucide-react'

interface TenantInfo {
  id: number
  name: string
  description?: string
}

interface TenantSelectorProps {
  selectedTenantId?: number | null
  currentTenantName?: string
  onChange: (tenantId: number | null) => void
}

export function TenantSelector({
  selectedTenantId,
  currentTenantName,
  onChange,
}: TenantSelectorProps) {
  const { t } = useTranslation()
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [tenants, setTenants] = useState<TenantInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const hasMore = tenants.length < total

  const loadTenants = async (_append = false) => {
    if (loading) return

    setLoading(true)
    try {
      // In a real implementation, this would call the API
      // const response = await searchTenants({
      //   keyword: searchQuery.trim() || undefined,
      //   page: currentPage,
      //   page_size: pageSize
      // })
      // if (response.success && response.data) {
      //   if (append) {
      //     setTenants(prev => [...prev, ...response.data.items])
      //   } else {
      //     setTenants(response.data.items)
      //   }
      //   setTotal(response.data.total)
      // }
      setTenants([])
      setTotal(0)
    } catch (error) {
      console.error('Failed to load tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleDropdown = () => {
    if (showDropdown) {
      setShowDropdown(false)
    } else {
      setShowDropdown(true)
      if (tenants.length === 0) {
        loadTenants()
      }
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }

  const closeDropdown = () => {
    setShowDropdown(false)
    setSearchQuery('')
    setCurrentPage(1)
  }

  const handleSearchInput = () => {
    setCurrentPage(1)
    setTenants([])
    setTotal(0)
    // Debounce search
    const timer = setTimeout(() => {
      loadTenants()
    }, 300)
    return () => clearTimeout(timer)
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const { scrollTop, scrollHeight, clientHeight } = target
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50

    if (isNearBottom && hasMore && !loading) {
      setCurrentPage(prev => prev + 1)
      loadTenants(true)
    }
  }

  const selectTenant = (tenantId: number | null) => {
    onChange(tenantId)
    closeDropdown()
  }

  useEffect(() => {
    if (showDropdown && searchQuery === '') {
      loadTenants()
    }
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown()
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <div
        onClick={toggleDropdown}
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors bg-[var(--td-bg-color-secondarycontainer)] border border-[var(--td-component-stroke)] hover:bg-[var(--td-bg-color-container-hover)] hover:border-[var(--td-component-border)]"
      >
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-[var(--td-text-color-placeholder)] font-medium mb-0.5">
            {t('tenant.currentTenant')}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--td-text-color-primary)] truncate">
              {currentTenantName || t('tenant.unknown')}
            </span>
            <svg
              className="w-3.5 h-3.5 text-[var(--td-brand-color)] flex-shrink-0 transition-transform"
              style={{ transform: showDropdown ? 'rotate(180deg)' : 'none' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-[999]"
            onClick={closeDropdown}
          />

          {/* Dropdown Content */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--td-bg-color-container)] rounded-[10px] border border-[var(--td-component-border)] shadow-lg overflow-hidden z-[1000]">
            {/* Header */}
            <div className="px-3 py-3 border-b border-[var(--td-component-stroke)]">
              <span className="text-xs font-semibold text-[var(--td-text-color-secondary)] block mb-2">
                {t('tenant.switchTenant')}
              </span>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--td-text-color-placeholder)]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value)
                    handleSearchInput()
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Escape') closeDropdown()
                  }}
                  placeholder={t('tenant.searchPlaceholder')}
                  className="w-full pl-8 pr-8 py-1.5 text-xs bg-[var(--td-bg-color-secondarycontainer)] border border-transparent rounded-md outline-none focus:border-[var(--td-brand-color)] focus:bg-[var(--td-bg-color-container)] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setCurrentPage(1)
                      setTenants([])
                      setTotal(0)
                      loadTenants()
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--td-text-color-placeholder)] hover:text-[var(--td-text-color-secondary)]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Tenant List */}
            <div
              className="overflow-y-auto"
              style={{ maxHeight: '280px' }}
              onScroll={handleScroll}
            >
              {loading && tenants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--td-text-color-placeholder)]" />
                  <span className="text-xs text-[var(--td-text-color-placeholder)]">
                    {t('tenant.loading')}
                  </span>
                </div>
              ) : tenants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <span className="text-xs text-[var(--td-text-color-placeholder)]">
                    {t('tenant.noMatch')}
                  </span>
                </div>
              ) : (
                <>
                  {tenants.map(tenant => (
                    <div
                      key={tenant.id}
                      onClick={() => selectTenant(tenant.id)}
                      className={`flex items-center justify-between px-2.5 py-2 cursor-pointer transition-colors ${
                        selectedTenantId === tenant.id
                          ? 'bg-[var(--td-brand-color-light)]'
                          : 'hover:bg-[var(--td-bg-color-secondarycontainer)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                            selectedTenantId === tenant.id
                              ? 'bg-gradient-to-br from-[var(--td-brand-color)] to-[var(--td-brand-color-active)] text-white'
                              : 'bg-[var(--td-bg-color-secondarycontainer)] text-[var(--td-text-color-secondary)]'
                          }`}
                        >
                          {tenant.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-[var(--td-text-color-primary)] truncate">
                            {tenant.name}
                          </div>
                          <div className="text-[11px] text-[var(--td-text-color-placeholder)]">
                            ID: {tenant.id}
                          </div>
                        </div>
                      </div>
                      {selectedTenantId === tenant.id && (
                        <Check className="w-4 h-4 text-[var(--td-brand-color)] flex-shrink-0" />
                      )}
                    </div>
                  ))}
                  {loading && tenants.length > 0 && (
                    <div className="flex justify-center py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--td-text-color-placeholder)]" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
