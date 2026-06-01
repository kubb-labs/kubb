/**
 * The maximum number of log entries retained in memory.
 * Older entries are discarded to keep the React tree cheap to diff.
 */
export const LOG_BUFFER_LIMIT = 1000

/**
 * The maximum number of debug entries retained for the live debug stream.
 * Kept tighter than the log buffer so the right-pane render stays cheap.
 */
export const DEBUG_BUFFER_LIMIT = 500

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

export type DebugEntry = {
  message: string
  info?: string
  at: number
}

export type PluginEntry = {
  name: string
  status: PluginStatus
  duration?: number
  /**
   * Events attributed to this plugin while it was the active runner.
   * Capped at {@link PLUGIN_EVENT_LIMIT} entries.
   */
  events: Array<LogEntry>
}

/**
 * Maximum number of events retained per plugin for the detail pane. Older
 * entries fall off the front so a long-running plugin doesn't drag down
 * reconciler perf.
 */
export const PLUGIN_EVENT_LIMIT = 50

export type HookEntry = {
  id: string
  command: string
  status: 'running' | 'done' | 'failed'
  lines: Array<string>
  startedAt: number
  finishedAt?: number
}

export type RunStatus = 'idle' | 'running' | 'success' | 'failed'

export type UiMode = 'normal' | 'detail' | 'help'

export type TuiState = {
  version: string
  configName?: string
  status: RunStatus
  startedAt?: number
  finishedAt?: number
  plugins: Array<PluginEntry>
  files: { total: number; processed: number; current?: string }
  logs: Array<LogEntry>
  /**
   * Rolling stream of `kubb:info` and `kubb:debug` events, used to populate
   * the right-side detail pane. Capped at {@link DEBUG_BUFFER_LIMIT}.
   */
  debug: Array<DebugEntry>
  hooks: Array<HookEntry>
  updateAvailable?: { currentVersion: string; latestVersion: string }
  /**
   * Index of the highlighted row in the task list. -1 when nothing is
   * selected yet. Resets to 0 when a new generation begins so the focus lands
   * on the first plugin.
   */
  selectedTaskIndex: number
  /**
   * Name of the plugin that's currently running (between `plugin:start` and
   * `plugin:end`). Used to attribute incoming log entries to the right
   * plugin so the detail pane can show real per-plugin context.
   */
  currentPluginName?: string
  /**
   * Current UI mode. `normal` is the default split view. `detail` expands the
   * selected task to fill the main area. `help` shows the keybinding overlay.
   */
  ui: { mode: UiMode }
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
  | { type: 'debug'; entry: DebugEntry }
  | { type: 'version:new'; currentVersion: string; latestVersion: string }
  | { type: 'ui:select'; delta: number }
  | { type: 'ui:select:exact'; index: number }
  | { type: 'ui:set-mode'; mode: UiMode }
  | { type: 'ui:clear-logs' }

export function createInitialState(): TuiState {
  return {
    version: '',
    status: 'idle',
    plugins: [],
    files: { total: 0, processed: 0 },
    logs: [],
    debug: [],
    hooks: [],
    selectedTaskIndex: -1,
    ui: { mode: 'normal' },
  }
}

function clampSelection(index: number, plugins: Array<PluginEntry>, hooks: Array<HookEntry>): number {
  const total = plugins.length + hooks.length
  if (total === 0) return -1
  if (index < 0) return 0
  if (index >= total) return total - 1
  return index
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
    return [...plugins, { name, status: 'queued', events: [], ...patch }]
  }
  const existing = plugins[index]
  if (!existing) return plugins
  const next = plugins.slice()
  next[index] = { ...existing, ...patch, name: existing.name, status: patch.status ?? existing.status, events: patch.events ?? existing.events }
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
        plugins: action.pluginNames.map((name) => ({ name, status: 'queued', events: [] })),
        files: { total: 0, processed: 0 },
        hooks: [],
        selectedTaskIndex: action.pluginNames.length > 0 ? 0 : -1,
        currentPluginName: undefined,
      }
    case 'generation:end':
      return { ...state, status: action.status, finishedAt: action.at }
    case 'ui:select': {
      if (state.plugins.length + state.hooks.length === 0) return state
      const next = clampSelection((state.selectedTaskIndex < 0 ? 0 : state.selectedTaskIndex) + action.delta, state.plugins, state.hooks)
      return { ...state, selectedTaskIndex: next }
    }
    case 'ui:select:exact':
      return { ...state, selectedTaskIndex: clampSelection(action.index, state.plugins, state.hooks) }
    case 'ui:set-mode':
      return { ...state, ui: { ...state.ui, mode: action.mode } }
    case 'ui:clear-logs':
      return { ...state, logs: [], debug: [] }
    case 'plugin:start':
      return {
        ...state,
        plugins: updatePlugin(state.plugins, action.name, { status: 'running' }),
        currentPluginName: action.name,
      }
    case 'plugin:end':
      return {
        ...state,
        plugins: updatePlugin(state.plugins, action.name, {
          status: action.success ? 'done' : 'failed',
          duration: action.duration,
        }),
        currentPluginName: state.currentPluginName === action.name ? undefined : state.currentPluginName,
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
    case 'log': {
      const next: TuiState = { ...state, logs: appendCapped(state.logs, action.entry, LOG_BUFFER_LIMIT) }
      if (state.currentPluginName) {
        next.plugins = updatePlugin(state.plugins, state.currentPluginName, {
          events: appendCapped(state.plugins.find((p) => p.name === state.currentPluginName)?.events ?? [], action.entry, PLUGIN_EVENT_LIMIT),
        })
      }
      return next
    }
    case 'debug':
      return { ...state, debug: appendCapped(state.debug, action.entry, DEBUG_BUFFER_LIMIT) }
    case 'version:new':
      return { ...state, updateAvailable: { currentVersion: action.currentVersion, latestVersion: action.latestVersion } }
    default:
      return state
  }
}
