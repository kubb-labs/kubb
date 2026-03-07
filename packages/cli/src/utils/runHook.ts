import type { KubbEvents } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import { NonZeroExitError, x } from 'tinyexec'
import { toError } from './errors.ts'

type HookOutputSink = {
  /** Called for each streamed stdout line while the hook runs (optional). */
  onLine?: (line: string) => void
  /** Called on stderr after failure (optional). */
  onStderr?: (text: string) => void
  /** Called on stdout after failure (optional). */
  onStdout?: (text: string) => void
}

type RunHookOptions = {
  id: string
  command: string
  args?: readonly string[]
  commandWithArgs: string
  context: AsyncEventEmitter<KubbEvents>
  /** When true the process output is streamed line-by-line via onLine. */
  stream?: boolean
  sink?: HookOutputSink
}

/**
 * Execute a hook command, emit debug/hook:end events, and forward output to
 * an optional HookOutputSink.  All three logger adapters share this function
 * so the process-spawning logic lives in exactly one place.
 */
export async function runHook({ id, command, args, commandWithArgs, context, stream = false, sink }: RunHookOptions): Promise<void> {
  try {
    const proc = x(command, [...(args ?? [])], {
      nodeOptions: { detached: true },
      throwOnError: true,
    })

    if (stream && sink?.onLine) {
      for await (const line of proc) {
        sink.onLine(line)
      }
    }

    const result = await proc

    await context.emit('debug', {
      date: new Date(),
      logs: [result.stdout.trimEnd()],
    })

    await context.emit('hook:end', { command, args, id, success: true, error: null })
  } catch (err) {
    if (!(err instanceof NonZeroExitError)) {
      await context.emit('hook:end', { command, args, id, success: false, error: toError(err) })
      await context.emit('error', toError(err))
      return
    }

    const stderr = err.output?.stderr ?? ''
    const stdout = err.output?.stdout ?? ''

    await context.emit('debug', {
      date: new Date(),
      logs: [stdout, stderr].filter(Boolean),
    })

    if (stderr) sink?.onStderr?.(stderr)
    if (stdout) sink?.onStdout?.(stdout)

    const errorMessage = new Error(`Hook execute failed: ${commandWithArgs}`)

    await context.emit('hook:end', { command, args, id, success: false, error: errorMessage })
    await context.emit('error', errorMessage)
  }
}
