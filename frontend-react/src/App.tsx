import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { autoSetup, getCurrentUser } from '@/api/auth'
import { PlatformLayout } from '@/pages/platform'
import { Login } from '@/pages/auth/Login'
import { KnowledgeBaseList } from '@/pages/knowledge/KnowledgeBaseList'
import { KnowledgeBase } from '@/pages/knowledge/KnowledgeBase'
import { Chat } from '@/pages/chat'
import { Settings } from '@/pages/settings/Settings'
import { AgentList } from '@/pages/agent/AgentList'
import { OrganizationList } from '@/pages/organization/OrganizationList'
import { CreatChat } from '@/pages/creatChat/creatChat'
import '@/i18n'

function OIDCCallbackHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('oidc_result=') || hash.includes('oidc_error=')) {
      const params = new URLSearchParams(hash.replace('#', ''))
      const result = params.get('oidc_result')
      const error = params.get('oidc_error')

      if (result === 'success') {
        window.location.reload()
      } else if (error) {
        console.error('OIDC error:', error)
        navigate('/login')
      }

      window.history.replaceState({}, document.title, '/')
    }
  }, [navigate])

  return null
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, token, initFromStorage } = useAuthStore()
  const [checked, setChecked] = useState(false)
  const [restored, setRestored] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        initFromStorage()
      }

      const currentToken = token || localStorage.getItem('weknora_token')
      if (currentToken && !isLoggedIn) {
        try {
          const response = await getCurrentUser()
          if (response.success && response.data?.user) {
            const { setUser, setTenant } = useAuthStore.getState()
            setUser(response.data.user)
            if (response.data.tenant) {
              setTenant(response.data.tenant)
            }
            setRestored(true)
          }
        } catch {
          // Token invalid
        }
      }
      setChecked(true)
    }

    restoreSession()
  }, [token, isLoggedIn, initFromStorage])

  useEffect(() => {
    if (checked && !isLoggedIn && !restored) {
      const tryAutoSetup = async () => {
        const response = await autoSetup()
        if (response.success && response.user && response.tenant && response.token) {
          const { setUser, setTenant, setToken, setRefreshToken, setLiteMode } = useAuthStore.getState()
          setUser(response.user)
          setTenant(response.tenant)
          setToken(response.token)
          if (response.refresh_token) {
            setRefreshToken(response.refresh_token)
          }
          setLiteMode(true)
          setRestored(true)
        } else {
          navigate('/login')
        }
      }

      tryAutoSetup()
    }
  }, [checked, isLoggedIn, restored, navigate])

  if (!checked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!isLoggedIn && !restored) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const handleStorageChange = () => {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        setTheme(savedTheme)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <BrowserRouter>
      <OIDCCallbackHandler />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <PlatformLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/platform/knowledge-bases" replace />} />
          <Route path="platform/knowledge-bases" element={<KnowledgeBaseList />} />
          <Route path="platform/knowledge-bases/:kbId" element={<KnowledgeBase />} />
          <Route path="platform/chat/:chatid" element={<Chat />} />
          <Route path="platform/settings" element={<Settings />} />
          <Route path="platform/agents" element={<AgentList />} />
          <Route path="platform/organizations" element={<OrganizationList />} />
          <Route path="platform/creatChat" element={<CreatChat />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
