/**
 * Barrel export strategy.
 *
 * - `'all'` generates `export * from '...'` for every file
 * - `'named'` generates `export { name1, name2 } from '...'` using each file's named exports
 */
export type BarrelType = 'all' | 'named'

/**
 * Barrel configuration at the plugin level.
 * Supports nested barrel generation in subdirectories.
 *
 * @example
 * ```ts
 * barrel: { type: 'named' }  // single barrel with named exports
 * barrel: { type: 'all', nested: true }  // hierarchical barrels with wildcard exports
 * barrel: { type: 'named', nested: true }  // hierarchical barrels with named exports
 * barrel: false  // no barrel generated (default)
 * ```
 */
export type PluginBarrelConfig = {
  /**
   * Export strategy for the plugin's barrel files.
   * - `'all'` wildcard exports: `export * from './file'`
   * - `'named'` explicit exports: `export { x, y } from './file'`
   */
  type: BarrelType
  /**
   * Generate an `index.ts` in every sub-directory, each re-exporting only what's directly inside it.
   * Creates a hierarchical barrel structure instead of flat exports from the root.
   */
  nested?: boolean
}

/**
 * Barrel configuration at the root config level: the export strategy only, since the root barrel is never nested.
 */
export type BarrelConfig = Pick<PluginBarrelConfig, 'type'>

declare global {
  namespace Kubb {
    interface PluginOptionsRegistry {
      output: {
        /**
         * Barrel configuration for this plugin's output.
         * Set to `{ type: 'named' | 'all' }` to opt this plugin into a barrel. Set to `false`
         * (the default) to disable barrel generation for this plugin entirely, which also
         * excludes the plugin's files from the root barrel.
         *
         * Falls back to `config.output.barrel` when omitted.
         *
         * @default false
         */
        barrel?: PluginBarrelConfig | false
      }
    }
    interface ConfigOptionsRegistry {
      output: {
        /**
         * Barrel configuration for the root barrel file at `config.output.path/index.ts`.
         * Set to `{ type: 'named' | 'all' }` to opt into a root barrel. Individual plugins can
         * override this via their own `output.barrel`.
         *
         * @default false
         */
        barrel?: BarrelConfig | false
      }
    }
  }
}
