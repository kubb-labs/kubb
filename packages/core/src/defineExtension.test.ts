import { describe, expect, expectTypeOf, it } from 'vitest'
import { version } from '../package.json'
import { ast } from '@kubb/ast'
import { checkCompatibility, checkDependencies, createExtensionFactory, defineExtension, resolveMeta } from './defineExtension.ts'
import { createAdapter } from './createAdapter.ts'
import type { Adapter, AdapterFactoryOptions } from './createAdapter.ts'
import { defineParser } from './defineParser.ts'
import type { Parser } from './defineParser.ts'
import { definePlugin } from './definePlugin.ts'
import type { Plugin, PluginType } from './definePlugin.ts'
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

describe('createExtensionFactory', () => {
  it('builds a factory with kind and meta statics that passes {} when called without options', () => {
    const factory = createExtensionFactory({ kind: 'parser', meta: { name: 'json' }, build: (options: { pretty?: boolean }) => options })

    expect(factory.kind).toBe('parser')
    expect(factory.meta).toStrictEqual({ name: 'json' })
    expect(factory()).toStrictEqual({})
    expect(factory({ pretty: true })).toStrictEqual({ pretty: true })
  })
})

describe('defineExtension', () => {
  type PluginText = PluginType<'plugin-text', { tag?: string }, { tag: string }>
  type AdapterText = AdapterFactoryOptions<'text', { strict?: boolean }, { strict: boolean }, string>

  it('defines a plugin when kind is plugin', () => {
    const factory = defineExtension<PluginText>({
      kind: 'plugin',
      meta: { name: 'plugin-text', version: '1.0.0' },
      setup: (options) => ({ tag: options.tag ?? 'all' }),
    })
    const plugin = factory({ tag: 'pets' })

    expect(factory.kind).toBe('plugin')
    expect(factory.meta).toStrictEqual({ name: 'plugin-text', version: '1.0.0' })
    expect(plugin).toMatchObject({ name: 'plugin-text', meta: { name: 'plugin-text' }, options: { tag: 'pets' }, hooks: {} })
    expectTypeOf(factory()).toEqualTypeOf<Plugin<PluginText>>()
  })

  it('defines an adapter when kind is adapter, resolving options with setup', () => {
    const factory = defineExtension<AdapterText>({
      kind: 'adapter',
      meta: { name: 'text' },
      setup: ({ strict = true }) => ({ strict }),
      build: () => ({ document: null, parse: () => ast.factory.createInput(), validate: async () => {} }),
    })

    expect(factory.kind).toBe('adapter')
    expect(factory.meta).toStrictEqual({ name: 'text' })
    expect(factory({ strict: false })).toMatchObject({ name: 'text', meta: { name: 'text' }, options: { strict: false } })
    expectTypeOf(factory()).toEqualTypeOf<Adapter<AdapterText>>()
  })

  it('defines a parser when kind is parser', () => {
    const factory = defineExtension<{ pretty?: boolean }, object, string>({
      kind: 'parser',
      meta: { name: 'json' },
      build: (options) => ({ extNames: ['.json'], parse: () => (options.pretty ? 'pretty' : 'compact'), print: (...nodes) => nodes.join('\n') }),
    })
    const parser = factory({ pretty: true })

    expect(factory.kind).toBe('parser')
    expect(factory.meta).toStrictEqual({ name: 'json' })
    expect(parser).toMatchObject({ name: 'json', extNames: ['.json'], options: { pretty: true } })
    expect(parser.parse({} as never)).toBe('pretty')
    expectTypeOf(parser).toEqualTypeOf<Parser<object, string, { pretty?: boolean }>>()
  })

  it('keeps the literal extNames of a parser whose build takes no options', () => {
    const parser = defineExtension({
      kind: 'parser',
      meta: { name: 'text' },
      build() {
        return { extNames: ['.txt'], parse: () => '', print: () => '' }
      },
    })()

    expect(parser.extNames).toStrictEqual(['.txt'])
  })

  it('rejects a definition whose fields belong to another kind', () => {
    // @ts-expect-error a plugin has no `build`
    defineExtension({ kind: 'plugin', meta: { name: 'plugin-text' }, build: () => ({}) })
    // @ts-expect-error an adapter needs `build`
    defineExtension({ kind: 'adapter', meta: { name: 'text' } })
  })
})

describe('deprecated definers', () => {
  it('definePlugin, defineParser, and createAdapter return the same factory as defineExtension', () => {
    const plugin = definePlugin({ meta: { name: 'plugin-text' } })
    const parser = defineParser({ meta: { name: 'text' }, build: () => ({ extNames: undefined, parse: () => '', print: () => '' }) })
    const adapter = createAdapter({
      meta: { name: 'text' },
      build: () => ({ document: null, parse: () => ast.factory.createInput(), validate: async () => {} }),
    })

    expect([plugin.kind, parser.kind, adapter.kind]).toStrictEqual(['plugin', 'parser', 'adapter'])
    expect(plugin().meta).toStrictEqual(defineExtension({ kind: 'plugin', meta: { name: 'plugin-text' } })().meta)
    expect(parser()).toMatchObject({ name: 'text', meta: { name: 'text' } })
    expect(adapter()).toMatchObject({ name: 'text', meta: { name: 'text' } })
  })
})
