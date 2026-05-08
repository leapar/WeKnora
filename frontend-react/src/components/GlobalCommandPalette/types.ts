export interface CmdkKb {
  id: string
  name: string
  type?: string
}

export interface CmdkAgent {
  id: string
  name: string
  description?: string
  avatar?: string
  isBuiltin: boolean
  source: 'own' | 'shared'
  orgName?: string
}

export interface CmdkSessionItem {
  id: string
  title: string
}

export interface CmdkChunk {
  id: string
  chunk_index: number
  knowledge_id: string
  knowledge_base_id: string
  knowledge_title: string
  kb_name: string
  content: string
  matched_content?: string
  match_type: 'vector' | 'keyword' | string
  score: number
}

export interface CmdkFileGroup {
  knowledgeId: string
  kbId: string
  title: string
  kbName: string
  chunks: CmdkChunk[]
}

export interface MessageSearchGroupItem {
  request_id: string
  session_id: string
  session_title?: string
  query_content?: string
  answer_content?: string
  score?: number
}

export interface CmdkMsgGroup {
  sessionId: string
  sessionTitle: string
  items: MessageSearchGroupItem[]
}

export interface CmdkCommand {
  id: string
  label: string
  icon: string
  keywords?: string[]
  run: () => void
}