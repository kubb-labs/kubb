/**
 * Re-export style used when generating barrel `index.ts` files.
 * - `'all'` emits `export * from '...'` for every file.
 * - `'named'` emits `export { name1, name2 } from '...'` from each file's indexable sources.
 * - `'propagate'` emits a barrel in every directory, with each barrel pointing only to its
 *   immediate children (files and sub-directory barrels), chaining the hierarchy.
 */
export type BarrelType = 'all' | 'named' | 'propagate'

/**
 * Re-export style for the root barrel at `config.output.path/index.ts`.
 * `'propagate'` is intentionally excluded here — it only makes sense at the per-plugin level.
 */
export type RootBarrelType = Exclude<BarrelType, 'propagate'>
