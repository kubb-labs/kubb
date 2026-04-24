/**
 * The barrel type controls the style of re-exports generated in barrel files.
 *
 * - `'all'`       — `export * from '...'` (re-export everything)
 * - `'named'`     — `export { name1, name2 } from '...'` (named re-exports only)
 * - `'propagate'` — like `'all'` but also generates intermediate barrel files for
 *                   every sub-directory so that consumers can import from any depth.
 */
export type BarrelType = 'all' | 'named' | 'propagate'

