import type { Hookable, KubbHooks } from 'kubb/kit'
import { x } from 'tinyexec'

/**
 * Event bus shared with `createKubb`. Core emits its lifecycle events here, and the runtime overlays
 * the synthetic `kubb:hook:line` event it produces while streaming output from spawned hook commands
 * (formatter, linter, user `done` hooks). Core itself does not emit this event.
 */
export type AgentHooks = KubbHooks & {
  'kubb:hook:line': [ctx: { id?: string; line: string }]
}

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

/**
 * Waits for the `kubb:hook:end` matching `hookId`. Register this before calling `kubb:hook:start`:
 * `callHook` awaits its listeners, and {@link setupHookListener} calls `kubb:hook:end` from inside
 * that same listener, so a handler added afterward would already have missed it.
 */
export function waitForHookEnd(hooks: Hookable<AgentHooks>, hookId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const handleHookEnd = (ctx: { id?: string; success: boolean; error?: Error | null }) => {
      if (ctx.id !== hookId) return
      hooks.removeHook('kubb:hook:end', handleHookEnd)

      if (ctx.success) {
        resolve()
      } else {
        reject(ctx.error)
      }
    }

    hooks.hook('kubb:hook:end', handleHookEnd)
  })
}
