import type { TuiState } from '../state.ts'
import { attrs, formatElapsed } from '../format.ts'

type Props = {
  state: TuiState
  /**
   * Render frame counter; bumping it forces the elapsed clock to refresh.
   */
  tick: number
}

function statusColor(status: TuiState['status']): string {
  if (status === 'success') return 'green'
  if (status === 'failed') return 'red'
  if (status === 'running') return 'cyan'
  return '#888'
}

function statusLabel(status: TuiState['status']): string {
  if (status === 'success') return '✓ success'
  if (status === 'failed') return '✗ failed'
  if (status === 'running') return '● running'
  return '○ idle'
}

export function HeaderBar({ state, tick: _tick }: Props) {
  const elapsed = formatElapsed(state.startedAt, state.finishedAt)
  const title = state.configName ? `Kubb v${state.version} · ${state.configName}` : `Kubb v${state.version}`
  const warnCount = state.logs.filter((l) => l.level === 'warn').length
  const errorCount = state.logs.filter((l) => l.level === 'error').length

  return (
    <box
      title={title}
      titleAlignment="left"
      border
      borderStyle="rounded"
      borderColor="cyan"
      flexDirection="row"
      justifyContent="space-between"
      paddingLeft={1}
      paddingRight={1}
      flexGrow={1}
    >
      <text>
        <span fg={statusColor(state.status)} attributes={attrs.bold}>
          {statusLabel(state.status)}
        </span>
        {errorCount > 0 ? (
          <>
            <span fg="#888" attributes={attrs.dim}>
              {'   '}
            </span>
            <span fg="black" bg="red" attributes={attrs.bold}>{` ✗ ${errorCount} `}</span>
          </>
        ) : null}
        {warnCount > 0 ? (
          <>
            <span fg="#888" attributes={attrs.dim}>
              {' '}
            </span>
            <span fg="black" bg="yellow" attributes={attrs.bold}>{` ⚠ ${warnCount} `}</span>
          </>
        ) : null}
        {state.updateAvailable ? <span fg="yellow" attributes={attrs.dim}>{`  update → v${state.updateAvailable.latestVersion}`}</span> : null}
      </text>
      <text>
        <span fg="#888" attributes={attrs.dim}>
          elapsed{' '}
        </span>
        <span fg="green">{elapsed}</span>
      </text>
    </box>
  )
}
