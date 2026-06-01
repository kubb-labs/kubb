import type { DebugEntry } from '../state.ts'
import { attrs } from '../format.ts'

type Props = {
  entries: Array<DebugEntry>
}

export function DebugStream({ entries }: Props) {
  const recent = entries.slice(-24)
  return (
    <scrollbox
      title="Debug stream"
      titleAlignment="left"
      stickyScroll
      stickyStart="bottom"
      border
      borderStyle="rounded"
      borderColor="#444"
      flexDirection="column"
      paddingLeft={1}
      paddingRight={1}
      flexGrow={2}
    >
      {recent.length === 0 ? (
        <text>
          <span fg="#666" attributes={attrs.dim}>
            waiting for events…
          </span>
        </text>
      ) : (
        recent.map((entry) => (
          <text key={`${entry.at}-${entry.message}`}>
            <span fg="#888" attributes={attrs.dim}>
              ›{' '}
            </span>
            <span fg="#cccccc">{entry.message}</span>
            {entry.info ? <span fg="#666" attributes={attrs.dim}>{` ${entry.info}`}</span> : null}
          </text>
        ))
      )}
    </scrollbox>
  )
}
