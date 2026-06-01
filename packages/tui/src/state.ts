/**
 * The maximum number of log entries retained in memory.
 * Older entries are discarded to keep the React tree cheap to diff.
 */
export const LOG_BUFFER_LIMIT = 1000

/**
 * The maximum number of subprocess output lines kept per hook.
 */
export const HOOK_LINE_LIMIT = 200

export type PluginStatus = 'queued' | 'running' | 'done' | 'failed'

export type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug'

export type LogEntry = {
  level: LogLevel
  message: string
  info?: string
  at: number
}

export type PluginEntry = {
  name: string
  status: PluginStatus
  duration?: number
}

export type HookEntry = {
  id: string
  command: string
  status: 'running' | 'done' | 'failed'
  lines: Array<string>
  startedAt: number
  finishedAt?: number
}

export type RunStatus = 'idle' | 'running' | 'success' | 'failed'

export type TuiState = {
  version: string
  configName?: string
  status: RunStatus
  startedAt?: number
  finishedAt?: number
  plugins: Array<PluginEntry>
  files: { total: number; processed: number; current?: string }
  logs: Array<LogEntry>
  hooks: Array<HookEntry>
  updateAvailable?: { currentVersion: string; latestVersion: string }
}

export type TuiAction =
  | { type: 'lifecycle:start'; version: string }
  | { type: 'lifecycle:end' }
  | { type: 'generation:start'; configName?: string; pluginNames: Array<string>; at: number }
  | { type: 'generation:end'; status: RunStatus; at: number }
  | { type: 'plugin:start'; name: string }
  | { type: 'plugin:end'; name: string; success: boolean; duration: number }
  | { type: 'files:start'; total: number }
  | { type: 'files:update'; processed: number; current?: string }
  | { type: 'files:end' }
  | { type: 'hook:start'; id: string; command: string; at: number }
  | { type: 'hook:line'; id: string; line: string }
  | { type: 'hook:end'; id: string; success: boolean; at: number }
  | { type: 'log'; entry: LogEntry }
  | { type: 'version:new'; currentVersion: string; latestVersion: string }

export function createInitialState(): TuiState {
  return {
    version: '',
    status: 'idle',
    plugins: [],
    files: { total: 0, processed: 0 },
    logs: [],
    hooks: [],
  }
}

function appendCapped<T>(list: Array<T>, item: T, limit: number): Array<T> {
  if (list.length < limit) {
    return [...list, item]
  }
  return [...list.slice(list.length - limit + 1), item]
}

function updatePlugin(plugins: Array<PluginEntry>, name: string, patch: Partial<PluginEntry>): Array<PluginEntry> {
  const index = plugins.findIndex((p) => p.name === name)
  if (index === -1) {
    return [...plugins, { name, status: 'queued', ...patch }]
  }
  const existing = plugins[index]
  if (!existing) return plugins
  const next = plugins.slice()
  next[index] = { ...existing, ...patch, name: existing.name, status: patch.status ?? existing.status }
  return next
}

function updateHook(hooks: Array<HookEntry>, id: string, patch: (hook: HookEntry) => HookEntry): Array<HookEntry> {
  const index = hooks.findIndex((h) => h.id === id)
  if (index === -1) {
    return hooks
  }
  const existing = hooks[index]
  if (!existing) return hooks
  const next = hooks.slice()
  next[index] = patch(existing)
  return next
}

export function reducer(state: TuiState, action: TuiAction): TuiState {
  switch (action.type) {
    case 'lifecycle:start':
      return { ...state, version: action.version }
    case 'lifecycle:end':
      return state
    case 'generation:start':
      return {
        ...state,
        status: 'running',
        startedAt: action.at,
        finishedAt: undefined,
        configName: action.configName,
        plugins: action.pluginNames.map((name) => ({ name, status: 'queued' })),
        files: { total: 0, processed: 0 },
        hooks: [],
      }
    case 'generation:end':
      return { ...state, status: action.status, finishedAt: action.at }
    case 'plugin:start':
      return { ...state, plugins: updatePlugin(state.plugins, action.name, { status: 'running' }) }
    case 'plugin:end':
      return {
        ...state,
        plugins: updatePlugin(state.plugins, action.name, {
          status: action.success ? 'done' : 'failed',
          duration: action.duration,
        }),
      }
    case 'files:start':
      return { ...state, files: { total: action.total, processed: 0 } }
    case 'files:update':
      return {
        ...state,
        files: { ...state.files, processed: action.processed, current: action.current },
      }
    case 'files:end':
      return { ...state, files: { ...state.files, current: undefined } }
    case 'hook:start':
      return {
        ...state,
        hooks: [...state.hooks, { id: action.id, command: action.command, status: 'running', lines: [], startedAt: action.at }],
      }
    case 'hook:line':
      return {
        ...state,
        hooks: updateHook(state.hooks, action.id, (hook) => ({ ...hook, lines: appendCapped(hook.lines, action.line, HOOK_LINE_LIMIT) })),
      }
    case 'hook:end':
      return {
        ...state,
        hooks: updateHook(state.hooks, action.id, (hook) => ({
          ...hook,
          status: action.success ? 'done' : 'failed',
          finishedAt: action.at,
        })),
      }
    case 'log':
      return { ...state, logs: appendCapped(state.logs, action.entry, LOG_BUFFER_LIMIT) }
    case 'version:new':
      return { ...state, updateAvailable: { currentVersion: action.currentVersion, latestVersion: action.latestVersion } }
    default:
      return state
  }
}
