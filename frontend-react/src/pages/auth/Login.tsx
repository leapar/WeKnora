import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login, register as registerApi, getOIDCAuthorizationURL, getOIDCConfig, autoSetup, getCurrentUser } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, Folder, Bot, Search, Globe, Check, Loader2 } from 'lucide-react'

const languageOptions = [
  { value: 'zh-CN', label: '简体中文', shortLabel: '中文', flag: '🇨🇳' },
  { value: 'en-US', label: 'English', shortLabel: 'EN', flag: '🇺🇸' },
  { value: 'ru-RU', label: 'Русский', shortLabel: 'RU', flag: '🇷🇺' },
  { value: 'ko-KR', label: '한국어', shortLabel: '한국어', flag: '🇰🇷' },
]

export function Login() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { setUser, setToken, setRefreshToken, setTenant, setLiteMode } = useAuthStore()

  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [oidcEnabled, setOidcEnabled] = useState(false)
  const [oidcProviderName, setOidcProviderName] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const currentLang = i18n.language

  const selectLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('i18nextLng', lang)
    setShowLanguageMenu(false)
  }

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      alert(t('auth.fillRequired'))
      return
    }

    setLoading(true)
    try {
      const response = await login({
        email: formData.email,
        password: formData.password,
      })

      if (response.success) {
        if (response.user && response.tenant && response.token) {
          setUser(response.user)
          setToken(response.token)
          if (response.refresh_token) {
            setRefreshToken(response.refresh_token)
          }
          setTenant(response.tenant)
          navigate('/platform/knowledge-bases')
        }
      } else {
        alert(response.message || t('auth.loginFailed'))
      }
    } catch (error: any) {
      alert(error.message || t('auth.loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!registerData.username || !registerData.email || !registerData.password || !registerData.confirmPassword) {
      alert(t('auth.fillRequired'))
      return
    }

    if (registerData.password !== registerData.confirmPassword) {
      alert(t('auth.passwordMismatch'))
      return
    }

    setLoading(true)
    try {
      const response = await registerApi({
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
      })

      if (response.success) {
        alert(t('auth.registerSuccess'))
        setIsRegisterMode(false)
        setFormData({ email: registerData.email, password: '' })
        setRegisterData({ username: '', email: '', password: '', confirmPassword: '' })
      } else {
        alert(response.message || t('auth.registerFailed'))
      }
    } catch (error: any) {
      alert(error.message || t('auth.registerFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleOIDCLogin = async () => {
    const redirectURI = `${window.location.origin}/api/v1/auth/oidc/callback`
    try {
      const response = await getOIDCAuthorizationURL(redirectURI)
      if (response.success && response.authorization_url) {
        window.location.href = response.authorization_url
      }
    } catch (error) {
      console.error('OIDC login error:', error)
    }
  }

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('weknora_token')
      if (storedToken) {
        const response = await getCurrentUser()
        if (response.success && response.data?.user) {
          navigate('/platform/knowledge-bases')
          return
        }
      }

      const autoSetupFailed = localStorage.getItem('weknora_auto_setup_failed') === 'true'
      if (!autoSetupFailed) {
        try {
          const response = await autoSetup()
          if (response.success && response.user && response.tenant && response.token) {
            setUser(response.user)
            setToken(response.token)
            if (response.refresh_token) {
              setRefreshToken(response.refresh_token)
            }
            setTenant(response.tenant)
            setLiteMode(true)
            navigate('/platform/knowledge-bases')
            return
          } else {
            localStorage.setItem('weknora_auto_setup_failed', 'true')
          }
        } catch {
          localStorage.setItem('weknora_auto_setup_failed', 'true')
        }
      }

      const oidcResponse = await getOIDCConfig()
      if (oidcResponse.success) {
        setOidcEnabled(oidcResponse.enabled || false)
        setOidcProviderName(oidcResponse.provider_display_name || '')
      }
    }

    init()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.language-switch')) {
        setShowLanguageMenu(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const currentLangOption = languageOptions.find((l) => l.value === currentLang) || languageOptions[0]

  return (
    <div className="login-layout">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="knowledge-node node-1"><BookOpen size={20} /></div>
        <div className="knowledge-node node-2"><Folder size={20} /></div>
        <div className="knowledge-node node-3"><Bot size={20} /></div>
        <div className="knowledge-node node-4"><Search size={20} /></div>
        <div className="knowledge-node node-5"><Globe size={20} /></div>
        <div className="knowledge-node node-6"><BookOpen size={20} /></div>
        <div className="knowledge-node node-7"><Folder size={20} /></div>
        <div className="knowledge-node node-8"><Bot size={20} /></div>
        <div className="knowledge-node node-9"><Search size={20} /></div>
        <div className="knowledge-node node-10"><Globe size={20} /></div>
        <div className="knowledge-node node-11"><Check size={20} /></div>
        <div className="knowledge-node node-12"><BookOpen size={20} /></div>

        <svg className="knowledge-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line className="connection-line line-1" x1="20" y1="15" x2="35" y2="25" />
          <line className="connection-line line-2" x1="35" y1="25" x2="55" y2="20" />
          <line className="connection-line line-3" x1="55" y1="20" x2="85" y2="12" />
          <line className="connection-line line-4" x1="8" y1="35" x2="25" y2="45" />
          <line className="connection-line line-5" x1="25" y1="45" x2="65" y2="48" />
          <line className="connection-line line-6" x1="20" y1="60" x2="60" y2="75" />
          <line className="connection-line line-7" x1="20" y1="15" x2="20" y2="60" />
          <line className="connection-line line-8" x1="55" y1="20" x2="45" y2="50" />
          <line className="connection-line line-9" x1="65" y1="48" x2="90" y2="38" />
          <line className="connection-line line-10" x1="40" y1="70" x2="75" y2="80" />
          <line className="connection-line line-11" x1="35" y1="25" x2="25" y2="45" />
          <line className="connection-line line-12" x1="75" y1="30" x2="65" y2="48" />
        </svg>
      </div>

      {/* Header */}
      <a href="https://github.com/Tencent/WeKnora" target="_blank" className="header-logo">
        <img src="/weknora.png" alt="WeKnora" className="logo-image" />
      </a>

      <div className="header-links">
        <a href="https://weknora.weixin.qq.com" target="_blank" className="header-link">
          <Globe size={17} />
          <span className="link-text">{t('common.website')}</span>
        </a>
        <a href="https://github.com/Tencent/WeKnora" target="_blank" className="header-link">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span className="link-text">GitHub</span>
        </a>

        <div className="language-switch">
          <button onClick={() => setShowLanguageMenu(!showLanguageMenu)} className="header-link">
            <span>{currentLangOption.flag}</span>
            <span className="link-text">{currentLangOption.shortLabel}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showLanguageMenu && (
            <div className="language-dropdown">
              {languageOptions.map((lang) => (
                <div
                  key={lang.value}
                  onClick={() => selectLanguage(lang.value)}
                  className={`language-option ${currentLang === lang.value ? 'active' : ''}`}
                >
                  <span className="lang-flag">{lang.flag}</span>
                  <span className="lang-label">{lang.label}</span>
                  {currentLang === lang.value && <span className="check-icon">✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Left Showcase */}
      <div className="showcase-section">
        <div className="showcase-content">
          <p className="showcase-subtitle">{t('platform.subtitle')}</p>
          <p className="showcase-description">{t('platform.description')}</p>

          <div className="feature-tags">
            <span className="tag">{t('platform.rag')}</span>
            <span className="tag">{t('platform.hybridSearch')}</span>
            <span className="tag">{t('platform.localDeploy')}</span>
          </div>

          {/* Feature Cards */}
          <div className="feature-cards">
            <div className="feature-card">
              <div className="feature-icon-wrap"><BookOpen size={24} /></div>
              <h3>{t('platform.feature1Title')}</h3>
              <p>{t('platform.feature1Desc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrap"><Search size={24} /></div>
              <h3>{t('platform.feature2Title')}</h3>
              <p>{t('platform.feature2Desc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrap"><Bot size={24} /></div>
              <h3>{t('platform.feature3Title')}</h3>
              <p>{t('platform.feature3Desc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="form-section">
        <div className="form-panel">
          <div className="form-card">
            {!isRegisterMode ? (
              <>
                <div className="form-header">
                  <h2 className="form-title">{t('auth.login')}</h2>
                  <p className="form-welcome">{t('auth.subtitle')}</p>
                </div>

                <div className="form-content">
                  <div className="form-item">
                    <label className="form-label">{t('auth.email')}</label>
                    <Input
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-item">
                    <label className="form-label">{t('auth.password')}</label>
                    <Input
                      type="password"
                      placeholder={t('auth.passwordPlaceholder')}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      disabled={loading}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                  </div>

                  <Button onClick={handleLogin} disabled={loading} className="submit-button" size="lg">
                    {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                    {loading ? t('auth.loggingIn') : t('auth.login')}
                  </Button>

                  <div className="form-footer">
                    <span>{t('auth.noAccount')}</span>
                    <button onClick={() => setIsRegisterMode(true)} className="link-button">
                      {t('auth.registerNow')}
                    </button>
                  </div>

                  {oidcEnabled && (
                    <>
                      <div className="oidc-divider">
                        <span>{t('auth.orContinueWith')}</span>
                      </div>
                      <Button onClick={handleOIDCLogin} disabled={loading} className="oidc-button" size="lg" variant="outline">
                        {oidcProviderName ? t('auth.oidcLoginWith', { provider: oidcProviderName }) : t('auth.oidcLogin')}
                      </Button>
                    </>
                  )}

                  <div className="login-features">
                    <div className="feature-item">
                      <span className="feature-icon"><Check size={12} /></span>
                      <span className="feature-text">{t('platform.multimodalParsing')}</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon"><Check size={12} /></span>
                      <span className="feature-text">{t('platform.hybridSearchEngine')}</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon"><Check size={12} /></span>
                      <span className="feature-text">{t('platform.ragQandA')}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="form-header">
                  <h2 className="form-title">{t('auth.createAccount')}</h2>
                  <p className="form-subtitle">{t('auth.registerSubtitle')}</p>
                </div>

                <div className="form-content">
                  <div className="form-item">
                    <label className="form-label">{t('auth.username')}</label>
                    <Input
                      placeholder={t('auth.usernamePlaceholder')}
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-item">
                    <label className="form-label">{t('auth.email')}</label>
                    <Input
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-item">
                    <label className="form-label">{t('auth.password')}</label>
                    <Input
                      type="password"
                      placeholder={t('auth.passwordPlaceholder')}
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-item">
                    <label className="form-label">{t('auth.confirmPassword')}</label>
                    <Input
                      type="password"
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      disabled={loading}
                      onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                    />
                  </div>

                  <Button onClick={handleRegister} disabled={loading} className="submit-button" size="lg">
                    {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                    {loading ? t('auth.registering') : t('auth.register')}
                  </Button>

                  <div className="form-footer">
                    <span>{t('auth.haveAccount')}</span>
                    <button onClick={() => setIsRegisterMode(false)} className="link-button">
                      {t('auth.backToLogin')}
                    </button>
                  </div>

                  <div className="login-features">
                    <div className="feature-item">
                      <span className="feature-icon"><Check size={12} /></span>
                      <span className="feature-text">{t('platform.independentTenant')}</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon"><Check size={12} /></span>
                      <span className="feature-text">{t('platform.fullApiAccess')}</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon"><Check size={12} /></span>
                      <span className="feature-text">{t('platform.knowledgeBaseManagement')}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .login-layout {
          display: flex;
          width: 100%;
          min-height: 100vh;
          overflow: hidden;
          position: relative;
          background: linear-gradient(225deg, #022c22 0%, #064e3b 15%, #065f46 25%, #047857 38%, #059669 50%, #07C05F 65%, #10B981 78%, #34D399 90%, #6EE7B7 100%);
        }

        .animated-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }

        .knowledge-node {
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.35), 0 0 30px rgba(16, 185, 129, 0.2), inset 0 0 8px rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.9);
          animation: nodePulse 5s infinite ease-in-out;
        }

        .node-1 { top: 15%; left: 20%; animation-delay: 0s; }
        .node-2 { top: 25%; left: 35%; animation-delay: 0.5s; }
        .node-3 { top: 20%; left: 55%; animation-delay: 1s; }
        .node-4 { top: 30%; left: 75%; animation-delay: 1.5s; }
        .node-5 { top: 45%; left: 25%; animation-delay: 2s; }
        .node-6 { top: 50%; left: 45%; animation-delay: 2.5s; }
        .node-7 { top: 48%; left: 65%; animation-delay: 3s; }
        .node-8 { top: 60%; left: 20%; animation-delay: 0.3s; }
        .node-9 { top: 12%; right: 15%; animation-delay: 1.8s; }
        .node-10 { top: 38%; right: 10%; animation-delay: 2.3s; }
        .node-11 { top: 70%; left: 40%; animation-delay: 0.8s; }
        .node-12 { top: 65%; left: 80%; animation-delay: 1.3s; }

        @keyframes nodePulse {
          0%, 100% { transform: scale(1); opacity: 0.65; }
          50% { transform: scale(1.08); opacity: 0.9; }
        }

        .knowledge-lines {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.35;
        }

        .connection-line {
          stroke: rgba(255, 255, 255, 0.5);
          stroke-width: 1.5;
          stroke-dasharray: 6, 3;
          stroke-linecap: round;
          animation: lineFlow 10s infinite linear;
        }

        .line-1 { animation-delay: 0s; }
        .line-2 { animation-delay: 0.5s; }
        .line-3 { animation-delay: 1s; }
        .line-4 { animation-delay: 0.3s; }
        .line-5 { animation-delay: 0.8s; }
        .line-6 { animation-delay: 1.3s; }
        .line-7 { animation-delay: 1.8s; }
        .line-8 { animation-delay: 2.3s; }
        .line-9 { animation-delay: 0.2s; }
        .line-10 { animation-delay: 0.7s; }
        .line-11 { animation-delay: 0.9s; }
        .line-12 { animation-delay: 1.5s; }

        @keyframes lineFlow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 18; }
        }

        .header-logo {
          position: fixed;
          top: 32px;
          left: 50px;
          z-index: 100;
          cursor: pointer;
        }

        .logo-image {
          width: 120px;
          height: auto;
        }

        .header-links {
          position: fixed;
          top: 28px;
          right: 28px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 100;
        }

        .header-link {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 15px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: white;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .header-link:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .language-switch {
          position: relative;
        }

        .language-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 160px;
          background: white;
          border: 1px solid #e7e7e7;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          overflow: hidden;
          z-index: 1000;
        }

        .language-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          cursor: pointer;
          font-size: 13px;
          color: #333;
        }

        .language-option:hover { background: #f3f3f3; }
        .language-option.active { background: #e9f8ec; color: #07c05f; }

        .showcase-section {
          flex: 0 0 52%;
          display: flex;
          align-items: flex-end;
          padding: 100px 30px 100px 50px;
          box-sizing: border-box;
          position: relative;
        }

        .showcase-content {
          width: 100%;
          max-width: 600px;
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          margin-bottom: 60px;
        }

        .showcase-subtitle {
          font-size: 22px;
          color: rgba(255, 255, 255, 0.95);
          margin: 0 0 8px 0;
          font-weight: 500;
        }

        .showcase-description {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 28px 0;
          line-height: 1.5;
        }

        .feature-tags {
          display: flex;
          gap: 12px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }

        .tag {
          display: inline-block;
          padding: 8px 20px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          color: white;
          font-size: 14px;
          font-weight: 500;
        }

        .feature-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 20px;
          color: white;
        }

        .feature-card h3 {
          font-size: 14px;
          font-weight: 600;
          margin: 12px 0 6px;
        }

        .feature-card p {
          font-size: 12px;
          opacity: 0.8;
          line-height: 1.4;
        }

        .feature-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .form-section {
          flex: 0 0 48%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 40px 50px 100px 30px;
          box-sizing: border-box;
          position: relative;
        }

        .form-panel {
          width: 100%;
          max-width: 480px;
          margin-bottom: 60px;
          position: relative;
          z-index: 2;
        }

        .form-card {
          background: rgba(255, 255, 255, 0.97);
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          box-sizing: border-box;
          width: 100%;
        }

        .form-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .form-title {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin: 0 0 6px 0;
        }

        .form-welcome, .form-subtitle {
          font-size: 13px;
          color: #666;
          margin: 0;
        }

        .form-content {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .form-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }

        .submit-button {
          height: 46px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          margin-top: 8px;
        }

        .oidc-divider {
          position: relative;
          margin: 4px 0 6px;
          text-align: center;
          color: #999;
          font-size: 12px;
        }

        .oidc-divider::before {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          border-top: 1px solid #e7e7e7;
        }

        .oidc-divider span {
          position: relative;
          z-index: 1;
          padding: 0 12px;
          background: white;
        }

        .oidc-button {
          height: 46px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
        }

        .form-footer {
          text-align: center;
          font-size: 14px;
          color: #666;
          margin-top: 12px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e7e7e7;
        }

        .link-button {
          color: #07c05f;
          text-decoration: none;
          margin-left: 4px;
          font-weight: 500;
          cursor: pointer;
          background: none;
          border: none;
        }

        .link-button:hover { text-decoration: underline; }

        .login-features {
          margin-top: 20px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          font-size: 13px;
          color: #666;
        }

        .feature-item:last-child { margin-bottom: 0; }

        .feature-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #e8f8f2;
          color: #07c05f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          margin-right: 10px;
          flex-shrink: 0;
        }

        @media (max-width: 1024px) {
          .showcase-section { padding: 40px 24px; }
          .header-logo { top: 26px; left: 40px; }
          .header-logo .logo-image { width: 100px; }
          .showcase-subtitle { font-size: 18px; }
          .feature-cards { grid-template-columns: 1fr; gap: 12px; }
        }

        @media (max-width: 768px) {
          .login-layout { flex-direction: column; }
          .showcase-section { flex: 0 0 auto; min-height: 50vh; }
          .form-section { flex: 0 0 auto; padding: 24px; }
          .header-links { top: 22px; right: 22px; }
          .link-text { display: none; }
        }

        /* Dark mode */
        [data-theme="dark"] .login-layout {
          background: linear-gradient(225deg, #011a14 0%, #032e22 15%, #043a2c 25%, #05503d 38%, #046647 50%, #038a56 65%, #049b60 78%, #06a06a 90%, #07b074 100%);
        }

        [data-theme="dark"] .knowledge-node {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.15);
        }

        [data-theme="dark"] .connection-line {
          stroke: rgba(255, 255, 255, 0.25);
        }

        [data-theme="dark"] .header-logo .logo-image {
          filter: invert(1) hue-rotate(180deg) brightness(1.1);
        }

        [data-theme="dark"] .header-link {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.15);
        }

        [data-theme="dark"] .header-link:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        [data-theme="dark"] .language-switch button {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.15);
        }

        [data-theme="dark"] .language-switch button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        [data-theme="dark"] .language-dropdown {
          background: rgba(36, 36, 36, 0.97) !important;
          border-color: var(--td-component-stroke) !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
        }

        [data-theme="dark"] .tag {
          background: rgba(255, 255, 255, 0.12);
        }

        [data-theme="dark"] .form-card {
          background: rgba(36, 36, 36, 0.97) !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4) !important;
        }

        [data-theme="dark"] .form-title {
          color: rgba(255, 255, 255, 0.9);
        }

        [data-theme="dark"] .form-welcome,
        [data-theme="dark"] .form-subtitle {
          color: rgba(255, 255, 255, 0.6);
        }

        [data-theme="dark"] .form-label {
          color: rgba(255, 255, 255, 0.8);
        }

        [data-theme="dark"] .form-item input {
          background: var(--td-bg-color-page) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: rgba(255, 255, 255, 0.9);
        }

        [data-theme="dark"] .form-item input:hover,
        [data-theme="dark"] .form-item input:focus {
          border-color: var(--td-brand-color) !important;
        }

        [data-theme="dark"] .form-footer {
          color: rgba(255, 255, 255, 0.6);
          border-color: rgba(255, 255, 255, 0.1);
        }

        [data-theme="dark"] .feature-item {
          color: rgba(255, 255, 255, 0.6);
        }

        [data-theme="dark"] .feature-icon {
          background: rgba(6, 176, 77, 0.15);
        }

        [data-theme="dark"] .oidc-divider {
          color: rgba(255, 255, 255, 0.4);
        }

        [data-theme="dark"] .oidc-divider::before {
          border-color: rgba(255, 255, 255, 0.1);
        }

        [data-theme="dark"] .feature-card {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
        }

        [data-theme="dark"] .showcase-description {
          color: rgba(255, 255, 255, 0.7);
        }
      `}</style>
    </div>
  )
}
