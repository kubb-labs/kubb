/**
 * Barrel re-export style for generated `index.ts` files.
 *
 * - `'all'` — generates `export * from '...'` for every file
 * - `'named'` — generates `export { name1, name2 } from '...'` using each file's named exports
 * - `'propagate'` — generates an `index.ts` in every sub-directory, each re-exporting only what's directly inside it
 */
export type BarrelType = 'all' | 'named' | 'propagate'

/**
 * Barrel re-export style for the root barrel at `config.output.path/index.ts`.
 * `'propagate'` is only available at the per-plugin level.
 */
export type RootBarrelType = Exclude<BarrelType, 'propagate'>
