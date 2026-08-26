import type { Hookable, KubbHooks } from '@kubb/core'
import { createDevServer } from 'devframe/adapters/dev'
import { collect } from './collector.ts'
import { createKubbDevframe } from './devframe.ts'
import { createStore, type DevtoolsStore } from './store.ts'

export type DevtoolsServer = {
  /**
   * Where the UI is listening, for example `http://localhost:9999`.
   */
  origin: string
  /**
   * The store the collector fills. The host also pushes the canonical AST into it,
   * which no lifecycle hook exposes.
   */
  store: DevtoolsStore
  close: () => Promise<void>
}

/**
 * Starts the devtools server and wires it to a run's hook bus.
 *
 * The returned server outlives individual builds on purpose: under `--watch` the store
 * is reset per build while the process, the socket, and any connected browser stay up.
 *
 * @example
 * ```ts
 * const devtools = await startDevtools({ hooks })
 * console.log(devtools.origin)
 * ```
 */
export async function startDevtools({ hooks, port }: { hooks: Hookable<KubbHooks>; port?: number }): Promise<DevtoolsServer> {
  const store = createStore()
  collect({ hooks, store })

  const server = await createDevServer(createKubbDevframe({ store }), { port })

  return {
    origin: server.origin,
    store,
    close: () => server.close(),
  }
}
