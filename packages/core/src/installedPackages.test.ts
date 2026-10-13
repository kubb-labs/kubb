import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { readInstalledPackages } from './installedPackages.ts'

describe('readInstalledPackages', () => {
  it('reads the version and manifest of a package whose exports map hides them', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'kubb-installed-'))
    const dir = path.join(cwd, 'node_modules', '@acme', 'kubb-plugin-x')
    const manifest = { kind: 'plugin', name: 'plugin-x', export: 'pluginX', displayName: 'X', description: 'Generates X.' }
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(cwd, 'package.json'), JSON.stringify({ devDependencies: { '@acme/kubb-plugin-x': '^1.0.0' } }))
    await writeFile(path.join(dir, 'package.json'), JSON.stringify({ name: '@acme/kubb-plugin-x', version: '1.2.3', exports: { '.': './index.js' } }))
    await writeFile(path.join(dir, 'kubb-extension.json'), JSON.stringify(manifest))

    expect(await readInstalledPackages({ root: cwd })).toStrictEqual([{ package: '@acme/kubb-plugin-x', version: '1.2.3', manifest }])
    await rm(cwd, { recursive: true, force: true })
  })

  it('accepts a relative root', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'kubb-installed-'))
    await writeFile(path.join(cwd, 'package.json'), JSON.stringify({ dependencies: {} }))

    expect(await readInstalledPackages({ root: path.relative(process.cwd(), cwd) })).toStrictEqual([])
    await rm(cwd, { recursive: true, force: true })
  })
})
