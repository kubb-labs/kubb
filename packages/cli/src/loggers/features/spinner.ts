import type { LogStatus, WriterSpinner } from '../types.ts'
import type { LoggerContext } from './context.ts'

/**
 * The step whose end is not known when it starts: the spec parse, the node walk, a phase, or a Studio session waiting for jobs.
 */
export class Spinner {
  readonly #ctx: LoggerContext
  #spinner: WriterSpinner | null = null

  constructor(ctx: LoggerContext) {
    this.#ctx = ctx
  }

  /**
   * Whether a spinner is drawing right now.
   */
  get active(): boolean {
    return this.#spinner !== null
  }

  start(message: string): void {
    const { silent, writer, text } = this.#ctx
    if (silent) {
      return
    }

    this.#spinner = writer.spinner()
    this.#spinner.start(text(message))
  }

  stop(message?: string, status: LogStatus = 'success'): void {
    const active = this.#spinner
    if (!active) {
      return
    }
    this.#spinner = null

    if (message === undefined) {
      active.clear()
      return
    }
    if (status === 'failed') {
      active.error(this.#ctx.text(message))
      return
    }
    active.stop(this.#ctx.text(message))
  }

  /**
   * Redraws the spinner's line. `false` when no spinner is running, so the caller prints the line itself.
   */
  message(line: string): boolean {
    if (!this.#spinner) {
      return false
    }
    this.#spinner.message(line)
    return true
  }

  reset(): void {
    this.stop()
  }
}

export function createSpinner(ctx: LoggerContext): Spinner {
  return new Spinner(ctx)
}
