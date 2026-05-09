import { describe, expect, it } from 'vitest'
import { resolvePlugins } from './init.ts'

describe('resolvePlugins', () => {
  it('returns an empty list when no flag is given', () => {
    const result = resolvePlugins(undefined)
    expect(result.map((plugin) => plugin.value)).toMatchInlineSnapshot(`
      []
    `)
  })

  it('returns matched plugins for a comma-separated list', () => {
    const result = resolvePlugins('plugin-ts,plugin-zod')
    expect(result.map((plugin) => plugin.value)).toMatchInlineSnapshot(`
      [
        "plugin-ts",
        "plugin-zod",
      ]
    `)
  })

  it('returns an empty list for unrecognized plugins', () => {
    const result = resolvePlugins('plugin-does-not-exist')
    expect(result.map((plugin) => plugin.value)).toMatchInlineSnapshot(`
      []
    `)
  })
})
