import type { Barrel, BarrelType } from '../types.ts'

type BarrelOutput = {
  barrel?: Barrel | false
  barrelType?: BarrelType | false
}

/**
 * Resolve the effective barrel strategy from an output config.
 *
 * Prefers the object `barrel` option and falls back to the legacy `barrelType`.
 * `barrel: { nested: true }` maps to the legacy `'propagate'` value, and
 * `barrel: false` disables the barrel file.
 */
export function resolveBarrelType(output: BarrelOutput | undefined): BarrelType | false | undefined {
  if (!output) {
    return undefined
  }

  const { barrel } = output
  if (barrel !== undefined) {
    if (barrel === false) {
      return false
    }
    if (barrel.nested) {
      return 'propagate'
    }
    return barrel.type ?? 'named'
  }

  return output.barrelType
}
