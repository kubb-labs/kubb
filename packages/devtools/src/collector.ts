import type { Hookable, KubbHooks } from '@kubb/core'
import type { DevtoolsStore } from './store.ts'

/**
 * Subscribes a store to a run's lifecycle hooks and returns a function that detaches
 * every listener.
 *
 * The only argument beyond the store is the hook bus, so any host that owns a
 * `Hookable<KubbHooks>` can drive the devtools: the CLI runner today, `unplugin-kubb`
 * later. The canonical AST is the one thing hooks cannot supply, so the host snapshots
 * it through {@link DevtoolsStore.setAst}.
 *
 * @example
 * ```ts
 * const detach = collect({ hooks, store })
 * ```
 */
export function collect({ hooks, store }: { hooks: Hookable<KubbHooks>; store: DevtoolsStore }): () => void {
  return hooks.addHooks({
    'kubb:build:start': ({ config }) => {
      store.startRun(config.name ?? null)
    },

    'kubb:plugin:start': ({ plugin }) => {
      store.startPlugin(plugin.name)
    },

    'kubb:plugin:end': ({ plugin, duration, success, error }) => {
      store.endPlugin({ name: plugin.name, duration, success, error })
    },

    // Fires once per (node x plugin) with that plugin's `override` already applied, so this
    // records what each plugin saw rather than the canonical tree.
    'kubb:generate:schema': (node, ctx) => {
      store.recordSchema({ plugin: ctx.plugin.name, node })
    },

    'kubb:generate:operation': (node, ctx) => {
      store.recordOperation({ plugin: ctx.plugin.name, node })
    },

    'kubb:diagnostic': ({ diagnostic }) => {
      store.addDiagnostic({
        code: diagnostic.code,
        severity: diagnostic.severity,
        message: diagnostic.message,
        plugin: 'plugin' in diagnostic ? (diagnostic.plugin ?? null) : null,
      })
    },

    'kubb:build:end': ({ files }) => {
      store.setFiles(files)
    },

    'kubb:generation:end': ({ status }) => {
      store.endRun(status === 'failed' ? 'failed' : 'success')
    },
  })
}
