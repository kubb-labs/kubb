import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RegistryEntry } from '@kubb/core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { registryEntry } from '../../utils/registryFixture.ts'
import { addGenerateScript, detectPackageManager, findSpecFiles, missingPluginDependencies, parsePluginsFlag, readSpecInfo } from './utils.ts'

describe('detectPackageManager', () => {
  let cwd: string

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'kubb-pm-'))
  })

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('prefers the packageManager field over lock files', () => {
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ packageManager: 'yarn@4.0.0' }))
    writeFileSync(join(cwd, 'pnpm-lock.yaml'), '')

    expect(detectPackageManager(cwd).name).toBe('yarn')
  })

  it('detects bun from its lock file', () => {
    writeFileSync(join(cwd, 'bun.lockb'), '')

    expect(detectPackageManager(cwd).name).toBe('bun')
  })

  it('falls back to npm when nothing is found', () => {
    expect(detectPackageManager(cwd).name).toBe('npm')
  })
})

describe('missingPluginDependencies', () => {
  const manifest = (name: string, extra: object = {}) => ({ kind: 'plugin' as const, name, export: 'plugin', displayName: name, description: '', ...extra })
  const ts = manifest('plugin-ts')
  const axios = manifest('plugin-axios', { dependencies: ['plugin-ts'], role: 'client' })
  const reactQuery = manifest('plugin-react-query', { dependencies: ['plugin-ts'], role: 'consumer' })
  const msw = manifest('plugin-msw', { dependencies: ['plugin-ts'], optionalDependencies: ['plugin-faker'] })

  it('passes a complete selection', () => {
    expect(missingPluginDependencies([ts, axios, reactQuery, msw])).toEqual([])
  })

  it('reports a missing dependency and a consumer without a client', () => {
    expect(missingPluginDependencies([reactQuery])).toEqual([
      'plugin-react-query needs plugin-ts.',
      'plugin-react-query needs a client plugin, such as plugin-axios or plugin-fetch.',
    ])
  })
})

describe('project detection', () => {
  let cwd: string

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'kubb-init-'))
  })

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  describe('findSpecFiles', () => {
    it('finds specs shallowest first and skips node_modules, dist, and folders past the depth', async () => {
      for (const dir of ['api', 'node_modules/pkg', 'dist', 'a/b/c/d']) mkdirSync(join(cwd, dir), { recursive: true })
      for (const file of [
        'openapi.yaml',
        'api/swagger.json',
        'api/petstore.yaml',
        'node_modules/pkg/openapi.yaml',
        'dist/openapi.json',
        'a/b/c/d/openapi.yml',
      ]) {
        writeFileSync(join(cwd, file), '')
      }

      expect(await findSpecFiles(cwd)).toStrictEqual(['./openapi.yaml', './api/swagger.json'])
    })

    it('stops at the limit', async () => {
      for (const name of ['openapi.a.yaml', 'openapi.b.yaml', 'openapi.c.yaml']) writeFileSync(join(cwd, name), '')

      expect(await findSpecFiles(cwd, { limit: 2 })).toStrictEqual(['./openapi.a.yaml', './openapi.b.yaml'])
    })
  })

  describe('readSpecInfo', () => {
    it('reads the version and counts the operations in a YAML spec', async () => {
      writeFileSync(
        join(cwd, 'openapi.yaml'),
        "openapi: '3.1.0'\npaths:\n  /pets:\n    get:\n      summary: List\n    post:\n      summary: Add\n  /pets/{id}:\n    delete:\n      summary: Remove\n",
      )

      expect(await readSpecInfo(join(cwd, 'openapi.yaml'))).toStrictEqual({ version: '3.1.0', operations: 3 })
    })

    it('reads the version and counts the operations in a JSON spec', async () => {
      const spec = { swagger: '2.0', paths: { '/pets': { get: {}, put: {} } } }
      writeFileSync(join(cwd, 'swagger.json'), JSON.stringify(spec, null, 2))

      expect(await readSpecInfo(join(cwd, 'swagger.json'))).toStrictEqual({ version: '2.0', operations: 2 })
    })

    it('leaves out the count when the spec is longer than the part it reads', async () => {
      writeFileSync(join(cwd, 'openapi.yaml'), `openapi: 3.0.3\npaths:\n${'  /x:\n    get:\n      summary: x\n'.repeat(20_000)}`)

      expect(await readSpecInfo(join(cwd, 'openapi.yaml'))).toStrictEqual({ version: '3.0.3', operations: undefined })
    })
  })

  describe('addGenerateScript', () => {
    it('adds the script and keeps the indentation', async () => {
      writeFileSync(join(cwd, 'package.json'), JSON.stringify({ name: 'app', scripts: { build: 'tsc' } }, null, 4))

      expect(await addGenerateScript(cwd)).toBe(true)
      expect(readFileSync(join(cwd, 'package.json'), 'utf-8')).toBe(
        `${JSON.stringify({ name: 'app', scripts: { build: 'tsc', generate: 'kubb generate' } }, null, 4)}\n`,
      )
    })

    it('never overwrites an existing generate script', async () => {
      const source = JSON.stringify({ scripts: { generate: 'orval' } })
      writeFileSync(join(cwd, 'package.json'), source)

      expect(await addGenerateScript(cwd)).toBe(false)
      expect(readFileSync(join(cwd, 'package.json'), 'utf-8')).toBe(source)
    })
  })
})

const official = (name: string, manifest: object = {}) =>
  ({ ...registryEntry({ name, version: '1.0.0', manifest }), id: `kubb-labs/${name}` }) as unknown as RegistryEntry
const plugins = [
  official('plugin-ts'),
  official('plugin-zod'),
  official('plugin-fetch', { role: 'client', dependencies: ['plugin-ts'] }),
  official('plugin-react-query', { role: 'consumer', dependencies: ['plugin-ts'] }),
]

describe('parsePluginsFlag', () => {
  it('accepts short names, slugs, and registry ids', () => {
    expect(parsePluginsFlag({ plugins, value: 'ts, plugin-zod,kubb-labs/plugin-fetch' }).map((entry) => entry.id)).toStrictEqual([
      'kubb-labs/plugin-ts',
      'kubb-labs/plugin-zod',
      'kubb-labs/plugin-fetch',
    ])
  })

  it('throws for a plugin that is not in the registry', () => {
    expect(() => parsePluginsFlag({ plugins, value: 'ts,nope' })).toThrow('Not in the Kubb registry: nope.')
  })
})
