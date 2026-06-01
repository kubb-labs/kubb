import type { HookEntry, LogEntry, PluginEntry, TuiState } from '../state.ts'
import { resolveSelection } from '../state.ts'
import { attrs, formatMs, truncateLeft } from '../format.ts'

type Props = {
  plugins: Array<PluginEntry>
  hooks: Array<HookEntry>
  files: TuiState['files']
  filesActive: boolean
  filesDone: boolean
  logs: Array<LogEntry>
  selectedIndex: number
  spinnerFrame: string
}

function levelColor(level: LogEntry['level']): string {
  if (level === 'error') return 'red'
  if (level === 'warn') return 'yellow'
  if (level === 'success') return 'green'
  if (level === 'debug') return '#888'
  return '#cccccc'
}

function levelGlyph(level: LogEntry['level']): string {
  if (level === 'error') return '✗'
  if (level === 'warn') return '⚠'
  if (level === 'success') return '✓'
  if (level === 'debug') return '·'
  return 'ℹ'
}

function pluginBadge(status: PluginEntry['status'], spinner: string): { text: string; bg: string; fg: string } {
  if (status === 'done') return { text: ' DONE ', bg: 'green', fg: 'black' }
  if (status === 'failed') return { text: ' FAIL ', bg: 'red', fg: 'black' }
  if (status === 'running') return { text: ` ${spinner} RUN `, bg: 'cyan', fg: 'black' }
  return { text: ' WAIT ', bg: '#444', fg: '#aaa' }
}

function hookBadge(status: HookEntry['status'], spinner: string): { text: string; bg: string; fg: string } {
  if (status === 'done') return { text: ' DONE ', bg: 'green', fg: 'black' }
  if (status === 'failed') return { text: ' FAIL ', bg: 'red', fg: 'black' }
  return { text: ` ${spinner} RUN `, bg: 'cyan', fg: 'black' }
}

function filesBadge(active: boolean, done: boolean, spinner: string): { text: string; bg: string; fg: string } {
  if (done) return { text: ' DONE ', bg: 'green', fg: 'black' }
  if (active) return { text: ` ${spinner} RUN `, bg: 'cyan', fg: 'black' }
  return { text: ' WAIT ', bg: '#444', fg: '#aaa' }
}

type Heading = { badge: { text: string; bg: string; fg: string }; title: string; meta?: string }

function renderHeading(h: Heading) {
  return (
    <text>
      <span fg={h.badge.fg} bg={h.badge.bg} attributes={attrs.bold}>
        {h.badge.text}
      </span>
      <span fg="white" attributes={attrs.bold}>{`  ${h.title}`}</span>
      {h.meta ? <span fg="#888" attributes={attrs.dim}>{`  ·  ${h.meta}`}</span> : null}
    </text>
  )
}

function renderEntries(entries: Array<LogEntry>) {
  return entries.map((entry) => (
    <text key={`${entry.at}-${entry.level}-${entry.message}`}>
      <span fg={levelColor(entry.level)}>{`${levelGlyph(entry.level)} `}</span>
      <span fg="#cccccc">{entry.message}</span>
      {entry.info ? <span fg="#666" attributes={attrs.dim}>{` ${entry.info}`}</span> : null}
    </text>
  ))
}

function renderPlugin(plugin: PluginEntry, spinner: string) {
  const events = plugin.events.slice(-30)
  return (
    <>
      {renderHeading({
        badge: pluginBadge(plugin.status, spinner),
        title: plugin.name,
        meta: plugin.duration !== undefined ? formatMs(plugin.duration) : undefined,
      })}
      <text>
        <span fg="#444" attributes={attrs.dim}>
          ──────────────── events ────────────────
        </span>
      </text>
      {events.length === 0 ? (
        <text>
          <span fg="#666" attributes={attrs.dim}>
            nothing emitted while this plugin ran
          </span>
        </text>
      ) : (
        renderEntries(events)
      )}
    </>
  )
}

function renderHook(hook: HookEntry, spinner: string) {
  const elapsed = formatMs((hook.finishedAt ?? Date.now()) - hook.startedAt)
  return (
    <>
      {renderHeading({ badge: hookBadge(hook.status, spinner), title: hook.command, meta: elapsed })}
      <text>
        <span fg="#444" attributes={attrs.dim}>
          ──────────────── stdout / stderr ────────────────
        </span>
      </text>
      {hook.lines.length === 0 ? (
        <text>
          <span fg="#666" attributes={attrs.dim}>
            no output yet
          </span>
        </text>
      ) : (
        hook.lines.slice(-30).map((line) => (
          <text key={`${hook.id}-${line}`}>
            <span fg="#aaa">{line}</span>
          </text>
        ))
      )}
    </>
  )
}

function renderFiles(files: TuiState['files'], active: boolean, done: boolean, spinner: string) {
  return (
    <>
      {renderHeading({
        badge: filesBadge(active, done, spinner),
        title: 'files',
        meta: `${files.processed}/${files.total || '—'}`,
      })}
      <text>
        <span fg="#444" attributes={attrs.dim}>
          ──────────────── current ────────────────
        </span>
      </text>
      <text>
        <span fg="#cccccc">{files.current ? truncateLeft(files.current, 90) : 'idle'}</span>
      </text>
    </>
  )
}

function renderAll(logs: Array<LogEntry>) {
  const recent = logs.slice(-40)
  return (
    <>
      <text>
        <span fg="white" attributes={attrs.bold}>
          All events
        </span>
        <span fg="#888" attributes={attrs.dim}>{`  (${logs.length})`}</span>
      </text>
      <text>
        <span fg="#444" attributes={attrs.dim}>
          ──────────────────────────────
        </span>
      </text>
      {recent.length === 0 ? (
        <text>
          <span fg="#666" attributes={attrs.dim}>
            no events yet
          </span>
        </text>
      ) : (
        renderEntries(recent)
      )}
      {logs.length === 0 ? null : (
        <text>
          <span fg="#666" attributes={attrs.dim}>
            ↑/↓ pick a task to filter
          </span>
        </text>
      )}
    </>
  )
}

function renderBody(
  resolved: ReturnType<typeof resolveSelection>,
  files: TuiState['files'],
  filesActive: boolean,
  filesDone: boolean,
  logs: Array<LogEntry>,
  spinner: string,
): React.ReactNode {
  switch (resolved.kind) {
    case 'plugin':
      return renderPlugin(resolved.plugin, spinner)
    case 'hook':
      return renderHook(resolved.hook, spinner)
    case 'files':
      return renderFiles(files, filesActive, filesDone, spinner)
    default:
      return renderAll(logs)
  }
}

function paneTitle(resolved: ReturnType<typeof resolveSelection>): string {
  if (resolved.kind === 'plugin') return `Log · ${resolved.plugin.name}`
  if (resolved.kind === 'hook') return `Log · ${resolved.hook.command}`
  if (resolved.kind === 'files') return 'Log · files'
  return 'Log · all'
}

export function TaskLog({ plugins, hooks, files, filesActive, filesDone, logs, selectedIndex, spinnerFrame }: Props) {
  const resolved = resolveSelection(selectedIndex, plugins, hooks)
  const body = renderBody(resolved, files, filesActive, filesDone, logs, spinnerFrame)

  return (
    <box
      title={paneTitle(resolved)}
      titleAlignment="left"
      border
      borderStyle="rounded"
      borderColor="#444"
      flexDirection="column"
      paddingLeft={2}
      paddingRight={2}
      paddingTop={1}
      paddingBottom={1}
      flexGrow={1}
    >
      {body}
    </box>
  )
}
