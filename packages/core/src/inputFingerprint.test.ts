import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { describeConfig, fingerprintInputs } from './inputFingerprint.ts'
import type { Config } from './types.ts'

const makeConfig = (config: Partial<Config> & Record<string, unknown> = {}) =>
  ({ root: '/project', output: { path: './gen' }, plugins: [], ...config }) as Config

describe('describeConfig', () => {
  it.each([
    ['an option', { output: { path: './other' } }],
    ['the body of a function', { plugins: [{ name: 'plugin', transform: () => 'b' }] }],
  ])('changes when %s changes', (_name, change) => {
    const base = makeConfig({ plugins: [{ name: 'plugin', transform: () => 'a' }] as never })

    expect(describeConfig(makeConfig(change as never))).not.toBe(describeConfig(base))
  })

  it('is the same on another machine: the root, the storage and the reporters are left out', () => {
    const here = makeConfig({ root: '/home/a/project', input: '/home/a/project/openapi.yaml', storage: { name: 'fs' } as never })
    const there = makeConfig({ root: '/srv/b', input: '/srv/b/openapi.yaml', reporters: [{ name: 'cli' }] as never })

    expect(describeConfig(here)).toBe(describeConfig(there))
  })

  it('writes out a config that refers to itself', () => {
    const plugin: Record<string, unknown> = { name: 'plugin' }
    plugin.self = plugin

    expect(describeConfig(makeConfig({ plugins: [plugin] as never }))).toContain('[circular]')
  })

  it('returns null for a config with a getter that throws', () => {
    const adapter = {
      get document(): never {
        throw new Error('not parsed yet')
      },
    }

    expect(describeConfig(makeConfig({ adapter: adapter as never }))).toBeNull()
  })
})

describe('fingerprintInputs', () => {
  const roots: Array<string> = []

  afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
  })

  function project() {
    const root = mkdtempSync(join(tmpdir(), 'kubb-inputs-'))
    roots.push(root)
    writeFileSync(join(root, 'openapi.yaml'), 'openapi: 3.0.3')

    return root
  }

  it('lists the sources by their path from the root', async () => {
    const root = project()

    expect(await fingerprintInputs({ root, configText: '{}', sources: [join(root, 'openapi.yaml')] })).toStrictEqual({
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
    const before = await fingerprintInputs({ root, configText: '{}', sources })
    change(root)

    expect((await fingerprintInputs({ root, configText, sources }))?.hash).not.toBe(before?.hash)
  })

  it.each([
    ['a URL', 'https://example.com/openapi.yaml'],
    ['a missing file', 'missing.yaml'],
  ])('returns null for %s, which cannot be compared', async (_name, source) => {
    expect(await fingerprintInputs({ root: project(), configText: '{}', sources: [source] })).toBeNull()
  })
})
