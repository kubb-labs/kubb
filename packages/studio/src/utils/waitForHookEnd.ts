import type { KubbHookEndContext } from '@kubb/core'
import type { Hookable } from 'kubb/kit'

/**
 * Waits for the `kubb:hook:end` matching `hookId`. Register this before calling
 * `kubb:hook:start` — `callHook` awaits its listeners, and `setupHookListener.ts` calls
 * `kubb:hook:end` from inside that same listener, so a handler added afterward would
 * already have missed it.
 */
export function waitForHookEnd<TEvents extends { [K in keyof TEvents]: Array<unknown> } & { 'kubb:hook:end': [ctx: KubbHookEndContext] }>(
  hooks: Hookable<TEvents>,
  hookId: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const handleHookEnd = (ctx: KubbHookEndContext) => {
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
