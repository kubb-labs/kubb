import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { defineParser } from './defineParser.ts'
import type { Parser } from './defineParser.ts'
import { Diagnostics } from './Diagnostics.ts'
import { Hookable } from './Hookable.ts'
import { KubbDriver } from './KubbDriver.ts'
import { memoryStorage } from './storages/memoryStorage.ts'
import type { Config, KubbHooks } from './types.ts'

const parserJson = defineParser<{ pretty?: boolean }, object, string>({
  meta: { name: 'json', version: '1.0.0' },
  build(options) {
    return {
      extNames: ['.json'],
      parse: () => (options.pretty ? 'pretty' : 'compact'),
      print: (...nodes) => nodes.join('\n'),
    }
  },
})

function makeConfig(parsers: Config['parsers']): Config {
  return {
    root: '.',
    input: './petStore.yaml',
    output: { path: './gen' },
    parsers,
    reporters: [],
    adapter: createMockedAdapter(),
    plugins: [],
    storage: memoryStorage(),
  }
}

describe('defineParser object form', () => {
  it('returns a factory with kind and meta statics that passes the options to build', () => {
    const parser = parserJson({ pretty: true })

    expect(parserJson.kind).toBe('parser')
    expect(parserJson.meta).toStrictEqual({ name: 'json', version: '1.0.0' })
    expect(parser).toMatchObject({ name: 'json', meta: { name: 'json' }, extNames: ['.json'] })
    expect(parser.parse({} as never)).toBe('pretty')
    expect(parserJson().parse({} as never)).toBe('compact')
    expect(parser.options).toStrictEqual({ pretty: true })
    expectTypeOf(parser).toEqualTypeOf<Parser<object, string, { pretty?: boolean }>>()
  })

  it('still accepts the deprecated setup', () => {
    const parser = defineParser({ meta: { name: 'text' }, setup: () => ({ extNames: ['.txt'], parse: () => 'text', print: () => '' }) })()

    expect(parser).toMatchObject({ name: 'text', extNames: ['.txt'] })
    expect(parser.parse({} as never)).toBe('text')
  })

  it('gives the factory form kind and a meta fallback', () => {
    const factory = defineParser((options: { name?: string }) => ({ name: options.name ?? 'text', extNames: undefined, parse: () => '', print: () => '' }))

    expect(factory.kind).toBe('parser')
    expect(factory()).toMatchObject({ name: 'text', meta: { name: 'text' } })
    expect(factory({ name: 'json' }).meta).toStrictEqual({ name: 'json' })
  })

  it('throws KUBB_INCOMPATIBLE_EXTENSION from KubbDriver.setup when a parser requires a newer Kubb', async () => {
    const future = defineParser({
      meta: { name: 'future', compatibility: { kubb: '>=99' } },
      setup: () => ({ extNames: undefined, parse: () => '', print: () => '' }),
    })
    const driver = new KubbDriver(makeConfig([future()]), { hooks: new Hookable<KubbHooks>() })

    await expect(driver.setup()).rejects.toMatchObject({ diagnostic: { code: Diagnostics.code.incompatibleExtension, plugin: 'future' } })
  })
})
