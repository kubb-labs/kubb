import { describe, expect, it } from 'vitest'
import { resolvePlugins } from './init.ts'

describe('resolvePlugins', () => {
  it('defaults to plugin-ts when no flag is given', () => {
    const result = resolvePlugins(undefined)
    expect(result.map((plugin) => plugin.value)).toMatchInlineSnapshot(`
      [
        "plugin-ts",
      ]
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

  it('trims whitespace around plugin names', () => {
    const result = resolvePlugins(' plugin-ts , plugin-zod ')
    expect(result.map((plugin) => plugin.value)).toMatchInlineSnapshot(`
      [
        "plugin-ts",
        "plugin-zod",
      ]
    `)
  })

  it('falls back to plugin-ts for unrecognized plugins', () => {
    const result = resolvePlugins('plugin-does-not-exist')
    expect(result.map((plugin) => plugin.value)).toMatchInlineSnapshot(`
      [
        "plugin-ts",
      ]
    `)
  })

  it('ignores empty segments from trailing commas', () => {
    const result = resolvePlugins('plugin-ts,,')
    expect(result.map((plugin) => plugin.value)).toMatchInlineSnapshot(`
      [
        "plugin-ts",
      ]
    `)
  })
})
