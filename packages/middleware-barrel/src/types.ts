/**
 * Re-export style used when generating barrel `index.ts` files.
 * - `'all'` emits `export * from '...'` for every file.
 * - `'named'` emits `export { name1, name2 } from '...'` from each file's indexable sources.
 * - `'propagate'` behaves like `'all'` and also generates an intermediate barrel for every
 *   sub-directory so consumers can import from any depth.
 */
export type BarrelType = 'all' | 'named' | 'propagate'
