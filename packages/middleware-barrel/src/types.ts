/**
 * Barrel export strategy.
 *
 * - `'all'` — generates `export * from '...'` for every file
 * - `'named'` — generates `export { name1, name2 } from '...'` using each file's named exports
 */
export type BarrelType = 'all' | 'named'

/**
 * Barrel configuration at the root config level.
 *
 * @example
 * ```ts
 * barrel: { type: 'named' }  // default
 * barrel: { type: 'all' }
 * barrel: false  // disable barrel generation
 * ```
 */
export type BarrelConfig = {
  /**
   * Export strategy for the root barrel file.
   * - `'all'` — wildcard exports: `export * from './file'`
   * - `'named'` — explicit exports: `export { x, y } from './file'`
   */
  type: BarrelType
}

/**
 * Barrel configuration at the plugin level.
 * Supports nested barrel generation in subdirectories.
 *
 * @example
 * ```ts
 * barrel: { type: 'named' }  // single barrel with named exports
 * barrel: { type: 'all', nested: true }  // hierarchical barrels with wildcard exports
 * barrel: { type: 'named', nested: true }  // hierarchical barrels with named exports
 * barrel: false  // disable barrel generation
 * ```
 */
export type PluginBarrelConfig = {
  /**
   * Export strategy for the plugin's barrel files.
   * - `'all'` — wildcard exports: `export * from './file'`
   * - `'named'` — explicit exports: `export { x, y } from './file'`
   */
  type: BarrelType
  /**
   * Generate an `index.ts` in every sub-directory, each re-exporting only what's directly inside it.
   * Creates a hierarchical barrel structure instead of flat exports from the root.
   *
   * @default false
   */
  nested?: boolean
}
