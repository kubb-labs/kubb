import { attrs, formatElapsed } from '../format.ts'
import type { TuiState } from '../state.ts'

type Props = {
  state: TuiState
}

function badge(status: TuiState['status']): { text: string; color: string } {
  if (status === 'success') return { text: ' DONE ', color: 'green' }
  if (status === 'failed') return { text: ' FAIL ', color: 'red' }
  if (status === 'running') return { text: ' RUN  ', color: 'cyan' }
  return { text: ' IDLE ', color: '#666' }
}

export function StatusBar({ state }: Props) {
  const b = badge(state.status)
  const completed = state.plugins.filter((p) => p.status === 'done').length
  const failed = state.plugins.filter((p) => p.status === 'failed').length
  const elapsed = formatElapsed(state.startedAt, state.finishedAt)

  return (
    <box border borderStyle="rounded" borderColor="#333" flexDirection="row" justifyContent="space-between" paddingLeft={1} paddingRight={1}>
      <text>
        <span fg="black" bg={b.color} attributes={attrs.bold}>
          {b.text}
        </span>
        <span fg="#888" attributes={attrs.dim}>{`  plugins `}</span>
        <span fg="green">{completed.toString()}</span>
        {failed > 0 ? (
          <>
            <span fg="#888" attributes={attrs.dim}>
              /
            </span>
            <span fg="red">{failed.toString()}</span>
          </>
        ) : null}
        <span fg="#888" attributes={attrs.dim}>{`  files `}</span>
        <span fg="green">{state.files.processed.toString()}</span>
        <span fg="#888" attributes={attrs.dim}>{`/${state.files.total}`}</span>
        <span fg="#888" attributes={attrs.dim}>{`  elapsed `}</span>
        <span fg="green">{elapsed}</span>
      </text>
      <text>
        <span fg="#666" attributes={attrs.dim}>
          ↑/↓ select · space expand · r restart · c clear · ? help · q quit
        </span>
      </text>
    </box>
  )
}
