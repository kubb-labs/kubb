import type { HookEntry, LogEntry, PluginEntry } from '../state.ts'
import { attrs, formatMs } from '../format.ts'

type Props = {
  plugins: Array<PluginEntry>
  hooks: Array<HookEntry>
  logs: Array<LogEntry>
  selectedIndex: number
}

function pluginRecentLogs(logs: Array<LogEntry>, plugin: PluginEntry): Array<LogEntry> {
  const needle = plugin.name
  const filtered = logs.filter((l) => l.message.includes(needle) || (l.info ?? '').includes(needle))
  return (filtered.length > 0 ? filtered : logs).slice(-12)
}

function renderEntry(entry: LogEntry, key: string) {
  const color = entry.level === 'error' ? 'red' : entry.level === 'warn' ? 'yellow' : entry.level === 'success' ? 'green' : '#aaa'
  return (
    <text key={key}>
      <span fg={color}>{`• ${entry.message}`}</span>
      {entry.info ? <span fg="#666" attributes={attrs.dim}>{` ${entry.info}`}</span> : null}
    </text>
  )
}

function renderPlugin(plugin: PluginEntry, logs: Array<LogEntry>) {
  const statusFg = plugin.status === 'done' ? 'green' : plugin.status === 'failed' ? 'red' : plugin.status === 'running' ? 'cyan' : '#888'
  const recent = pluginRecentLogs(logs, plugin)
  return (
    <>
      <text>
        <span fg="#666" attributes={attrs.dim}>
          plugin{' '}
        </span>
        <span fg="white" attributes={attrs.bold}>
          {plugin.name}
        </span>
      </text>
      <text>
        <span fg="#666" attributes={attrs.dim}>
          status{' '}
        </span>
        <span fg={statusFg}>{plugin.status}</span>
        {plugin.duration !== undefined ? <span fg="#666" attributes={attrs.dim}>{`  ·  ${formatMs(plugin.duration)}`}</span> : null}
      </text>
      <text>
        <span fg="#444" attributes={attrs.dim}>
          ───── recent events ─────
        </span>
      </text>
      {recent.length === 0 ? (
        <text>
          <span fg="#666" attributes={attrs.dim}>
            nothing yet
          </span>
        </text>
      ) : (
        recent.map((entry, i) => renderEntry(entry, `${entry.at}-${i}`))
      )}
    </>
  )
}

function renderHook(hook: HookEntry) {
  const elapsed = formatMs((hook.finishedAt ?? Date.now()) - hook.startedAt)
  const statusFg = hook.status === 'done' ? 'green' : hook.status === 'failed' ? 'red' : 'cyan'
  return (
    <>
      <text>
        <span fg="#666" attributes={attrs.dim}>
          hook{' '}
        </span>
        <span fg="white" attributes={attrs.bold}>
          {hook.command}
        </span>
      </text>
      <text>
        <span fg="#666" attributes={attrs.dim}>
          status{' '}
        </span>
        <span fg={statusFg}>{hook.status}</span>
        <span fg="#666" attributes={attrs.dim}>{`  ·  ${elapsed}`}</span>
      </text>
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

export function TaskDetail({ plugins, hooks, logs, selectedIndex }: Props) {
  let body: React.ReactNode
  if (selectedIndex < 0 || selectedIndex >= plugins.length + hooks.length) {
    body = (
      <text>
        <span fg="#888" attributes={attrs.dim}>
          select a task with ↑/↓ to see its detail
        </span>
      </text>
    )
  } else if (selectedIndex < plugins.length) {
    const plugin = plugins[selectedIndex]
    body = plugin ? renderPlugin(plugin, logs) : null
  } else {
    const hook = hooks[selectedIndex - plugins.length]
    body = hook ? renderHook(hook) : null
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
      flexGrow={2}
    >
      {body}
    </box>
  )
}
