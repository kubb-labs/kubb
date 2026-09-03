import type { Hookable, KubbHooks } from '@kubb/core'
import { x } from 'tinyexec'

/**
 * Events about this runtime's Kubb Studio session, as opposed to a generation. A host subscribes to
 * these to narrate the connection without also subscribing to a build, which is what keeps the
 * generation loggers reusable as they are.
 */
export type StudioHooks = {
  'studio:connected': [ctx: StudioConnectedContext]
  'studio:disconnected': [ctx: StudioDisconnectedContext]
  'studio:command:start': [ctx: StudioCommandStartContext]
  'studio:command:end': [ctx: StudioCommandEndContext]
  'studio:warn': [ctx: StudioWarnContext]
  'studio:error': [ctx: StudioErrorContext]
}

/**
 * Readable identifier Studio issued for this connection, carried by every session event. A host
 * with a single session leaves it out of its output; one serving a pool shows it to tell them apart.
 */
type StudioSessionContext = {
  tag: string
}

export type StudioConnectedContext = StudioSessionContext & {
  /**
   * The Studio instance this session attached to.
   */
  studioUrl: string
}

export type StudioDisconnectedContext = StudioSessionContext & {
  /**
   * Why Studio ended the session.
   */
  reason: string
}

export type StudioCommandStartContext = StudioSessionContext & {
  /**
   * The command Studio sent, without its `studio:` prefix — `generate`, `connect` or `save`.
   */
  command: string
}

export type StudioCommandEndContext = StudioSessionContext & {
  /**
   * The command that finished, without its `studio:` prefix.
   */
  command: string
  /**
   * What the command did, when there is something worth reporting, such as
   * `applied 2/3 edits to kubb.config.ts`.
   */
  info?: string
}

export type StudioWarnContext = StudioSessionContext & {
  /**
   * What was refused or ignored, and what would change it.
   */
  message: string
}

export type StudioErrorContext = StudioSessionContext & {
  /**
   * The failure. Local to the host: a failure Studio needs to hear about is sent over the socket
   * instead, through the `kubb:error` generation hook.
   */
  error: Error
}

/**
 * Event bus shared with `createKubb`. Core emits its generation lifecycle events here (including
 * `kubb:hook:line`, which the runtime fires while streaming output from spawned hook commands), and
 * the session events above ride alongside them.
 */
export type AgentHooks = KubbHooks & StudioHooks

/**
 * Register a `kubb:hook:start` listener that spawns the requested command via tinyexec,
 * streams each stdout line as a `kubb:hook:line` event, and calls `kubb:hook:end` with the result.
 * Streaming the output lets Kubb Studio render live hook progress over the WebSocket connection.
 */
export function setupHookListener(hooks: Hookable<AgentHooks>, root: string): void {
  hooks.hook('kubb:hook:start', async (ctx) => {
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
