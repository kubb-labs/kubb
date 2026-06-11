import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AdapterSource } from './createAdapter.ts'
import type { Config } from './types.ts'
import { Fingerprint } from './Fingerprint.ts'

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    root: '/project',
    name: 'api',
    output: { path: 'src/gen' },
    parsers: [],
    plugins: [],
    storage: {} as Config['storage'],
    ...overrides,
  } as Config
}

const dataSource: AdapterSource = { type: 'data', data: { openapi: '3.1.0', paths: {} } }

describe('Fingerprint.stringify', () => {
  it('is independent of object key order', () => {
    expect(Fingerprint.stringify({ a: 1, b: 2 })).toBe(Fingerprint.stringify({ b: 2, a: 1 }))
  })

  it('drops functions', () => {
    expect(Fingerprint.stringify({ a: 1, fn: () => 0 })).toBe(Fingerprint.stringify({ a: 1 }))
  })
})

describe('Fingerprint.compute', () => {
  const version = '5.0.0'

  it('returns the same key for identical inputs', async () => {
    const a = await Fingerprint.compute({ config: makeConfig(), adapterSource: dataSource, version })
    const b = await Fingerprint.compute({ config: makeConfig(), adapterSource: dataSource, version })
    expect(a).toBe(b)
  })

  it('changes when plugin options change', async () => {
    const a = await Fingerprint.compute({
      config: makeConfig({ plugins: [{ name: 'p', options: { x: 1 } }] as unknown as Config['plugins'] }),
      adapterSource: dataSource,
      version,
    })
    const b = await Fingerprint.compute({
      config: makeConfig({ plugins: [{ name: 'p', options: { x: 2 } }] as unknown as Config['plugins'] }),
      adapterSource: dataSource,
      version,
    })
    expect(a).not.toBe(b)
  })

  it('changes when plugin order changes', async () => {
    const plugins = (names: Array<string>) => names.map((name) => ({ name, options: {} })) as unknown as Config['plugins']
    const a = await Fingerprint.compute({ config: makeConfig({ plugins: plugins(['a', 'b']) }), adapterSource: dataSource, version })
    const b = await Fingerprint.compute({ config: makeConfig({ plugins: plugins(['b', 'a']) }), adapterSource: dataSource, version })
    expect(a).not.toBe(b)
  })

  it('changes when output options change', async () => {
    const a = await Fingerprint.compute({ config: makeConfig({ output: { path: 'a' } }), adapterSource: dataSource, version })
    const b = await Fingerprint.compute({ config: makeConfig({ output: { path: 'b' } }), adapterSource: dataSource, version })
    expect(a).not.toBe(b)
  })

  it('changes when parser names change', async () => {
    const a = await Fingerprint.compute({
      config: makeConfig({ parsers: [{ name: 'ts' }] as unknown as Config['parsers'] }),
      adapterSource: dataSource,
      version,
    })
    const b = await Fingerprint.compute({
      config: makeConfig({ parsers: [{ name: 'md' }] as unknown as Config['parsers'] }),
      adapterSource: dataSource,
      version,
    })
    expect(a).not.toBe(b)
  })

  it('changes when the kubb version changes', async () => {
    const a = await Fingerprint.compute({ config: makeConfig(), adapterSource: dataSource, version: '5.0.0' })
    const b = await Fingerprint.compute({ config: makeConfig(), adapterSource: dataSource, version: '5.1.0' })
    expect(a).not.toBe(b)
  })

  it('changes when the inline spec data changes', async () => {
    const a = await Fingerprint.compute({ config: makeConfig(), adapterSource: { type: 'data', data: { openapi: '3.1.0' } }, version })
    const b = await Fingerprint.compute({ config: makeConfig(), adapterSource: { type: 'data', data: { openapi: '3.0.0' } }, version })
    expect(a).not.toBe(b)
  })

  it('returns null for a URL input', async () => {
    const key = await Fingerprint.compute({ config: makeConfig(), adapterSource: { type: 'path', path: 'https://example.com/openapi.json' }, version })
    expect(key).toBeNull()
  })

  it('returns null when there is no adapter source', async () => {
    expect(await Fingerprint.compute({ config: makeConfig(), adapterSource: null, version })).toBeNull()
  })

  describe('path inputs', () => {
    let dir: string

    beforeEach(async () => {
      dir = await mkdtemp(join(tmpdir(), 'kubb-fp-'))
    })

    afterEach(async () => {
      await rm(dir, { recursive: true, force: true })
    })

    it('changes when the spec file content changes', async () => {
      const file = join(dir, 'openapi.json')
      const config = makeConfig({ root: dir })

      await writeFile(file, '{"openapi":"3.1.0"}')
      const a = await Fingerprint.compute({ config, adapterSource: { type: 'path', path: file }, version })

      await writeFile(file, '{"openapi":"3.0.0"}')
      const b = await Fingerprint.compute({ config, adapterSource: { type: 'path', path: file }, version })

      expect(a).not.toBe(b)
    })
  })
})
