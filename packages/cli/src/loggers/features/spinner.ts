import type { LogStatus, WriterSpinner } from '../types.ts'
import type { LoggerContext } from './context.ts'

export type Spinner = ReturnType<typeof createSpinner>

/** The step whose end is not known when it starts: the spec parse, the node walk, a phase, or a Studio session waiting for jobs. */
export function createSpinner({ writer, silent, text }: LoggerContext) {
  let spinner: WriterSpinner | null = null

  function stop(message?: string, status: LogStatus = 'success') {
    const active = spinner
    if (!active) {
      return
    }
    spinner = null

    if (message === undefined) {
      active.clear()
      return
    }
    if (status === 'failed') {
      active.error(text(message))
      return
    }
    active.stop(text(message))
  }

  return {
    /** Whether a spinner is drawing right now. */
    get active(): boolean {
      return spinner !== null
    },
    start(message: string) {
      if (silent) {
        return
      }

      spinner = writer.spinner()
      spinner.start(text(message))
    },
    stop,
    /** Redraws the spinner's line. `false` when no spinner is running, so the caller prints the line itself. */
    message(line: string): boolean {
      if (!spinner) {
        return false
      }
      spinner.message(line)
      return true
    },
    reset: () => stop(),
  }
}
