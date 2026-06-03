import process from 'node:process'
import { styleText } from 'node:util'
import { getElapsedMs } from '@internals/utils'
import { logLevel as logLevelMap } from '@kubb/core'

/**
 * Output sink for a hook subprocess, controlling how streamed lines and exit output are forwarded.
 */
type HookOutputSink = {
  /**
   * Called for each streamed stdout line while the hook runs.
   */
  onLine?: (line: string) => void
  /**
   * Called with stderr content after the hook exits with a non-zero code.
   */
  onStderr?: (text: string) => void
  /**
   * Called with stdout content after the hook exits with a non-zero code.
   */
  onStdout?: (text: string) => void
}

/**
 * Output sink combined with stream control for a hook subprocess.
 */
export type HookSinkOptions = HookOutputSink & {
  /**
   * When `true`, streams process output line-by-line via `onLine`.
   *
   * @default false
   */
  stream?: boolean
}

/**
 * Factory called once per hook command to build the output sink and streaming flag.
 * The function should set up any logger UI and return callbacks that forward subprocess output to it.
 *
 * `hookId` is the same id passed to `kubb:hook:start` / `kubb:hook:end`, letting the logger
 * correlate streamed output with any active UI element it created in the start handler.
 */
export type HookSinkFactory = (commandWithArgs: string, hookId: string) => HookSinkOptions | null

/**
 * Optionally prefix a message with a [HH:MM:SS] timestamp when logLevel >= verbose.
 */
export function formatMessage(message: string, logLevel: number): string {
  if (logLevel >= logLevelMap.verbose) {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    return `${styleText('dim', `[${timestamp}]`)} ${message}`
  }
  return message
}

/**
 * Tracks per-hook start times so a logger can report a hook's elapsed duration.
 */
export type HookTimer = {
  start(id: string): void
  /**
   * Returns the elapsed milliseconds since `start(id)`, or `undefined` when no start was recorded.
   */
  end(id: string): number | undefined
  clear(): void
}

/**
 * Creates a {@link HookTimer} backed by a private `id → hrtime` map.
 */
export function createHookTimer(): HookTimer {
  const starts = new Map<string, [number, number]>()

  return {
    start(id: string): void {
      starts.set(id, process.hrtime())
    },
    end(id: string): number | undefined {
      const hrStart = starts.get(id)
      if (!hrStart) return undefined
      starts.delete(id)
      return getElapsedMs(hrStart)
    },
    clear(): void {
      starts.clear()
    },
  }
}

/**
 * Join a command and its optional args into a single display string.
 * e.g. ("prettier", ["--write", "."]) → "prettier --write ."
 */
export function formatCommandWithArgs(command: string, args?: ReadonlyArray<string>): string {
  return args?.length ? `${command} ${args.join(' ')}` : command
}
