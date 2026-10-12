import { describe, expect, it } from 'vitest'
import { version } from '../package.json'
import { checkCompatibility, checkDependencies, defineExtension, resolveMeta } from './defineExtension.ts'
import { Diagnostics } from './Diagnostics.ts'

describe('resolveMeta', () => {
  it('returns meta, or { name } for an extension that only sets name', () => {
    expect(resolveMeta({ meta: { name: 'plugin-a' } })).toEqual({ name: 'plugin-a' })
    expect(resolveMeta({ name: 'plugin-b' })).toEqual({ name: 'plugin-b' })
  })

  it('throws KUBB_INVALID_PLUGIN_OPTIONS when there is neither', () => {
    expect(() => resolveMeta({})).toThrow(expect.objectContaining({ diagnostic: expect.objectContaining({ code: Diagnostics.code.invalidPluginOptions }) }))
  })
})

describe('checkCompatibility', () => {
  it('passes when no range is set or the running versions match', () => {
    expect(() => checkCompatibility({ name: 'plugin-a' })).not.toThrow()
    expect(() => checkCompatibility({ name: 'plugin-a', compatibility: { kubb: `>=${version}`, node: '>=18' } })).not.toThrow()
  })

  it('throws KUBB_INCOMPATIBLE_EXTENSION for a Kubb range the running core does not satisfy', () => {
    expect(() => checkCompatibility({ name: 'plugin-a', compatibility: { kubb: '>=99' } })).toThrow(
      expect.objectContaining({
        diagnostic: expect.objectContaining({
          code: Diagnostics.code.incompatibleExtension,
          plugin: 'plugin-a',
          message: `"plugin-a" requires Kubb >=99, but ${version} is running.`,
        }),
      }),
    )
  })

  it('throws KUBB_INCOMPATIBLE_EXTENSION for a Node.js range the running process does not satisfy', () => {
    expect(() => checkCompatibility({ name: 'plugin-a', compatibility: { node: '<1' } })).toThrow(
      expect.objectContaining({ diagnostic: expect.objectContaining({ code: Diagnostics.code.incompatibleExtension }) }),
    )
  })
})

describe('checkDependencies', () => {
  const plugins = new Map([
    ['plugin-versioned', { meta: { name: 'plugin-versioned', version: '2.1.0' } }],
    ['plugin-unversioned', {}],
  ])

  it('ignores the array form, even for a missing plugin', () => {
    expect(() => checkDependencies({ name: 'plugin-a', dependencies: ['plugin-missing'], plugins })).not.toThrow()
  })

  it('passes for an in-range version, an unversioned dependency, and a missing optional one', () => {
    const dependencies = {
      'plugin-versioned': { version: '^2.0.0' },
      'plugin-unversioned': { version: '^9.0.0' },
      'plugin-missing': { optional: true },
    }

    expect(() => checkDependencies({ name: 'plugin-a', dependencies, plugins })).not.toThrow()
  })

  it('throws KUBB_MISSING_DEPENDENCY for a missing required plugin', () => {
    expect(() => checkDependencies({ name: 'plugin-a', dependencies: { 'plugin-missing': {} }, plugins })).toThrow(
      expect.objectContaining({ diagnostic: expect.objectContaining({ code: Diagnostics.code.missingDependency, plugin: 'plugin-a' }) }),
    )
  })

  it('throws KUBB_INCOMPATIBLE_DEPENDENCY for an out-of-range version, also when optional', () => {
    expect(() => checkDependencies({ name: 'plugin-a', dependencies: { 'plugin-versioned': { version: '^3.0.0', optional: true } }, plugins })).toThrow(
      expect.objectContaining({ diagnostic: expect.objectContaining({ code: Diagnostics.code.incompatibleDependency, plugin: 'plugin-a' }) }),
    )
  })
})

describe('defineExtension', () => {
  it('builds a factory with kind and meta statics that passes {} when called without options', () => {
    const factory = defineExtension({ kind: 'parser', meta: { name: 'json' }, build: (options: { pretty?: boolean }) => options })

    expect(factory.kind).toBe('parser')
    expect(factory.meta).toStrictEqual({ name: 'json' })
    expect(factory()).toStrictEqual({})
    expect(factory({ pretty: true })).toStrictEqual({ pretty: true })
  })
})
