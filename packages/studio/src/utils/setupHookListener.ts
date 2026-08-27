import type { Hookable } from 'kubb/kit'
import { x } from 'tinyexec'
import type { AgentHooks } from '../types.ts'

/**
 * Register a `kubb:hook:start` listener that spawns the requested command via tinyexec,
 * streams each stdout line as a `kubb:hook:line` event, and calls `kubb:hook:end` with the result.
 * Streaming the output lets Kubb Studio render live hook progress over the WebSocket connection.
 */
export function setupHookListener(hooks: Hookable<AgentHooks>, root: string): void {
  hooks.hook('kubb:hook:start', async (ctx) => {
    const { id, command, args } = ctx
    // Skip hook execution if no id is provided (e.g., during benchmarks or tests)
    if (!id) {
      return
    }

    const commandWithArgs = args?.length ? `${command} ${args.join(' ')}` : command

    try {
      const proc = x(command, [...(args ?? [])], {
        nodeOptions: { cwd: root, detached: true },
      })

      for await (const line of proc) {
        await hooks.callHook('kubb:hook:line', { id, line })
      }

      const { exitCode } = await proc

      if (exitCode !== 0) {
        const error = new Error(`Hook execute failed: ${commandWithArgs}`)

        await hooks.callHook('kubb:hook:end', { id, command, args, success: false, error })
        await hooks.callHook('kubb:error', { error })

        return
      }

      await hooks.callHook('kubb:hook:end', { id, command, args, success: true, error: null })
    } catch (caughtError) {
      const error = new Error(`Hook execute failed: ${commandWithArgs}`)
      error.cause = caughtError

      await hooks.callHook('kubb:hook:end', { id, command, args, success: false, error })
      await hooks.callHook('kubb:error', { error })
    }
  })
}
