import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface GeneralSettingsProps {
  onSave: (settings: any) => Promise<void>
}

export function GeneralSettings({ onSave }: GeneralSettingsProps) {
  const { t, i18n } = useTranslation()
  const [language, setLanguage] = useState(i18n.language || 'zh-CN')
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      if (language !== i18n.language) {
        i18n.changeLanguage(language)
        localStorage.setItem('i18nextLng', language)
      }
      document.documentElement.setAttribute('data-theme', theme)
      await onSave({ language, theme })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">{t('settings.general')}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t('settings.language')}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full max-w-xs rounded border border-[var(--td-border-level-1-color)] px-3 py-2 bg-white focus:outline-none focus:border-[var(--td-brand-color)]"
            >
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">{t('settings.theme')}</label>
            <div className="flex gap-4">
              {(['light', 'dark', 'auto'] as const).map((themeOption) => (
                <label key={themeOption} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value={themeOption}
                    checked={theme === themeOption}
                    onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
                    className="accent-[var(--td-brand-color)]"
                  />
                  <span>{t(`settings.${themeOption}`)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="animate-spin mr-2" size={16} />}
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}
