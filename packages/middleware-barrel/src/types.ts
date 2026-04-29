/**
 * Barrel re-export style for generated `index.ts` files.
 *
 * - `'all'` — generates `export * from '...'` for every file
 * - `'named'` — generates `export { name1, name2 } from '...'` using each file's named exports
 * - `'propagate'` — generates intermediate barrel files for every sub-directory so consumers can import from any depth
 */
export type BarrelType = 'all' | 'named' | 'propagate'

/**
 * Barrel re-export style for the root barrel at `config.output.path/index.ts`.
 * `'propagate'` is only available at the per-plugin level.
 */
export type RootBarrelType = Exclude<BarrelType, 'propagate'>
