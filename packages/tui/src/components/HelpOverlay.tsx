import { attrs } from '../format.ts'

type Binding = {
  keys: string
  description: string
}

const BINDINGS: Array<Binding> = [
  { keys: '↑ / ↓  ·  k / j', description: 'select task in the left pane' },
  { keys: 'enter', description: 'expand the selected task to full screen' },
  { keys: 'esc', description: 'leave the expanded / help view' },
  { keys: 'r', description: 'restart the last generation' },
  { keys: 'c', description: 'clear the log pane' },
  { keys: '?', description: 'toggle this help overlay' },
  { keys: 'q  ·  ctrl+c', description: 'quit kubb' },
]

export function HelpOverlay() {
  const maxKey = Math.max(...BINDINGS.map((b) => b.keys.length))
  return (
    <box
      title="Help"
      titleAlignment="left"
      border
      borderStyle="rounded"
      borderColor="cyan"
      flexDirection="column"
      paddingLeft={2}
      paddingRight={2}
      paddingTop={1}
      paddingBottom={1}
      flexGrow={1}
    >
      <text>
        <span fg="white" attributes={attrs.bold}>
          Keybindings
        </span>
      </text>
      <text>
        <span fg="#444" attributes={attrs.dim}>
          ───────────────────────────────────
        </span>
      </text>
      {BINDINGS.map((b) => (
        <text key={b.keys}>
          <span fg="cyan">{b.keys.padEnd(maxKey + 2)}</span>
          <span fg="#aaa">{b.description}</span>
        </text>
      ))}
      <text>
        <span fg="#444" attributes={attrs.dim}>
          ───────────────────────────────────
        </span>
      </text>
      <text>
        <span fg="#666" attributes={attrs.dim}>
          The TUI stays open after generation finishes, so you can scroll through results.
        </span>
      </text>
      <text>
        <span fg="#666" attributes={attrs.dim}>
          Press{' '}
        </span>
        <span fg="cyan">?</span>
        <span fg="#666" attributes={attrs.dim}>
          {' '}
          or{' '}
        </span>
        <span fg="cyan">esc</span>
        <span fg="#666" attributes={attrs.dim}>
          {' '}
          to close this overlay.
        </span>
      </text>
    </box>
  )
}
