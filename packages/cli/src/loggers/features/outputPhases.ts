import process from 'node:process'
import { styleText } from 'node:util'
import { getElapsedMs } from '@internals/utils'
import { type KubbHooks, logLevel as logLevelMap } from '@kubb/core'
import { formatMsWithColor } from '../banner.ts'
import type { LoggerContext } from './context.ts'
import type { Spinner } from './spinner.ts'

/**
 * One output phase while its step owns the line. A phase buffers what it is told, because a spinner
 * redraws over anything written under it, and prints the lot once it knows its own result.
 */
export type Phase = StartPhaseOptions & {
  failed: boolean
  hrStart: [number, number]
  lines: Array<string>
  /**
   * Raw lines a hook printed, drawn outside the group.
   */
  output: Array<string>
}

export type StartPhaseOptions = {
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

// Even when silent, surface a failed hook's captured output. `stdout` and `stderr` only exist on a failed result.
function printFailedOutput(result: KubbHooks['kubb:hook:end'][0]): void {
  if (result.success) {
    return
  }
  if (result.stdout) console.log(result.stdout)
  if (result.stderr) console.error(result.stderr)
}

export type OutputPhasesOptions = { ctx: LoggerContext; spinner: Spinner }

/** The format, lint and post-generate phases, and the hooks and messages they buffer while their step owns the line. */
export class OutputPhases {
  readonly #ctx: LoggerContext
  readonly #spinner: Spinner
  #phase: Phase | null = null
  #hooks = new Map<string, { hrStart: [number, number]; lines: Array<string> }>()

  constructor({ ctx, spinner }: OutputPhasesOptions) {
    this.#ctx = ctx
    this.#spinner = spinner
    const { writer, silent, logLevel, text, line, onRun } = ctx

    onRun('kubb:format:start', () => this.#startPhase(PHASES.format))
    onRun('kubb:format:end', () => this.#endPhase())
    onRun('kubb:lint:start', () => this.#startPhase(PHASES.lint))
    onRun('kubb:lint:end', () => this.#endPhase())
    onRun('kubb:hooks:start', () => this.#startPhase(PHASES.hooks))
    onRun('kubb:hooks:end', () => this.#endPhase())

    onRun('kubb:hook:end', (result) => this.#endHook(result))

    // Not registered at silent: the missing `kubb:hook:line` listener is also what tells the runner not to stream.
    if (silent) {
      return
    }

    onRun('kubb:info', ({ message, info }) => {
      const formatted = line(styleText('blue', 'ℹ'), message, info)

      // Info carries something new (the auto-detected tool), so inside a phase it waits for the phase to print.
      if (this.#phase) {
        this.#phase.lines.push(formatted)
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
      this.#hooks.set(id, { hrStart: process.hrtime(), lines: [] })
      spinner.message(text(`Running ${styleText('dim', formatHookLabel({ command, name, args }))}`))
    })

    onRun('kubb:hook:line', ({ id, line: hookLine }) => {
      const active = this.#hooks.get(id)
      if (!active) {
        return
      }

      // A phase step redraws its own line, so its output waits until the phase ends.
      if (this.#phase) {
        active.lines.push(hookLine)
        return
      }
      writer.raw([hookLine])
    })
  }

  /** The phase whose step owns the line, so a failure or an info line can wait for it. */
  get phase(): Phase | null {
    return this.#phase
  }

  #startPhase(options: StartPhaseOptions): void {
    this.#phase = { ...options, failed: false, hrStart: process.hrtime(), lines: [], output: [] }
    this.#spinner.start(options.running)
  }

  #endPhase(): void {
    const phase = this.#phase
    this.#phase = null

    if (!phase || this.#ctx.silent) {
      return
    }

    const duration = formatMsWithColor(getElapsedMs(phase.hrStart))

    this.#spinner.stop(phase.failed ? `${phase.failure} after ${duration}` : `${phase.success} in ${duration}`, phase.failed ? 'failed' : 'success')

    if (phase.lines.length) {
      this.#ctx.writer.block(phase.lines)
    }
    this.#writeOutput(phase.output)
  }

  #writeOutput(lines: ReadonlyArray<string>): void {
    const output = trimBlankEdges(lines)
    if (output.length) {
      this.#ctx.writer.raw(output)
    }
  }

  #endHook(result: KubbHooks['kubb:hook:end'][0]): void {
    const { id, command, name, args, success, error } = result
    if (!id) {
      return
    }

    if (!success && this.#phase) {
      this.#phase.failed = true
    }

    if (this.#ctx.silent) {
      printFailedOutput(result)
      return
    }

    const active = this.#hooks.get(id)
    if (!active) {
      return
    }
    this.#hooks.delete(id)

    const label = styleText('dim', formatHookLabel({ command, name, args }))
    const outcome = success
      ? `${styleText('green', '✓')} ${label} in ${formatMsWithColor(getElapsedMs(active.hrStart))}`
      : `${styleText('red', '✗')} ${label} failed${error?.message ? ` (${error.message})` : ''}`

    this.#reportHook({ outcome, success, lines: active.lines })
  }

  #reportHook({ outcome, success, lines }: { outcome: string; success: boolean; lines: Array<string> }): void {
    const phase = this.#phase
    if (phase) {
      if (phase.showHookResults || !success) {
        phase.lines.push(outcome)
      }
      phase.output.push(...lines)
      return
    }

    this.#spinner.stop()
    this.#ctx.writer.step(this.#ctx.text(outcome))
    this.#writeOutput(lines)
  }

  reset(): void {
    this.#phase = null
    this.#hooks = new Map()
  }
}

export function createOutputPhases(options: OutputPhasesOptions): OutputPhases {
  return new OutputPhases(options)
}
