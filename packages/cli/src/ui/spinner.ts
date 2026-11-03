import { styleText } from 'node:util'
import type { WriterSpinner } from '../loggers/types.ts'
import { writer } from './log.ts'

/**
 * A progress spinner, or a writer that prints each message it is given when the terminal cannot
 * animate one. Callers drive both the same way, including the failure state.
 */
export function createSpinner(): WriterSpinner {
  return writer().spinner()
}

/** How long a wait may run before a spinner shows, so a fast answer draws nothing. */
const SPINNER_DELAY_MS = 150

/**
 * Awaits `promise`, or a plain value a dry run returns, behind a spinner with `message`. A bare wait shows the spinner only when it
 * takes longer than 150 ms and clears it. A step, one with `done`, shows it at once and ends with
 * the `done` line, or `failed` when the promise rejects; `plain` prints the `done` line instead of
 * animating, for `--yes` runs.
 */
export async function withSpinner<T>({
  promise,
  message,
  done,
  failed,
  plain = false,
}: {
  promise: Promise<T> | T
  message: string
  done?: (result: T) => string
  failed?: string
  plain?: boolean
}): Promise<T> {
  if (plain) {
    const result = await promise
    if (done) console.log(`${styleText('green', '✓')} ${done(result)}`)
    return result
  }
  let spinner: WriterSpinner | undefined
  const start = () => {
    spinner = createSpinner()
    spinner.start(message)
  }
  if (done) start()
  const timer = done ? undefined : setTimeout(start, SPINNER_DELAY_MS)
  try {
    const result = await promise
    if (done) spinner?.stop(done(result))
    if (!done) spinner?.clear()
    return result
  } catch (error) {
    if (failed) spinner?.error(failed)
    if (!failed) spinner?.clear()
    throw error
  } finally {
    clearTimeout(timer)
  }
}
