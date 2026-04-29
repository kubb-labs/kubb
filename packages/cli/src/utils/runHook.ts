import type { AsyncEventEmitter } from '@internals/utils'
import { toError } from '@internals/utils'
import type { KubbHooks } from '@kubb/core'
import { NonZeroExitError, x } from 'tinyexec'

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
  context: AsyncEventEmitter<KubbHooks>
  /** When true the process output is streamed line-by-line via onLine. */
  stream?: boolean
  sink?: HookOutputSink
}

/**
 * Executes a hook command, emits debug and completion events, and forwards output to an optional sink.
 */
export async function runHook({ id, command, args, commandWithArgs, context, stream = false, sink }: RunHookOptions): Promise<void> {
  try {
    const proc = x(command, [...(args ?? [])], {
      nodeOptions: { detached: process.platform !== 'win32' },
      throwOnError: true,
    })

    if (stream && sink?.onLine) {
      for await (const line of proc) {
        sink.onLine(line)
      }
    }

    const result = await proc

    await context.emit('kubb:debug', {
      date: new Date(),
      logs: [result.stdout.trimEnd()],
    })

    await context.emit('kubb:hook:end', {
      command,
      args,
      id,
      success: true,
      error: null,
    })
  } catch (err) {
    if (!(err instanceof NonZeroExitError)) {
      await context.emit('kubb:hook:end', {
        command,
        args,
        id,
        success: false,
        error: toError(err),
      })
      await context.emit('kubb:error', { error: toError(err) })
      return
    }

    const stderr = err.output?.stderr ?? ''
    const stdout = err.output?.stdout ?? ''

    await context.emit('kubb:debug', {
      date: new Date(),
      logs: [stdout, stderr].filter(Boolean),
    })

    if (stderr) sink?.onStderr?.(stderr)
    if (stdout) sink?.onStdout?.(stdout)

    const errorMessage = new Error(`Hook execute failed: ${commandWithArgs}`)

    await context.emit('kubb:hook:end', {
      command,
      args,
      id,
      success: false,
      error: errorMessage,
    })
    await context.emit('kubb:error', { error: errorMessage })
  }
}
