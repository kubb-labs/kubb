import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { isOutdated, readInstalledPackages, registryUrl, toRegistryId } from './registry.ts'

afterEach(() => {
  delete process.env.KUBB_REGISTRY
})

describe('toRegistryId', () => {
  it('reads a bare slug as an official extension', () => {
    expect([toRegistryId('plugin-zod'), toRegistryId('acme/plugin-x')]).toStrictEqual(['kubb-labs/plugin-zod', 'acme/plugin-x'])
  })

  it.each(['@kubb/plugin-zod', 'acme/plugin-x/extra', '../x', 'Plugin-Zod', 'acme/'])('rejects %s', (input) => {
    expect(() => toRegistryId(input)).toThrow('is not a registry id')
  })
})

describe('registryUrl', () => {
  it('uses KUBB_REGISTRY without its trailing slash, and refuses anything but http(s)', () => {
    expect(registryUrl()).toBe('https://kubb.dev/registry')
    process.env.KUBB_REGISTRY = 'http://localhost:4000/registry/'
    expect(registryUrl()).toBe('http://localhost:4000/registry')
    process.env.KUBB_REGISTRY = 'file:///etc'
    expect(() => registryUrl()).toThrow('must be an http(s) URL')
  })
})

describe('isOutdated', () => {
  it('compares semver, and treats an unknown installed version as outdated', () => {
    expect([
      isOutdated({ installed: '1.9.0', latest: '1.10.0' }),
      isOutdated({ installed: '1.10.0', latest: '1.10.0' }),
      isOutdated({ installed: undefined, latest: '1.0.0' }),
    ]).toStrictEqual([true, false, true])
  })
})

describe('readInstalledPackages', () => {
  it('reads the version and manifest of a package whose exports map hides them', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'kubb-installed-'))
    const dir = path.join(cwd, 'node_modules', '@acme', 'kubb-plugin-x')
    const manifest = { kind: 'plugin', name: 'plugin-x', export: 'pluginX', displayName: 'X', description: 'Generates X.' }
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(cwd, 'package.json'), JSON.stringify({ devDependencies: { '@acme/kubb-plugin-x': '^1.0.0' } }))
    await writeFile(path.join(dir, 'package.json'), JSON.stringify({ name: '@acme/kubb-plugin-x', version: '1.2.3', exports: { '.': './index.js' } }))
    await writeFile(path.join(dir, 'kubb-extension.json'), JSON.stringify(manifest))

    expect(await readInstalledPackages(cwd)).toStrictEqual([{ package: '@acme/kubb-plugin-x', version: '1.2.3', manifest }])
    await rm(cwd, { recursive: true, force: true })
  })
})
