import process from 'node:process'
import { styleText } from 'node:util'
import { getElapsedMs } from '@internals/utils'
import { logLevel as logLevelMap } from '@kubb/core'
import { formatMsWithColor } from '../banner.ts'
import type { LoggerContext } from './context.ts'
import type { Spinner } from './spinner.ts'

export type Phases = ReturnType<typeof createPhases>

/**
 * One output phase while its step owns the line. A phase buffers what it is told, because a spinner
 * redraws over anything written under it, and prints the lot once it knows its own result.
 */
type Phase = StartPhaseOptions & {
  failed: boolean
  hrStart: [number, number]
  lines: Array<string>
  /**
   * Raw lines a hook printed, drawn outside the group.
   */
  output: Array<string>
}

type StartPhaseOptions = {
  /**
   * Shown while the phase runs.
   */
  running: string
  success: string
  failure: string
  /**
   * Whether each hook's own result is worth a line. Format and lint run one command, so the phase
   * result already says everything; the post-generate phase runs several.
   */
  showHookResults?: boolean
}

/**
 * The three output phases, in the order the generate runner runs them.
 */
const PHASES = {
  format: { running: 'Formatting', success: 'Formatted', failure: 'Formatting failed' },
  lint: { running: 'Linting', success: 'Linted', failure: 'Linting failed' },
  hooks: {
    running: 'Running post-generate hooks',
    success: 'Post-generate hooks completed',
    failure: 'Post-generate hooks failed',
    showHookResults: true,
  },
} as const satisfies Record<string, StartPhaseOptions>

/** A hook's display name: its `name`, or the command line it runs. */
function formatHookLabel({ command, name, args }: { command: string; name?: string; args?: ReadonlyArray<string> }): string {
  return name ?? (args?.length ? `${command} ${args.join(' ')}` : command)
}

/**
 * Drops the blank lines a subprocess leaves at either end of its output, so its block does not open
 * or close on an empty row.
 */
function trimBlankEdges(lines: ReadonlyArray<string>): Array<string> {
  const start = lines.findIndex((line) => line.trim())
  if (start === -1) {
    return []
  }

  return lines.slice(start, lines.findLastIndex((line) => line.trim()) + 1)
}

/** The format, lint and post-generate phases, and the hooks and messages they buffer while their step owns the line. */
export function createPhases({ writer, silent, logLevel, text, line, onRun }: LoggerContext, spinner: Spinner) {
  const state = {
    phase: null as Phase | null,
    hooks: new Map<string, { hrStart: [number, number]; lines: Array<string> }>(),
  }

  function startPhase(options: StartPhaseOptions) {
    state.phase = { ...options, failed: false, hrStart: process.hrtime(), lines: [], output: [] }
    spinner.start(options.running)
  }

  function endPhase() {
    const phase = state.phase
    state.phase = null

    if (!phase || silent) {
      return
    }

    const duration = formatMsWithColor(getElapsedMs(phase.hrStart))

    spinner.stop(phase.failed ? `${phase.failure} after ${duration}` : `${phase.success} in ${duration}`, phase.failed ? 'failed' : 'success')

    if (phase.lines.length) {
      writer.block(phase.lines)
    }
    writeOutput(phase.output)
  }

  function writeOutput(lines: ReadonlyArray<string>) {
    const output = trimBlankEdges(lines)
    if (output.length) {
      writer.raw(output)
    }
  }

  onRun('kubb:format:start', () => startPhase(PHASES.format))
  onRun('kubb:format:end', endPhase)
  onRun('kubb:lint:start', () => startPhase(PHASES.lint))
  onRun('kubb:lint:end', endPhase)
  onRun('kubb:hooks:start', () => startPhase(PHASES.hooks))
  onRun('kubb:hooks:end', endPhase)

  onRun('kubb:hook:end', (ctx) => {
    const { id, command, name, args, success, error } = ctx
    if (!id) {
      return
    }

    if (!success && state.phase) {
      state.phase.failed = true
    }

    if (silent) {
      // Even when silent, surface a failed hook's captured output. `stdout` and `stderr` only exist on a failed result.
      if (!ctx.success) {
        if (ctx.stdout) console.log(ctx.stdout)
        if (ctx.stderr) console.error(ctx.stderr)
      }
      return
    }

    const active = state.hooks.get(id)
    if (!active) {
      return
    }
    state.hooks.delete(id)

    const label = styleText('dim', formatHookLabel({ command, name, args }))
    const reason = error?.message ? ` (${error.message})` : ''
    const result = success
      ? `${styleText('green', '✓')} ${label} in ${formatMsWithColor(getElapsedMs(active.hrStart))}`
      : `${styleText('red', '✗')} ${label} failed${reason}`

    const phase = state.phase
    if (phase) {
      if (phase.showHookResults || !success) {
        phase.lines.push(result)
      }
      phase.output.push(...active.lines)
      return
    }

    spinner.stop()
    writer.step(text(result))
    writeOutput(active.lines)
  })

  // Not registered at silent: the missing `kubb:hook:line` listener is also what tells the runner not to stream.
  if (!silent) {
    onRun('kubb:info', ({ message, info }) => {
      const formatted = line(styleText('blue', 'ℹ'), message, info)

      // Info carries something new (the auto-detected tool), so inside a phase it waits for the phase to print.
      if (state.phase) {
        state.phase.lines.push(formatted)
        return
      }
      if (spinner.message(formatted)) {
        return
      }
      writer.info(formatted)
    })

    onRun('kubb:success', ({ message, info }) => {
      const formatted = line(styleText('green', '✓'), message, logLevel >= logLevelMap.info ? info : undefined)

      // The phase step's own result already reports these successes, so let the step carry them.
      if (spinner.message(formatted)) {
        return
      }
      writer.success(formatted)
    })

    onRun('kubb:hook:start', ({ id, command, name, args }) => {
      if (!id) {
        return
      }
      state.hooks.set(id, { hrStart: process.hrtime(), lines: [] })
      spinner.message(text(`Running ${styleText('dim', formatHookLabel({ command, name, args }))}`))
    })

    onRun('kubb:hook:line', ({ id, line }) => {
      const active = state.hooks.get(id)
      if (!active) {
        return
      }

      // A phase step redraws its own line, so its output waits until the phase ends.
      if (state.phase) {
        active.lines.push(line)
        return
      }
      writer.raw([line])
    })
  }

  return {
    /** The phase whose step owns the line, so a failure or an info line can wait for it. */
    get phase(): Phase | null {
      return state.phase
    },
    reset() {
      state.phase = null
      state.hooks = new Map()
    },
  }
}
