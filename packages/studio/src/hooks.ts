import type { Hookable, KubbHooks } from '@kubb/core'
import { x } from 'tinyexec'

/**
 * Events a host emits about its Kubb Studio session, as opposed to a generation. `kubb:` stays
 * reserved for generation lifecycle.
 */
export type StudioConnectingContext = {
  /**
   * The Studio instance this session is opening against.
   */
  url: string
}

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
}

export type StudioDisconnectedContext = {
  /**
   * Why Studio ended the session.
   */
  reason: string
}

export type StudioCommandStartContext = {
  /**
   * The command Studio sent, without its `studio:` prefix: `generate`, `connect` or `save`.
   */
  command: string
}

export type StudioCommandEndContext = {
  /**
   * The command that finished, without its `studio:` prefix.
   */
  command: string
  /**
   * What the command did, when there is something to report: `applied 2/3 edits to kubb.config.ts`.
   */
  info?: string
}

export type StudioWarnContext = {
  /**
   * What was refused or ignored, and what would change it.
   */
  message: string
}

export type StudioErrorContext = {
  /**
   * The failure, for the host's own output. One Studio needs to hear about goes over the socket
   * through the `kubb:error` generation hook instead.
   */
  error: Error
}

declare global {
  namespace Kubb {
    interface KubbHooksRegistry {
      'studio:connecting': [ctx: StudioConnectingContext]
      'studio:connected': [ctx: StudioConnectedContext]
      'studio:disconnected': [ctx: StudioDisconnectedContext]
      'studio:command:start': [ctx: StudioCommandStartContext]
      'studio:command:end': [ctx: StudioCommandEndContext]
      'studio:warn': [ctx: StudioWarnContext]
      'studio:error': [ctx: StudioErrorContext]
    }
  }
}

/**
 * Register a `kubb:hook:start` listener that spawns the requested command via tinyexec,
 * streams each stdout line as a `kubb:hook:line` event, and calls `kubb:hook:end` with the result.
 * Streaming the output lets Kubb Studio render live hook progress over the WebSocket connection.
 *
 * Returns a remover, so a session that runs one generation after another on the same emitter does
 * not stack a listener per run.
 */
export function setupHookListener(hooks: Hookable<KubbHooks>, root: string): () => void {
  return hooks.hook('kubb:hook:start', async (ctx) => {
    const { id, command, args } = ctx
    // No id means nothing is waiting on the result (benchmarks, tests).
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
export function waitForHookEnd(hooks: Hookable<KubbHooks>, hookId: string): Promise<void> {
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
