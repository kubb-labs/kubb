import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { discoverExtensions } from './extensions.ts'

const manifest = { kind: 'plugin', name: 'plugin-x', export: 'pluginX', displayName: 'X', description: 'Generates X.' }

let root: string

async function addPackage(name: string, files: Record<string, unknown>): Promise<void> {
  const dir = path.join(root, 'node_modules', name)
  await mkdir(dir, { recursive: true })
  await Promise.all(
    Object.entries(files).map(([file, content]) => writeFile(path.join(dir, file), typeof content === 'string' ? content : JSON.stringify(content))),
  )
}

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'kubb-extensions-'))
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('discoverExtensions', () => {
  it('keeps installed dependencies that ship a valid manifest', async () => {
    await writeFile(
      path.join(root, 'package.json'),
      JSON.stringify({ devDependencies: { '@acme/plugin-x': '^1.0.0', 'left-pad': '^1.0.0', '@acme/broken': '^1.0.0', '@acme/missing': '^1.0.0' } }),
    )
    await addPackage('@acme/plugin-x', { 'package.json': { name: '@acme/plugin-x', version: '1.2.3' }, 'kubb-extension.json': manifest })
    await addPackage('left-pad', { 'package.json': { name: 'left-pad', version: '1.0.0' } })
    await addPackage('@acme/broken', { 'package.json': { name: '@acme/broken', version: '1.0.0' }, 'kubb-extension.json': '{ not json' })

    const extensions = await discoverExtensions({ root })

    expect(extensions.get('@acme/plugin-x')).toStrictEqual({ package: '@acme/plugin-x', version: '1.2.3', manifest })
    expect(['left-pad', '@acme/broken', '@acme/missing'].filter((name) => extensions.has(name))).toStrictEqual([])
  })

  it('reads the packages the config imports, and skips a manifest with an invalid export', async () => {
    await writeFile(path.join(root, 'package.json'), JSON.stringify({}))
    await addPackage('@acme/plugin-x', { 'package.json': { name: '@acme/plugin-x', version: '1.0.0' }, 'kubb-extension.json': manifest })
    await addPackage('@acme/plugin-y', {
      'package.json': { name: '@acme/plugin-y', version: '1.0.0' },
      'kubb-extension.json': { ...manifest, name: 'plugin-y', export: 'x } from "evil"' },
    })

    const extensions = await discoverExtensions({ root, packages: ['@acme/plugin-x', '@acme/plugin-y', './local.ts'] })

    expect(extensions.has('@acme/plugin-x')).toBe(true)
    expect(extensions.has('@acme/plugin-y')).toBe(false)
  })

  it('finds the manifest of a package whose exports map hides it', async () => {
    await writeFile(path.join(root, 'package.json'), JSON.stringify({ dependencies: { '@acme/plugin-x': '^1.0.0' } }))
    await addPackage('@acme/plugin-x', {
      'package.json': { name: '@acme/plugin-x', version: '1.0.0', exports: { '.': './index.js' } },
      'kubb-extension.json': manifest,
    })

    expect((await discoverExtensions({ root })).get('@acme/plugin-x')).toStrictEqual({ package: '@acme/plugin-x', version: '1.0.0', manifest })
  })

  it('returns an empty set for a root without a package.json', async () => {
    expect((await discoverExtensions({ root })).has('@acme/plugin-x')).toBe(false)
  })
})
