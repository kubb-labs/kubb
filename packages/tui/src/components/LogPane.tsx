import type { LogEntry } from '../state.ts'
import { attrs } from '../format.ts'

type Props = {
  logs: Array<LogEntry>
}

function glyph(level: LogEntry['level']): { char: string; color: string } {
  if (level === 'error') return { char: '✗', color: 'red' }
  if (level === 'warn') return { char: '⚠', color: 'yellow' }
  if (level === 'success') return { char: '✓', color: 'green' }
  if (level === 'debug') return { char: '·', color: '#888' }
  return { char: 'ℹ', color: 'blue' }
}

export function LogPane({ logs }: Props) {
  return (
    <scrollbox
      title={`Log  (${logs.length})`}
      titleAlignment="left"
      stickyScroll
      stickyStart="bottom"
      border
      borderStyle="rounded"
      borderColor="#444"
      flexGrow={1}
      paddingLeft={1}
      paddingRight={1}
      flexDirection="column"
    >
      {logs.length === 0 ? (
        <text>
          <span fg="#888" attributes={attrs.dim}>no events yet</span>
        </text>
      ) : (
        logs.map((entry) => {
          const g = glyph(entry.level)
          return (
            <text key={`${entry.at}-${entry.level}-${entry.message}`}>
              <span fg={g.color}>{g.char}</span>
              <span>{` ${entry.message}`}</span>
              {entry.info ? <span fg="#888" attributes={attrs.dim}>{` ${entry.info}`}</span> : null}
            </text>
          )
        })
      )}
    </scrollbox>
  )
}
