import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { adapterOas } from './adapter.ts'

/**
 * Sorts object keys recursively so the comparison is insensitive to incidental object-literal
 * construction order (which the reshape slices are free to change) while still catching any
 * change to the actual node values.
 */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    )
  }
  return value
}

/**
 * Guards the `adapter-oas` -> `Load`/`Model`/`Emit` reshape (see the `adapter-oas: leaner
 * shape` plan). Every slice of that refactor must keep these fixtures byte-identical.
 */
describe('characterization', () => {
  it.each(['petStore.yaml', 'withExternalFileRef.yaml', 'withFragmentRef.yaml'])('parses %s identically to the baseline', async (fixture) => {
    const adapter = adapterOas()
    const node = await adapter.parse({ type: 'path', path: path.resolve(import.meta.dirname, '../mocks', fixture) })

    await expect(JSON.stringify(canonicalize(node), null, 2)).toMatchFileSnapshot(`./__snapshots__/characterization.${fixture}.json`)
  })
})
