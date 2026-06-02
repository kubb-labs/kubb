import { type AsyncEventEmitter, formatMs, getElapsedMs } from '@internals/utils'
import type { KubbHooks } from './createKubb.ts'
import { formatWithOptions } from 'node:util'

/**
 * A namespaced debug function. Accepts a `printf`-style template plus args,
 * formatted lazily and emitted on the `kubb:debug` event.
 */
export type Debugger = (template: string, ...args: Array<unknown>) => void

type CreateDebuggerOptions = {
  /**
   * The build's hook bus the debug entries are emitted on.
   */
  hooks: AsyncEventEmitter<KubbHooks>
}

/**
 * Creates a namespaced debug logger. Replaces hand-built `logs: string[]` arrays:
 * pass a `printf`-style template and args and the formatter (Node's `util`)
 * renders objects via `%o`/`%O`.
 *
 * It is lazy — when nothing is listening on `kubb:debug` (the default, below the
 * `--debug` level), the call formats nothing and emits nothing. Each call also
 * records the `+Nms` delta since the previous call for that namespace, and the
 * namespace labels the entry in the `.kubb/*.log` file.
 *
 * @example
 * ```ts
 * const debug = createDebugger('kubb:core', { hooks: this.hooks })
 * debug('configuration %O', { name: config.name, plugins: config.plugins?.length })
 * ```
 */
export function createDebugger(namespace: string, { hooks }: CreateDebuggerOptions): Debugger {
  let last: [number, number] | undefined

  return (template, ...args) => {
    if (hooks.listenerCount('kubb:debug') === 0) {
      return
    }

    const diff = last ? getElapsedMs(last) : undefined
    last = process.hrtime()

    const logs = formatWithOptions({ colors: false, depth: 4 }, template, ...args).split('\n')
    if (diff !== undefined && logs.length > 0) {
      logs[logs.length - 1] += ` +${formatMs(diff)}`
    }

    // Debug logging must never crash the build, so swallow listener rejections.
    const result = hooks.emit('kubb:debug', { date: new Date(), namespace, logs })
    if (result) {
      result.catch(() => {})
    }
  }
}
