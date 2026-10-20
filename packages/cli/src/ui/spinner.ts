import type { WriterSpinner } from '../loggers/defineLogger.ts'
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
 * Awaits `promise`, showing a spinner with `message` only when it takes longer than 150 ms.
 */
export async function withSpinner<T>({ promise, message }: { promise: Promise<T>; message: string }): Promise<T> {
  let spinner: WriterSpinner | undefined
  const timer = setTimeout(() => {
    spinner = createSpinner()
    spinner.start(message)
  }, SPINNER_DELAY_MS)
  try {
    return await promise
  } finally {
    clearTimeout(timer)
    spinner?.clear()
  }
}
