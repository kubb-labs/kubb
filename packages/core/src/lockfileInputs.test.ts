import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { serializeConfig, hashInputs } from './lockfileInputs.ts'
import type { Config } from './types.ts'

const makeConfig = (config: Partial<Config> & Record<string, unknown> = {}) =>
  ({ root: '/project', output: { path: './gen' }, plugins: [], ...config }) as Config

describe('serializeConfig', () => {
  it.each([
    ['an option', { output: { path: './other' } }],
    ['the body of a function', { plugins: [{ name: 'plugin', transform: () => 'b' }] }],
  ])('changes when %s changes', (_name, change) => {
    const base = makeConfig({ plugins: [{ name: 'plugin', transform: () => 'a' }] as never })

    expect(serializeConfig(makeConfig(change as never))).not.toBe(serializeConfig(base))
  })

  it('is the same on another machine: the root, the storage and the reporters are left out', () => {
    const here = makeConfig({ root: '/home/a/project', input: '/home/a/project/openapi.yaml', storage: { name: 'fs' } as never })
    const there = makeConfig({ root: '/srv/b', input: '/srv/b/openapi.yaml', reporters: [{ name: 'cli' }] as never })

    expect(serializeConfig(here)).toBe(serializeConfig(there))
  })

  it('writes out a config that refers to itself', () => {
    const plugin: Record<string, unknown> = { name: 'plugin' }
    plugin.self = plugin

    expect(serializeConfig(makeConfig({ plugins: [plugin] as never }))).toContain('[circular]')
  })

  it('returns null for a config with a getter that throws', () => {
    const plugin = {
      get options(): never {
        throw new Error('not ready')
      },
    }

    expect(serializeConfig(makeConfig({ plugins: [plugin] as never }))).toBeNull()
  })

  it('reads only the name and options of the adapter, not the document it parsed', () => {
    const adapter = (document: unknown) => ({ name: 'oas', options: { validate: true }, document, sources: document ? ['/project/openapi.yaml'] : [] })

    expect(serializeConfig(makeConfig({ adapter: adapter({ openapi: '3.0.3' }) as never }))).toBe(
      serializeConfig(makeConfig({ adapter: adapter(null) as never })),
    )
  })

  it('is the same for a config file checked out with CRLF line endings', () => {
    const lf = makeConfig({ plugins: [{ name: 'plugin', transform: 'function () {\n  return 1\n}' }] as never })
    const crlf = makeConfig({ plugins: [{ name: 'plugin', transform: 'function () {\r\n  return 1\r\n}' }] as never })

    expect(serializeConfig(crlf)).toBe(serializeConfig(lf))
  })
})

describe('hashInputs', () => {
  const roots: Array<string> = []

  afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
  })

  function project() {
    const root = mkdtempSync(join(tmpdir(), 'kubb-inputs-'))
    roots.push(root)
    writeFileSync(join(root, 'openapi.yaml'), 'openapi: 3.0.3\ninfo: {}')
    writeFileSync(join(root, 'package.json'), '{}')

    return root
  }

  it('lists the sources by their path from the root', async () => {
    const root = project()

    expect(await hashInputs({ root, configText: '{}', sources: [join(root, 'openapi.yaml')] })).toStrictEqual({
      hash: expect.stringMatching(/^[0-9a-f]{64}$/),
      sources: ['openapi.yaml'],
    })
  })

  it.each([
    ['a source file', (root: string) => void writeFileSync(join(root, 'openapi.yaml'), 'openapi: 3.1.0'), '{}'],
    ['the config', () => {}, '{"output":{}}'],
    ['an installed package', (root: string) => void writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: { vitest: '*' } })), '{}'],
  ])('changes when %s changes', async (_name, change, configText) => {
    const root = project()
    const sources = ['openapi.yaml']
    const before = await hashInputs({ root, configText: '{}', sources })
    change(root)

    expect((await hashInputs({ root, configText, sources }))?.hash).not.toBe(before?.hash)
  })

  it('is the same for a spec checked out with CRLF line endings', async () => {
    const root = project()
    const before = await hashInputs({ root, configText: '{}', sources: ['openapi.yaml'] })
    writeFileSync(join(root, 'openapi.yaml'), 'openapi: 3.0.3\r\ninfo: {}')

    expect(await hashInputs({ root, configText: '{}', sources: ['openapi.yaml'] })).toStrictEqual(before)
  })

  it('counts the packages of a workspace root above the project', async () => {
    const workspace = project()
    const root = join(workspace, 'packages', 'api')
    mkdirSync(root, { recursive: true })
    const before = await hashInputs({ root, configText: '{}', sources: [] })
    writeFileSync(join(workspace, 'package.json'), JSON.stringify({ dependencies: { vitest: '*' } }))

    expect(before).not.toBeNull()
    expect((await hashInputs({ root, configText: '{}', sources: [] }))?.hash).not.toBe(before?.hash)
  })

  it.each([
    ['a URL', 'https://example.com/openapi.yaml', undefined],
    ['a missing file', 'missing.yaml', undefined],
    ['a file saved after the build started', 'openapi.yaml', 0],
  ])('returns null for %s, which cannot be compared', async (_name, source, since) => {
    expect(await hashInputs({ root: project(), configText: '{}', sources: [source], since })).toBeNull()
  })

  it('returns null without a package.json, since the installed versions are unknown', async () => {
    const root = project()
    rmSync(join(root, 'package.json'))

    expect(await hashInputs({ root, configText: '{}', sources: ['openapi.yaml'] })).toBeNull()
  })
})
