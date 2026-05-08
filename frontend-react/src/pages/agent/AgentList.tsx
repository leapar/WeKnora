import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Search, Trash2, Edit, Copy, Bot, MessageSquare, Loader2 } from 'lucide-react'
import { listAgents, createAgent, updateAgent, deleteAgent, copyAgent } from '@/api/agent'
import type { Agent } from '@/types'

export function AgentList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { selectAgent } = useSettingsStore()

  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null)
  const [creating, setCreating] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'assistant' as 'assistant' | 'agent',
    prompt: '',
    model_id: '',
    temperature: 0.7,
  })

  const loadAgents = useCallback(async () => {
    setLoading(true)
    try {
      const response = await listAgents()
      if (response.success && response.data) {
        setAgents(response.data.agents || [])
      }
    } catch (error) {
      console.error('Failed to load agents:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAgents()
  }, [loadAgents])

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchKeyword.toLowerCase())
  )

  const handleCreateAgent = async () => {
    if (!formData.name.trim()) return

    setCreating(true)
    try {
      const response = await createAgent({
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        prompt: formData.prompt,
        model_id: formData.model_id || undefined,
        temperature: formData.temperature,
      })
      if (response.success) {
        setShowCreateDialog(false)
        resetForm()
        loadAgents()
      } else {
        alert(response.message || 'Failed to create agent')
      }
    } catch (error) {
      console.error('Failed to create agent:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleEditAgent = async () => {
    if (!editingAgent || !formData.name.trim()) return

    setCreating(true)
    try {
      const response = await updateAgent(editingAgent.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        prompt: formData.prompt,
        model_id: formData.model_id || undefined,
        temperature: formData.temperature,
      })
      if (response.success) {
        setShowEditDialog(false)
        setEditingAgent(null)
        resetForm()
        loadAgents()
      } else {
        alert(response.message || 'Failed to update agent')
      }
    } catch (error) {
      console.error('Failed to update agent:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteAgent = async () => {
    if (!agentToDelete) return

    try {
      const response = await deleteAgent(agentToDelete.id)
      if (response.success) {
        setShowDeleteDialog(false)
        setAgentToDelete(null)
        loadAgents()
      } else {
        alert(response.message || 'Failed to delete agent')
      }
    } catch (error) {
      console.error('Failed to delete agent:', error)
    }
  }

  const handleCopyAgent = async (agent: Agent) => {
    try {
      const response = await copyAgent(agent.id)
      if (response.success) {
        loadAgents()
      } else {
        alert(response.message || 'Failed to copy agent')
      }
    } catch (error) {
      console.error('Failed to copy agent:', error)
    }
  }

  const handleSelectAgent = (agent: Agent) => {
    selectAgent(agent.id)
    navigate('/platform/chat')
  }

  const openEditDialog = (agent: Agent) => {
    setEditingAgent(agent)
    setFormData({
      name: agent.name,
      description: agent.description || '',
      type: agent.type || 'assistant',
      prompt: agent.prompt || '',
      model_id: agent.model_id || '',
      temperature: agent.temperature || 0.7,
    })
    setShowEditDialog(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'assistant',
      prompt: '',
      model_id: '',
      temperature: 0.7,
    })
  }

  const getAgentModeBadge = (agent: Agent) => {
    if (agent.type === 'agent') {
      return <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700">{t('agent.mode.agent')}</span>
    }
    return <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">{t('agent.mode.normal')}</span>
  }

  return (
    <div className="min-h-screen bg-[var(--td-bg-color-page)] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--td-text-color-primary)]">
              {t('agent.agents')}
            </h1>
            <p className="text-sm text-[var(--td-text-color-secondary)] mt-1">
              {agents.length} {t('knowledge.documents')}
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowCreateDialog(true) }}>
            <Plus size={18} className="mr-2" />
            {t('agent.create')}
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--td-text-color-placeholder)]"
            />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--td-border-level-1-color)] bg-white focus:outline-none focus:border-[var(--td-brand-color)] text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[var(--td-brand-color)]" size={32} />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-12 text-center">
            <Bot size={64} className="mx-auto mb-4 text-[var(--td-text-color-placeholder)]" />
            <h3 className="text-lg font-medium mb-2">{t('agent.noAgents')}</h3>
            <p className="text-[var(--td-text-color-secondary)] mb-6">
              {searchKeyword ? 'No matching agents found' : 'Create your first agent to get started'}
            </p>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true) }}>
              <Plus size={18} className="mr-2" />
              {t('agent.create')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white rounded-lg border border-[var(--td-border-level-1-color)] p-5 hover:border-[var(--td-brand-color)] transition-colors cursor-pointer group relative"
                onClick={() => handleSelectAgent(agent)}
              >
                <div className="absolute top-3 right-12 opacity-30">
                  <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3L10.8 6.2C10.9 6.7 11.3 7.1 11.8 7.2L15 8L11.8 8.8C11.3 8.9 10.9 9.3 10.8 9.8L10 13L9.2 9.8C9.1 9.3 8.7 8.9 8.2 8.8L5 8L8.2 7.2C8.7 7.1 9.1 6.7 9.2 6.2L10 3Z" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
                  </svg>
                </div>

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${agent.type === 'agent' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                      {agent.type === 'agent' ? <Bot size={20} /> : <MessageSquare size={20} />}
                    </div>
                    <h3 className="font-medium text-lg truncate">{agent.name}</h3>
                  </div>
                  <div className="relative ml-2">
                    <button
                      className="p-1.5 rounded hover:bg-[var(--td-bg-color-secondarycontainer)] opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        setAgentToDelete(agent)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 size={16} className="text-[var(--td-text-color-secondary)]" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-[var(--td-text-color-secondary)] line-clamp-2 min-h-[40px] mb-3">
                  {agent.description || t('knowledge.noDescription')}
                </p>

                <div className="flex items-center gap-2 text-xs text-[var(--td-text-color-placeholder)]">
                  {getAgentModeBadge(agent)}
                  {agent.model_id && (
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {agent.model_id}
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-[var(--td-border-level-1-color)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      className="p-1.5 rounded hover:bg-[var(--td-bg-color-secondarycontainer)]"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditDialog(agent)
                      }}
                    >
                      <Edit size={14} className="text-[var(--td-text-color-secondary)]" />
                    </button>
                    <button
                      className="p-1.5 rounded hover:bg-[var(--td-bg-color-secondarycontainer)]"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyAgent(agent)
                      }}
                    >
                      <Copy size={14} className="text-[var(--td-text-color-secondary)]" />
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectAgent(agent)
                    }}
                    className="text-[var(--td-brand-color)]"
                  >
                    {t('common.confirm')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('agent.create')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('knowledge.name')} *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('knowledge.name')}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('knowledge.description')}</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('knowledge.description')}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('agent.type.label')}</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'assistant' | 'agent' })}
                className="w-full rounded border border-[var(--td-border-level-1-color)] px-3 py-2 bg-white focus:outline-none focus:border-[var(--td-brand-color)]"
              >
                <option value="assistant">{t('agent.mode.normal')}</option>
                <option value="agent">{t('agent.mode.agent')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('agent.prompt')}</label>
              <Textarea
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                placeholder={t('agent.promptPlaceholder')}
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('settings.modelId')}</label>
              <Input
                value={formData.model_id}
                onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                placeholder="gpt-4o-mini"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateAgent} disabled={!formData.name.trim() || creating}>
              {creating && <Loader2 className="animate-spin mr-2" size={16} />}
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('common.edit')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('knowledge.name')} *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('knowledge.name')}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('knowledge.description')}</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('knowledge.description')}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('agent.type.label')}</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'assistant' | 'agent' })}
                className="w-full rounded border border-[var(--td-border-level-1-color)] px-3 py-2 bg-white focus:outline-none focus:border-[var(--td-brand-color)]"
              >
                <option value="assistant">{t('agent.mode.normal')}</option>
                <option value="agent">{t('agent.mode.agent')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('agent.prompt')}</label>
              <Textarea
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                placeholder={t('agent.promptPlaceholder')}
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('settings.modelId')}</label>
              <Input
                value={formData.model_id}
                onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                placeholder="gpt-4o-mini"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEditAgent} disabled={!formData.name.trim() || creating}>
              {creating && <Loader2 className="animate-spin mr-2" size={16} />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.confirm')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[var(--td-text-color-secondary)]">
              {t('agent.deleteConfirm', { name: agentToDelete?.name })}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteAgent}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
