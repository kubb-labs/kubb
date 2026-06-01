import type { HookEntry, LogEntry, PluginEntry } from '../state.ts'
import { attrs, formatMs } from '../format.ts'

type Props = {
  plugins: Array<PluginEntry>
  hooks: Array<HookEntry>
  selectedIndex: number
  spinnerFrame: string
}

function pluginStatusBadge(status: PluginEntry['status'], spinner: string): { text: string; bg: string; fg: string } {
  if (status === 'done') return { text: ' DONE ', bg: 'green', fg: 'black' }
  if (status === 'failed') return { text: ' FAIL ', bg: 'red', fg: 'black' }
  if (status === 'running') return { text: ` ${spinner} RUN `, bg: 'cyan', fg: 'black' }
  return { text: ' WAIT ', bg: '#444', fg: '#aaa' }
}

function hookStatusBadge(status: HookEntry['status'], spinner: string): { text: string; bg: string; fg: string } {
  if (status === 'done') return { text: ' DONE ', bg: 'green', fg: 'black' }
  if (status === 'failed') return { text: ' FAIL ', bg: 'red', fg: 'black' }
  return { text: ` ${spinner} RUN `, bg: 'cyan', fg: 'black' }
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

function renderPlugin(plugin: PluginEntry, spinner: string) {
  const badge = pluginStatusBadge(plugin.status, spinner)
  const events = plugin.events.slice(-14)
  return (
    <>
      <box flexDirection="row" paddingBottom={1}>
        <text>
          <span fg={badge.fg} bg={badge.bg} attributes={attrs.bold}>
            {badge.text}
          </span>
          <span fg="white" attributes={attrs.bold}>{`  ${plugin.name}`}</span>
          {plugin.duration !== undefined ? <span fg="#888" attributes={attrs.dim}>{`  ·  ${formatMs(plugin.duration)}`}</span> : null}
        </text>
      </box>
      <text>
        <span fg="#444" attributes={attrs.dim}>
          ─────────── events ───────────
        </span>
      </text>
      {events.length === 0 ? (
        <text>
          <span fg="#666" attributes={attrs.dim}>
            nothing yet — events appear here while this plugin is running
          </span>
        </text>
      ) : (
        events.map((entry) => (
          <text key={`${entry.at}-${entry.level}-${entry.message}`}>
            <span fg={levelColor(entry.level)}>{`${levelGlyph(entry.level)} `}</span>
            <span fg="#cccccc">{entry.message}</span>
            {entry.info ? <span fg="#666" attributes={attrs.dim}>{` ${entry.info}`}</span> : null}
          </text>
        ))
      )}
    </>
  )
}

function renderHook(hook: HookEntry, spinner: string) {
  const badge = hookStatusBadge(hook.status, spinner)
  const elapsed = formatMs((hook.finishedAt ?? Date.now()) - hook.startedAt)
  return (
    <>
      <box flexDirection="row" paddingBottom={1}>
        <text>
          <span fg={badge.fg} bg={badge.bg} attributes={attrs.bold}>
            {badge.text}
          </span>
          <span fg="white" attributes={attrs.bold}>{`  ${hook.command}`}</span>
          <span fg="#888" attributes={attrs.dim}>{`  ·  ${elapsed}`}</span>
        </text>
      </box>
      <text>
        <span fg="#444" attributes={attrs.dim}>
          ───── stdout / stderr ─────
        </span>
      </text>
      {hook.lines.length === 0 ? (
        <text>
          <span fg="#666" attributes={attrs.dim}>
            no output yet
          </span>
        </text>
      ) : (
        hook.lines.slice(-20).map((line) => (
          <text key={`${hook.id}-${line}`}>
            <span fg="#aaa">{line}</span>
          </text>
        ))
      )}
    </>
  )
}

export function PluginDetail({ plugins, hooks, selectedIndex, spinnerFrame }: Props) {
  let body: React.ReactNode
  if (selectedIndex < 0 || selectedIndex >= plugins.length + hooks.length) {
    body = (
      <text>
        <span fg="#888" attributes={attrs.dim}>
          use ↑/↓ to select a task
        </span>
      </text>
    )
  } else if (selectedIndex < plugins.length) {
    const plugin = plugins[selectedIndex]
    body = plugin ? renderPlugin(plugin, spinnerFrame) : null
  } else {
    const hook = hooks[selectedIndex - plugins.length]
    body = hook ? renderHook(hook, spinnerFrame) : null
  }

  return (
    <box
      title="Detail"
      titleAlignment="left"
      border
      borderStyle="rounded"
      borderColor="#444"
      flexDirection="column"
      paddingLeft={1}
      paddingRight={1}
      flexGrow={1}
    >
      {body}
    </box>
  )
}
