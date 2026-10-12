import { describe, expect, it } from 'vitest'
import { version } from '../package.json'
import { checkCompatibility, checkDependencies, defineExtension, parseExtensionOptions, resolveMeta } from './defineExtension.ts'
import { Diagnostics } from './Diagnostics.ts'
import type { StandardSchemaV1 } from './standardSchema.ts'

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

const schema: StandardSchemaV1<{ pretty?: boolean }, { pretty: boolean }> = {
  '~standard': {
    version: 1,
    vendor: 'test',
    validate(value) {
      const { pretty = false } = value as { pretty?: unknown }
      if (typeof pretty !== 'boolean') return { issues: [{ message: 'Expected a boolean', path: ['pretty'] }, { message: 'Unknown key' }] }
      return { value: { pretty } }
    },
  },
}

describe('parseExtensionOptions', () => {
  it('returns the parsed options with the schema defaults', () => {
    expect(parseExtensionOptions({ kind: 'parser', meta: { name: 'json' }, schema, input: {} })).toStrictEqual({ pretty: false })
  })

  it('throws KUBB_INVALID_OPTIONS listing each issue, without a plugin for other kinds', () => {
    let thrown: unknown
    try {
      parseExtensionOptions({ kind: 'parser', meta: { name: 'json' }, schema, input: { pretty: 'yes' } })
    } catch (error) {
      thrown = error
    }

    expect(Diagnostics.from(thrown)).toMatchObject({
      code: Diagnostics.code.invalidOptions,
      message: 'Invalid options for parser "json". `pretty`: Expected a boolean; Unknown key',
    })
    expect(Diagnostics.from(thrown)).not.toHaveProperty('plugin')
  })
})

describe('defineExtension', () => {
  it('builds a factory with kind and meta statics that passes {} when called without options', () => {
    const factory = defineExtension({ kind: 'parser', meta: { name: 'json' }, build: ({ options }: { options: { pretty?: boolean } }) => options })

    expect(factory.kind).toBe('parser')
    expect(factory.meta).toStrictEqual({ name: 'json' })
    expect(factory()).toStrictEqual({})
    expect(factory({ pretty: true })).toStrictEqual({ pretty: true })
  })

  it('parses the options with schema and carries it as a static', () => {
    const factory = defineExtension({ kind: 'parser', meta: { name: 'json' }, schema, build: ({ options, parsedOptions }) => ({ options, parsedOptions }) })

    expect(factory.schema).toBe(schema)
    expect(factory()).toStrictEqual({ options: {}, parsedOptions: { pretty: false } })
  })
})
