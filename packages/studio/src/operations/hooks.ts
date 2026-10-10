import type { Hookable, KubbHooks } from '@kubb/core'
import { x } from 'tinyexec'
import type { AgentPermissions } from '../protocol/index.ts'

export type StudioConnectedContext = {
  /**
   * The Studio instance this session attached to.
   */
  url: string
  /**
   * Both sides of the connection, so a host can print them and make a mismatch visible.
   */
  versions: {
    /**
     * The Studio instance's own version, when it sent one.
     */
    studio?: string
    /**
     * The version of the runtime that connected.
     */
    kubb: string
    /**
     * The version of the host itself, such as the `kubb` CLI or the agent image.
     */
    agent: string
  }
  /**
   * This agent's slug, refreshed on every connect so a rename in Studio shows up without a
   * re-pair. Absent when Studio predates the field.
   */
  agentSlug?: string
  /**
   * This agent's organization slug, absent for a sandbox or global agent, which has none, or when
   * Studio predates the field.
   */
  organizationSlug?: string
}

/**
 * Events a host emits about its Kubb Studio session, as opposed to a generation. `kubb:` stays
 * reserved for generation lifecycle.
 */
declare global {
  namespace Kubb {
    interface KubbHooksRegistry {
      /**
       * The Studio instance this session is opening against.
       */
      'studio:connecting': [ctx: { url: string }]
      'studio:connected': [ctx: StudioConnectedContext]
      /**
       * Fired once Studio confirms the `agent:connect` handshake was received and the session is
       * fully registered. Distinct from `studio:connected`, which only means the socket is open.
       */
      'studio:ready': [ctx: Record<string, never>]
      /**
       * Why Studio ended the session.
       */
      'studio:disconnected': [ctx: { reason: string }]
      /**
       * Milliseconds until the next connection attempt.
       */
      'studio:reconnecting': [ctx: { delayMs: number }]
      /**
       * The command Studio sent, without its `studio:` prefix: `generate`, `connect` or `save`.
       */
      'studio:command:start': [ctx: { command: string }]
      /**
       * The command that finished, with what it did when there is something to report:
       * `applied 2/3 edits to kubb.config.ts`.
       */
      'studio:command:end': [ctx: { command: string; info?: string }]
      /**
       * What was refused or ignored, and the missing permission if that is why, so the host can
       * append its own remedy.
       */
      'studio:warn': [ctx: { message: string; permission?: keyof AgentPermissions }]
      /**
       * The failure, for the host's own output. One Studio needs to hear about goes over the
       * socket through the `kubb:error` generation hook instead.
       */
      'studio:error': [ctx: { error: Error }]
    }
  }
}

/**
 * Register a `kubb:hook:start` listener that spawns the requested command via tinyexec,
 * streams each stdout line as a `kubb:hook:line` event, and calls `kubb:hook:end` with the result.
 * A failure travels on `kubb:hook:end` only: the caller waiting on it reports `kubb:error` once.
 * Streaming the output lets Kubb Studio render live hook progress over the WebSocket connection.
 *
 * Returns a remover, so a session that runs one generation after another on the same emitter does
 * not stack a listener per run.
 */
export function setupHookListener(hooks: Hookable<KubbHooks>, root: string, signal?: AbortSignal): () => void {
  return hooks.hook('kubb:hook:start', async (ctx) => {
    const { id, command, args } = ctx
    // No id means nothing is waiting on the result (benchmarks, tests).
    if (!id) {
      return
    }

    const commandWithArgs = args?.length ? `${command} ${args.join(' ')}` : command

    try {
      const proc = x(command, [...(args ?? [])], {
        signal,
        nodeOptions: { cwd: root, detached: true },
      })

      for await (const line of proc) {
        await hooks.callHook('kubb:hook:line', { id, line })
      }

      const { exitCode } = await proc

      if (exitCode !== 0) {
        const error = new Error(`Hook execute failed: ${commandWithArgs}`)

        await hooks.callHook('kubb:hook:end', { id, command, args, success: false, error })

        return
      }

      await hooks.callHook('kubb:hook:end', { id, command, args, success: true, error: null })
    } catch (caughtError) {
      const error = new Error(`Hook execute failed: ${commandWithArgs}`)
      error.cause = caughtError

      await hooks.callHook('kubb:hook:end', { id, command, args, success: false, error })
    }
  })
}

/**
 * Waits for the `kubb:hook:end` matching `hookId`. Register this before calling `kubb:hook:start`:
 * `callHook` awaits its listeners, and {@link setupHookListener} calls `kubb:hook:end` from inside
 * that same listener, so a handler added afterward would already have missed it.
 */
export function waitForHookEnd(hooks: Hookable<KubbHooks>, hookId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const handleHookEnd = (ctx: { id?: string; success: boolean; error?: Error | null }) => {
      if (ctx.id !== hookId) return
      hooks.removeHook('kubb:hook:end', handleHookEnd)

      if (ctx.success) {
        resolve()
        return
      }
      reject(ctx.error)
    }

    hooks.hook('kubb:hook:end', handleHookEnd)
  })
}
