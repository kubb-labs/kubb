import { fileURLToPath } from 'node:url'
import { defineDevframe, type DevframeDefinition } from 'devframe'
import { registerRpcFunctions } from './rpc.ts'
import type { DevtoolsStore, RunSummary } from './store.ts'

/**
 * Shared-state key holding the live {@link RunSummary}. The pipeline panel reads it
 * rather than polling, so a reconnecting client picks the run back up mid-build.
 */
export const RUN_STATE_KEY = 'run'

const clientAssets = fileURLToPath(new URL('../client/dist', import.meta.url))

/**
 * Builds the Kubb devframe over a store the host owns.
 *
 * The store is passed in rather than created here because the host also feeds it the
 * canonical AST, which no lifecycle hook exposes.
 *
 * @example
 * ```ts
 * const store = createStore()
 * const devframe = createKubbDevframe({ store })
 * ```
 */
export function createKubbDevframe({ store }: { store: DevtoolsStore }): DevframeDefinition {
  return defineDevframe({
    id: 'kubb',
    name: 'Kubb DevTools',
    version: '0.0.0',
    packageName: '@kubb/devtools',
    importMetaUrl: import.meta.url,
    homepage: 'https://kubb.dev',
    description: 'Inspect the parsed AST, the per-plugin pipeline, and the generated files of a Kubb run.',
    icon: 'ph:tree-structure-duotone',
    clientAssets,
    // A devtool that only reports on a live build has nothing to export statically.
    capabilities: { build: false },
    async setup(ctx) {
      const kubb = ctx.scope('kubb')

      registerRpcFunctions({ scope: kubb, store })

      const runState = await kubb.rpc.sharedState<RunSummary>(RUN_STATE_KEY, {
        initialValue: store.getSummary(),
      })

      // Clone before handing the summary over: shared state is immer-backed and freezes
      // whatever it takes ownership of, which would make the store's own arrays
      // non-extensible and break the next push into them.
      store.onChange(() => {
        const summary = structuredClone(store.getSummary())
        runState.mutate((state) => {
          Object.assign(state, summary)
        })
      })
    },
  })
}
