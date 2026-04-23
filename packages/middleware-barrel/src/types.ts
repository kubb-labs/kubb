/**
 * The barrel type controls the style of re-exports generated in barrel files.
 *
 * - `'all'`       — `export * from '...'` (re-export everything)
 * - `'named'`     — `export { name1, name2 } from '...'` (named re-exports only)
 * - `'propagate'` — like `'all'` but also generates intermediate barrel files for
 *                   every sub-directory so that consumers can import from any depth.
 */
export type BarrelType = 'all' | 'named' | 'propagate'

declare global {
  namespace Kubb {
    interface PluginOptionsRegistry {
      output: {
        /**
         * Controls which barrel file (index.ts) is generated for this plugin's output directory.
         *
         * - `'all'`       — `export * from '...'` for every generated file.
         * - `'named'`     — `export { … } from '...'` using the file's named exports.
         * - `'propagate'` — like `'all'` but also generates intermediate barrel files.
         * - `false`       — disable barrel generation for this plugin.
         *
         * When omitted, the root `config.output.barrelType` is used as the default.
         */
        barrelType?: BarrelType | false
      }
    }
    interface ConfigOptionsRegistry {
      output: {
        /**
         * Controls the root barrel file (index.ts) generated at `config.output.path`.
         *
         * - `'all'`       — `export * from '...'` for every plugin's barrel.
         * - `'named'`     — `export { … } from '...'` using the barrel's named exports.
         * - `'propagate'` — like `'all'` but also generates intermediate barrel files.
         * - `false`       — disable root barrel generation.
         *
         * Individual plugins can override this via their own `output.barrelType`.
         */
        barrelType?: BarrelType | false
      }
    }
  }
}
