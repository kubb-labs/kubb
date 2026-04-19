import type { AsyncEventEmitter, KubbHooks } from '@kubb/core'
import { x } from 'tinyexec'

/**
 * Register a `hook:start` listener on the event emitter that spawns the requested
 * command via tinyexec and emits `hook:end` with the result.
 */
export function setupHookListener(hooks: AsyncEventEmitter<KubbHooks>, root: string): void {
  hooks.on('kubb:hook:start', async ({ id, command, args }) => {
    // Skip hook execution if no id is provided (e.g., during benchmarks or tests)
    if (!id) {
      return
    }

    const commandWithArgs = args?.length ? `${command} ${args.join(' ')}` : command

    try {
      const result = await x(command, [...(args ?? [])], {
        nodeOptions: { cwd: root, detached: true },
        throwOnError: true,
      })

      console.log(result.stdout.trimEnd())

      await hooks.emit('kubb:hook:end', {
        command,
        args,
        id,
        success: true,
        error: null,
      })
    } catch (_err) {
      const errorMessage = new Error(`Hook execute failed: ${commandWithArgs}`)

      await hooks.emit('kubb:hook:end', {
        command,
        args,
        id,
        success: false,
        error: errorMessage,
      })
      await hooks.emit('kubb:error', errorMessage)
    }
  })
}
