# WeKnora Vue 前端版本记录文档

> 本文档记录 WeKnora Vue 前端项目的版本信息，用于未来版本升级时快速参考和迁移。

---

## 项目基本信息

| 项目 | 路径 |
|------|------|
| Vue 前端 | `frontend/` |
| React 前端 | `frontend-react/` |

**Vue 项目版本**: `0.5.1`
**项目名称**: `knowledage-base` (注意：拼写错误，非 knowledge)

---

## 核心技术栈

### 框架与构建

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | `^3.5.13` | 核心框架 |
| Vite | `^7.2.2` | 构建工具 |
| TypeScript | `~5.8.0` | 类型系统 |
| vue-tsc | `^3.2.5` | Vue 类型检查 |

### 状态管理

| 技术 | 版本 | 说明 |
|------|------|------|
| Pinia | `^3.0.1` | Vue 3 官方状态管理 |
| vue-router | `^4.5.0` | Vue 路由 |

### UI 组件库

| 技术 | 版本 | 说明 |
|------|------|------|
| tdesign-vue-next | `^1.17.2` | 腾讯 TDesign Vue3 组件库 |
| tdesign-icons-vue-next | `^0.4.1` | TDesign 图标库 |

### 国际化

| 技术 | 版本 | 说明 |
|------|------|------|
| vue-i18n | `^11.1.12` | Vue 国际化 |

### HTTP 与数据处理

| 技术 | 版本 | 说明 |
|------|------|------|
| axios | `^1.8.4` | HTTP 客户端 |
| @microsoft/fetch-event-source | `^2.0.1` | SSE 流式请求 |

### 文档与渲染

| 技术 | 版本 | 说明 |
|------|------|------|
| marked | `^17.0.5` | Markdown 解析 |
| marked-katex-extension | `^5.1.8` | Markdown KaTeX 数学公式支持 |
| katex | `^0.16.45` | 数学公式渲染 |
| highlight.js | `^11.11.1` | 代码高亮 |
| mermaid | `^11.14.0` | 图表渲染 |
| docx-preview | `^0.3.7` | Word 文档预览 |
| @vue-office/pptx | `^1.0.1` | PPT 预览 |
| xlsx | 本地包 `xlsx-0.20.2.tgz` | Excel 处理 |

### 其他重要依赖

| 技术 | 版本 | 说明 |
|------|------|------|
| dompurify | `^3.2.6` | DOM 净化（XSS 防护） |
| papaparse | `^5.5.3` | CSV 解析 |
| pagefind | `^1.1.1` | 静态搜索 |
| swiper | `^12.0.3` | 轮播组件 |

---

## 项目配置

### Vite 配置 (`vite.config.ts`)

```typescript
// 关键配置
plugins: [vue(), vueJsx()]
resolve.alias: {
  '@': fileURLToPath(new URL('./src', import.meta.url))
}
server.proxy: {
  '/api': target: 'http://localhost:8080'
  '/files': target: 'http://localhost:8080'
}
```

### TypeScript 配置

- `tsconfig.json` 使用 project references 模式
- 分离配置: `tsconfig.node.json` (构建配置) + `tsconfig.app.json` (应用代码)

### 构建覆盖 (Overrides)

```json
{
  "lightningcss": "none",
  "esbuild": "^0.25.0",
  "serialize-javascript": "^7.0.3"
}
```

---

## 项目结构

```
frontend/
├── src/
│   ├── main.ts              # 应用入口
│   ├── App.vue              # 根组件
│   ├── router/
│   │   └── index.ts         # 路由配置
│   ├── stores/              # Pinia 状态管理
│   │   ├── auth.ts          # 认证状态
│   │   ├── settings.ts      # 设置状态
│   │   ├── menu.ts          # 菜单状态
│   │   ├── ui.ts            # UI 状态
│   │   ├── knowledge.ts      # 知识库状态
│   │   ├── organization.ts   # 组织状态
│   │   └── commandPalette.ts # 命令面板状态
│   ├── api/                # API 请求
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   ├── chat/
│   │   │   └── streame.ts   # SSE 流式处理
│   │   ├── knowledge-base.ts
│   │   ├── agent.ts
│   │   ├── organization.ts
│   │   ├── model.ts
│   │   ├── settings.ts
│   │   ├── tenant.ts
│   │   └── index.ts         # Axios 实例封装
│   ├── components/          # Vue 组件
│   ├── views/              # 页面组件
│   │   ├── auth/Login.vue
│   │   ├── chat/
│   │   ├── knowledge/
│   │   ├── agent/
│   │   ├── organization/
│   │   ├── settings/
│   │   ├── creatChat/
│   │   └── platform/
│   ├── composables/         # 组合式函数
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales/
│   ├── utils/              # 工具函数
│   └── assets/
│       ├── fonts.css
│       ├── theme/           # 主题样式
│       └── img/
├── public/
│   ├── config.js           # 运行时配置
│   ├── favicon.ico
│   └── tdesign-icons/     # 离线图标 sprite
└── index.html
```

---

## 路由结构

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | redirect → `/platform/knowledge-bases` | 首页重定向 |
| `/login` | `views/auth/Login.vue` | 登录页 |
| `/join` | redirect → `/platform/organizations` | 加入组织 |
| `/platform` | `views/platform/index.vue` | 平台布局容器 |
| `/platform/settings` | `views/settings/Settings.vue` | 设置页 |
| `/platform/knowledge-bases` | `views/knowledge/KnowledgeBaseList.vue` | 知识库列表 |
| `/platform/knowledge-bases/:kbId` | `views/knowledge/KnowledgeBase.vue` | 知识库详情 |
| `/platform/agents` | `views/agent/AgentList.vue` | 智能体列表 |
| `/platform/chat/:chatid` | `views/chat/index.vue` | 聊天页 |
| `/platform/organizations` | `views/organization/OrganizationList.vue` | 组织列表 |
| `/platform/dev/markdown` | `views/dev/MarkdownTestPage.vue` | Markdown 测试（仅 DEV 模式）|

---

## Pinia Stores 映射

| Vue Store | 状态内容 | React 对应 |
|-----------|---------|-----------|
| `stores/auth.ts` | user, tenant, token, knowledgeBases, isLiteMode | `stores/authStore.ts` |
| `stores/settings.ts` | 主题、语言、模型配置等 | `stores/settingsStore.ts` |
| `stores/menu.ts` | 菜单状态 | `stores/menuStore.ts` |
| `stores/ui.ts` | UI 状态（侧边栏、模态框等）| `stores/uiStore.ts` |
| `stores/knowledge.ts` | 知识库状态 | `stores/knowledgeStore.ts` |
| `stores/organization.ts` | 组织状态 | `stores/organizationStore.ts` |
| `stores/commandPalette.ts` | 全局命令面板状态 | 未转换（功能简化）|

---

## API 层架构

### Axios 拦截器配置

**请求拦截器**:
1. 添加 `Authorization: Bearer {token}` 头
2. 添加 `X-Tenant-ID` 头（如果选择了租户）
3. 添加 `Accept-Language` 头

**响应拦截器**:
1. 401 错误时尝试刷新 Token
2. 刷新成功后重试原请求
3. 刷新失败时登出

### SSE 流式处理

关键文件: `api/chat/streame.ts`

使用 `@microsoft/fetch-event-source` 实现 SSE 流式接收，处理的消息类型：
- `text` - 普通文本
- `error` - 错误消息
- `agent` - Agent 模式消息
- `tool_call` - 工具调用
- `tool_result` - 工具结果

---

## 认证流程

### 登录方式

1. **邮箱登录** - 传统用户名密码
2. **OIDC 登录** - 第三方 OAuth 联合登录
3. **Lite 模式** - 自动初始化，自动登录（桌面/WebView）

### Token 刷新机制

- 访问 `/api/v1/auth/refresh` 刷新 access token
- 使用 refresh_token 获取新 token
- 失败后清除本地状态并跳转登录页

### 路由守卫

`router.beforeEach` 中检查：
1. OIDC 回跳回调（URL hash 中有 `oidc_result` 或 `oidc_error`）
2. Lite 模式硬刷新后恢复上次页面
3. 认证状态（未登录重定向到 `/login`）
4. 自动初始化（首次访问尝试 Lite 模式）

---

## 主题与样式

### 主题变量 (CSS Variables)

```css
--td-brand-color        /* 主色 #07c05f */
--td-bg-color-page     /* 页面背景 */
--td-text-color-primary /* 主文本色 */
```

### 主题切换

- 支持 `light` / `dark` / `system` 三种模式
- 存储在 `localStorage['WeKnora_theme']`
- 桌面应用支持 `window.runtime` API 控制系统主题

### 深色模式选择器

```css
[data-theme="dark"] { ... }
```

---

## 国际化

### 支持语言

| 语言代码 | 说明 |
|---------|------|
| `zh-CN` | 简体中文（默认）|
| `en-US` | 英语 |
| `ru-RU` | 俄语 |
| `ko-KR` | 韩语 |

### TDesign 组件库国际化

在 `App.vue` 中通过 `t-config-provider` 注入对应语言的 TDesign locale 配置。

---

## 关键实现细节

### 1. SSE 流式聊天

```typescript
// api/chat/streame.ts
await fetchEventSource(url, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify(options),
  onmessage: (event) => {
    const data = JSON.parse(event.data)
    switch (data.type) {
      case 'text': /* 处理文本 */ break
      case 'error': /* 处理错误 */ break
      case 'agent': /* Agent 模式 */ break
      case 'tool_call': /* 工具调用 */ break
    }
  }
})
```

### 2. Markdown 渲染

使用 `marked` + `marked-katex-extension` + `highlight.js` + `mermaid`：

```typescript
import { marked } from 'marked'
import 'marked-katex-extension'
marked.use({ breaks: true, gfm: true })
// 代码高亮使用 highlight.js
// 数学公式使用 KaTeX
// 图表使用 mermaid
```

### 3. 文档预览

| 格式 | 预览方式 |
|------|---------|
| PDF | iframe 直接嵌入 |
| DOCX | `docx-preview` 库 |
| PPTX | `@vue-office/pptx` 库 |
| Excel | `xlsx` 库转 HTML |
| 图片 | img 标签 |
| Markdown | react-markdown 渲染 |
| 代码 | highlight.js 高亮 |

### 4. 命令面板 (GlobalCommandPalette)

- 快捷键: `⌘K` (Mac) / `Ctrl+K` (Windows)
- 功能: 全局搜索知识库、Agent、聊天记录等
- 实现: 独立的全局组件，挂载在 App.vue

---

## 已转换为 React 的组件/页面

### React 组件 (39 个)

| 组件 | 对应 Vue 组件 | 完成状态 |
|------|-------------|---------|
| `AgentAvatar.tsx` | `AgentAvatar.vue` | ✅ |
| `AgentEditorModal.tsx` | `AgentEditorModal.vue` | ✅ |
| `AgentSelector.tsx` | `AgentSelector.vue` | ✅ |
| `AgentShareSettings.tsx` | `AgentShareSettings.vue` | ✅ |
| `AttachmentUpload.tsx` | `AttachmentUpload.vue` | ✅ |
| `DocContent.tsx` | `doc-content.vue` | ✅ |
| `DocumentPreview.tsx` | `document-preview.vue` | ✅ |
| `EmptyKnowledge.tsx` | `empty-knowledge.vue` | ✅ |
| `FAQTagTooltip.tsx` | `FAQTagTooltip.vue` | ✅ |
| `GlobalCommandPalette.tsx` | `GlobalCommandPalette.vue` | ✅ |
| `IMChannelPanel.tsx` | `IMChannelPanel.vue` | ✅ |
| `IMChannelsOverviewPanel.tsx` | `IMChannelsOverviewPanel.vue` | ✅ |
| `InputField.tsx` | `Input-field.vue` | ✅ |
| `KnowledgeBaseEditorModal.tsx` | `KnowledgeBaseEditorModal.vue` | ✅ |
| `KnowledgeBaseSelector.tsx` | `KnowledgeBaseSelector.vue` | ✅ |
| `ManualKnowledgeEditor.tsx` | `manual-knowledge-editor.vue` | ✅ |
| `MentionSelector.tsx` | `MentionSelector.vue` | ✅ |
| `Menu.tsx` | `menu.vue` | ✅ |
| `ModelEditorDialog.tsx` | `ModelEditorDialog.vue` | ✅ |
| `ModelSelector.tsx` | `ModelSelector.vue` | ✅ |
| `PicturePreview.tsx` | `picture-preview.vue` | ✅ |
| `PromptTemplateSelector.tsx` | `PromptTemplateSelector.vue` | ✅ |
| `SettingCard.tsx` | `settings/SettingCard.vue` | ✅ |
| `SettingDrawer.tsx` | `settings/SettingDrawer.vue` | ✅ |
| `ShareKnowledgeBaseDialog.tsx` | `ShareKnowledgeBaseDialog.vue` | ✅ |
| `SpaceAvatar.tsx` | `SpaceAvatar.vue` | ✅ |
| `TenantSelector.tsx` | `TenantSelector.vue` | ✅ |
| `UploadMask.tsx` | `upload-mask.vue` | ✅ |
| `UserMenu.tsx` | `UserMenu.vue` | ✅ |
| shadcn/ui 组件 | - | ✅ |

### React 页面 (69 个)

| 页面 | 对应 Vue 页面 | 完成状态 |
|------|-------------|---------|
| `Login.tsx` | `auth/Login.vue` | ✅ |
| `AgentList.tsx` | `agent/AgentList.vue` | ✅ |
| `AgentEditorModal.tsx` | `agent/AgentEditorModal.vue` | ✅ |
| `index.tsx` (chat) | `chat/index.vue` | ✅ |
| `BotMsg.tsx` | `chat/components/botmsg.vue` | ✅ |
| `UserMsg.tsx` | `chat/components/usermsg.vue` | ✅ |
| `AgentStreamDisplay.tsx` | `chat/components/AgentStreamDisplay.vue` | ✅ |
| `SendMsg.tsx` | `chat/components/sendMsg.vue` | ✅ |
| `DeepThink.tsx` | `chat/components/deepThink.vue` | ✅ |
| `DocInfo.tsx` | `chat/components/docInfo.vue` | ✅ |
| `ToolResultRenderer.tsx` | `chat/components/ToolResultRenderer.vue` | ✅ |
| `tool-results/*` | `chat/components/tool-results/*` | ✅ |
| `KnowledgeBaseList.tsx` | `knowledge/KnowledgeBaseList.vue` | ✅ |
| `KnowledgeBase.tsx` | `knowledge/KnowledgeBase.vue` | ✅ |
| `KnowledgeBaseEditorModal.tsx` | `knowledge/KnowledgeBaseEditorModal.vue` | ✅ |
| `knowledge/components/*` | `knowledge/components/*` | ✅ |
| `knowledge/settings/*` | `knowledge/settings/*` | ✅ |
| `knowledge/wiki/*` | `knowledge/wiki/*` | ✅ |
| `OrganizationList.tsx` | `organization/OrganizationList.vue` | ✅ |
| `OrganizationEditorModal.tsx` | `organization/OrganizationEditorModal.vue` | ✅ |
| `OrganizationSettingsModal.tsx` | `organization/OrganizationSettingsModal.vue` | ✅ |
| `Settings.tsx` | `settings/Settings.vue` | ✅ |
| `settings/components/*` | `settings/components/*` | ✅ |
| `creatChat.tsx` | `creatChat/creatChat.vue` | ✅ |
| `platform/index.tsx` | `platform/index.vue` | ✅ |

---

## 版本升级检查清单

当 Vue 前端版本升级时，按以下清单检查并更新 React 前端：

### 1. 依赖版本检查

- [ ] 检查 `package.json` 中所有依赖的新版本
- [ ] 更新 React 项目的对应依赖
- [ ] 注意 `tdesign-vue-next` → `shadcn/ui` 的功能映射

### 2. API 变化

- [ ] 检查 API 请求/响应格式是否变化
- [ ] 检查 SSE 消息类型是否新增
- [ ] 检查认证流程是否调整

### 3. 组件 API 变化

- [ ] TDesign 组件 API 变化 → 寻找 shadcn/ui 对应组件
- [ ] 新增的 TDesign 组件 → 需要新增 React 实现

### 4. 路由变化

- [ ] 检查路由配置是否新增页面
- [ ] 新增页面需要创建 React 版本

### 5. Store 变化

- [ ] 检查 Pinia stores 是否新增状态
- [ ] 新增状态需要添加到 Zustand stores

### 6. 样式/主题变化

- [ ] CSS 变量是否新增或修改
- [ ] 主题切换逻辑是否调整
- [ ] 深色模式样式是否更新

### 7. 国际化

- [ ] 新增语言包文件
- [ ] 新增翻译 key

---

## React 项目技术栈 (当前)

| 技术 | 版本 | 说明 |
|------|------|------|
| React | - | 核心框架 |
| Vite | - | 构建工具 |
| TypeScript | - | 类型系统 |
| Zustand | - | 状态管理 |
| react-router-dom | v6 | 路由 |
| shadcn/ui | - | UI 组件库 |
| TailwindCSS | - | CSS 框架 |
| react-i18next | - | 国际化 |
| axios | - | HTTP 客户端 |
| @microsoft/fetch-event-source | - | SSE 流式请求 |
| react-markdown | - | Markdown 渲染 |
| mermaid | - | 图表渲染 |

---

## 注意事项

1. **tdesign-vue-next → shadcn/ui**: TDesign 组件需要找到 shadcn/ui 对应组件或自定义实现

2. **docx-preview 和 xlsx**: Vue 项目使用本地包 `xlsx-0.20.2.tgz`，React 项目中这些模块被注释掉因为未安装

3. **marked-katex-extension**: Vue 项目使用此扩展处理 Markdown 中的数学公式，React 项目需使用 `rehype-katex` + `remark-math`

4. **@vue-office/pptx**: 仅 Vue 项目使用，React 项目暂无 PPT 预览功能

5. **Offline Icons**: Vue 项目使用本地化的 tdesign-icons sprite，React 项目使用 `lucide-react`

6. **桌面应用集成**: Vue 项目有 `window.go.main.App.AutoCheckForUpdates()` 等桌面应用 API 调用，React 项目简化处理

---

## React 前端升级改写教程

### 概述

当 Vue 前端版本升级后，需要将新的 Vue 改动同步到 React 前端。本教程说明如何使用本文档进行升级改写。

---

### 升级改写流程

#### 第一步：获取 Vue 升级信息

1. **查看 Vue 项目变更**
   ```bash
   cd frontend
   git log --oneline -20  # 查看最近提交
   git diff HEAD~10 --name-only  # 查看变更的文件
   ```

2. **记录新版本依赖**
   ```bash
   cat package.json
   ```
   重点关注：
   - dependencies 中的版本变化
   - devDependencies 中的版本变化
   - 新增的依赖

3. **更新文档中的版本信息**
   - 找到 `核心技术栈` 表格
   - 对比新版本与文档中记录的版本差异
   - 标记有变化的依赖

#### 第二步：分析变更类型

根据 Vue 项目的变更类型，判断影响范围：

| 变更类型 | 影响范围 | 改写工作量 |
|---------|---------|----------|
| 依赖版本升级 | 低 | 只需更新 React 项目的依赖版本 |
| API 请求/响应变化 | 高 | 需要修改 API 层和类型定义 |
| 新增页面/组件 | 高 | 需要创建新的 React 页面/组件 |
| 现有组件功能修改 | 中 | 需要修改对应的 React 组件 |
| 路由配置变化 | 中 | 需要修改 React 路由 |
| 样式/CSS 变量变化 | 中 | 需要修改 CSS 或 Tailwind 配置 |

#### 第三步：按模块改写

##### 3.1 依赖升级

如果 Vue 项目的依赖有新版本：

```bash
# React 项目更新依赖
cd frontend-react
npm install <package-name>@<new-version>
```

常见依赖映射关系：

| Vue 项目 | React 项目 | 说明 |
|---------|-----------|------|
| tdesign-vue-next | shadcn/ui | UI 组件库 |
| vue-i18n | react-i18next | 国际化 |
| vue-router | react-router-dom | 路由 |
| Pinia | Zustand | 状态管理 |
| marked | react-markdown | Markdown 渲染 |
| marked-katex-extension | rehype-katex + remark-math | 数学公式 |

##### 3.2 API 变更

如果 Vue 项目的 API 有变化：

1. **请求格式变化**
   - 检查 `src/api/` 目录下的请求函数
   - 对应修改 `frontend-react/src/lib/api.ts` 或各 API 模块

2. **响应格式变化**
   - 检查类型定义文件
   - 更新 `frontend-react/src/types/index.ts`

3. **SSE 消息类型变化**
   - 检查 `src/api/chat/streame.ts` 中的消息处理
   - 对应修改 `frontend-react/src/hooks/useChatStream.ts`

##### 3.3 组件变更

如果 Vue 组件有修改：

1. **找到对应的 React 组件**
   - 使用组件名对照表查找
   - 例如：`AgentSelector.vue` → `AgentSelector.tsx`

2. **分析 Vue 组件的改动**
   - 新增的 props
   - 新增的功能
   - 修改的 UI 结构

3. **同步到 React 组件**
   ```tsx
   // React 组件示例结构
   interface MyComponentProps {
     // 对应 Vue 的 props
   }

   export function MyComponent({ prop1, prop2 }: MyComponentProps) {
     // 实现 Vue 组件的逻辑
   }
   ```

##### 3.4 页面变更

如果 Vue 页面有修改：

1. **找到对应的 React 页面**
   - 使用页面对照表查找
   - 例如：`chat/index.vue` → `chat/index.tsx`

2. **同步页面逻辑**
   - 路由参数处理
   - 状态初始化
   - 副作用（useEffect）

##### 3.5 Store 变更

如果 Pinia stores 有修改：

1. **找到对应的 Zustand store**
   - `stores/auth.ts` → `stores/authStore.ts`
   - `stores/settings.ts` → `stores/settingsStore.ts`

2. **同步状态和方法**
   ```typescript
   // Vue (Pinia)
   const state = ref(...)
   const computedValue = computed(...)
   function action() { ... }

   // React (Zustand)
   interface StoreState {
     state: ...
     computedValue: ...
     action: () => void
   }
   ```

#### 第四步：验证构建

```bash
cd frontend-react
npm run build
```

如果构建失败，参考错误信息修复。

---

### 快速对照表

#### Vue → React 文件映射

```
frontend/src/views/auth/Login.vue
  → frontend-react/src/pages/auth/Login.tsx

frontend/src/views/chat/index.vue
  → frontend-react/src/pages/chat/index.tsx

frontend/src/components/AgentSelector.vue
  → frontend-react/src/components/AgentSelector.tsx

frontend/src/stores/auth.ts
  → frontend-react/src/stores/authStore.ts

frontend/src/api/auth.ts
  → frontend-react/src/api/auth.ts

frontend/src/router/index.ts
  → frontend-react/src/App.tsx
```

#### 常见组件映射

| Vue (TDesign) | React (shadcn/ui) |
|--------------|-------------------|
| `<t-button>` | `<Button>` |
| `<t-input>` | `<Input>` |
| `<t-dialog>` | `<Dialog>` |
| `<t-select>` | `<Select>` |
| `<t-tabs>` | `<Tabs>` |
| `<t-dropdown>` | `<DropdownMenu>` |
| `<t-input-number>` | 自定义实现 |
| `<t-switch>` | `<Switch>` |
| `<t-checkbox>` | `<Checkbox>` |
| `<t-textarea>` | `<Textarea>` |

#### 组合式函数映射

| Vue | React |
|-----|-------|
| `ref()` | `useState()` |
| `computed()` | `useMemo()` / `useCallback()` |
| `watch()` | `useEffect()` |
| `watchEffect()` | `useEffect()` |
| `nextTick()` | `queueMicrotask()` / `requestAnimationFrame()` |
| `onMounted()` | `useEffect(() => {}, [])` |
| `onUnmounted()` | `useEffect(() => { return () => {} }, [])` |

---

### 升级检查清单

每次 Vue 版本升级后，逐项检查：

#### 依赖检查
- [ ] 新版本依赖是否影响 React 项目
- [ ] 是否有新增依赖需要添加
- [ ] 是否有废弃依赖需要移除

#### API 检查
- [ ] API 请求格式是否变化
- [ ] API 响应格式是否变化
- [ ] 是否有新增 API 接口
- [ ] SSE 消息类型是否变化

#### 组件检查
- [ ] 是否有新增 Vue 组件需要转换
- [ ] 现有 React 组件是否与 Vue 版本一致
- [ ] Props/Events 是否一致

#### 页面检查
- [ ] 是否有新增页面需要创建
- [ ] 现有 React 页面逻辑是否完整
- [ ] 路由配置是否正确

#### Store 检查
- [ ] 状态结构是否一致
- [ ] 是否有新增状态需要同步
- [ ] 持久化逻辑是否正确

#### 样式检查
- [ ] CSS 变量是否变化
- [ ] 主题是否更新
- [ ] 样式是否需要同步

#### 国际化检查
- [ ] 是否有新增翻译 key
- [ ] 翻译内容是否变化

---

### 示例：一次完整升级改写

假设 Vue 版本升级后，`AgentSelector.vue` 新增了一个 `onAgentChange` 事件。

#### 1. 分析变更

```bash
cd frontend
git diff HEAD~5 -- src/components/AgentSelector.vue
```

输出显示：
```vue
// 新增了 emit
const emit = defineEmits<{
  (e: 'agentChange', agent: Agent): void
}>()
```

#### 2. 更新文档

在 `vue-frontend-version.md` 中记录：
```markdown
### AgentSelector.vue 变更 (版本 X.X.X)
- 新增 `agentChange` 事件
```

#### 3. 修改 React 组件

```tsx
// frontend-react/src/components/AgentSelector.tsx

interface AgentSelectorProps {
  // ... 现有 props
  onAgentChange?: (agent: Agent) => void  // 新增
}

// 在组件中使用
const handleAgentSelect = (agent: Agent) => {
  props.onAgentChange?.(agent)
}
```

#### 4. 验证

```bash
cd frontend-react
npm run build
```

---

### 常用命令

```bash
# 进入 Vue 项目
cd frontend

# 查看最近变更
git log --oneline -20

# 查看特定文件的变更
git diff HEAD~5 -- src/components/AgentSelector.vue

# 进入 React 项目
cd frontend-react

# 构建 React 项目
npm run build

# 类型检查
npm run type-check
```

---

### 需要帮助时

如果遇到不确定如何转换的 Vue 代码：

1. **Composition API → Hooks**: Vue 的 `<script setup>` 组合式 API 可以直接转换为 React Hooks
2. **Provide/Inject → Context**: 使用 React 的 `createContext` + `useContext`
3. **Slot → Children**: Vue 的 slot 转换为 React 的 `children` prop
4. **Directive → Effect**: Vue 自定义指令转换为 `useEffect`

---

## 相关文件路径

```
WeKnora/
├── frontend/                    # Vue 前端项目
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.ts
│       ├── App.vue
│       ├── router/
│       ├── stores/
│       ├── api/
│       ├── components/
│       └── views/
├── frontend-react/              # React 前端项目
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/          # 已转换的组件
│       └── pages/               # 已转换的页面
└── docs/
    └── vue-frontend-version.md # 本文档
```
