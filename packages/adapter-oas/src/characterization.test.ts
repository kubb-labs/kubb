import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { adapterOas } from './adapter.ts'

/**
 * Guards the `adapter-oas` -> `Load`/`Model`/`Emit` reshape (see the `adapter-oas: leaner
 * shape` plan). Every slice of that refactor must keep these fixtures byte-identical.
 */
describe('characterization', () => {
  it.each(['petStore.yaml', 'withExternalFileRef.yaml', 'withFragmentRef.yaml'])('parses %s identically to the baseline', async (fixture) => {
    const adapter = adapterOas()
    const node = await adapter.parse({ type: 'path', path: path.resolve(import.meta.dirname, '../mocks', fixture) })

    await expect(JSON.stringify(node, null, 2)).toMatchFileSnapshot(`./__snapshots__/characterization.${fixture}.json`)
  })
})
