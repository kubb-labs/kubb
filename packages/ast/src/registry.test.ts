import { describe, expect, it } from 'vitest'
import * as factory from './factory.ts'
import { nodeDefs } from './registry.ts'

describe('registry to factory wiring', () => {
  it('exposes a factory.create<Kind> for every node def', () => {
    const factoryExports = factory as Record<string, unknown>
    const missing = nodeDefs.map((def) => `create${def.kind}`).filter((name) => typeof factoryExports[name] !== 'function')

    expect(missing).toStrictEqual([])
  })
})
