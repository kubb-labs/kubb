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

  it('prefers the packageManager field over lock files', async () => {
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ packageManager: 'yarn@4.0.0' }))
    writeFileSync(join(cwd, 'pnpm-lock.yaml'), '')

    expect(await detectPackageManager(cwd)).toMatchObject({ name: 'yarn', agent: 'yarn@berry' })
  })

  it('detects bun from its lock file', async () => {
    writeFileSync(join(cwd, 'bun.lockb'), '')

    expect((await detectPackageManager(cwd)).name).toBe('bun')
  })

  it('falls back to npm when nothing is found', async () => {
    expect((await detectPackageManager(cwd)).name).toBe('npm')
  })

  it('ignores a lock file in a parent folder', async () => {
    writeFileSync(join(cwd, 'pnpm-lock.yaml'), '')
    const project = join(cwd, 'app')
    mkdirSync(project)

    expect((await detectPackageManager(project)).name).toBe('npm')
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

    it('matches an uppercase extension', async () => {
      writeFileSync(join(cwd, 'OpenAPI.JSON'), '')

      expect(await findSpecFiles(cwd)).toStrictEqual(['./OpenAPI.JSON'])
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
  })

  describe('addGenerateScript', () => {
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
const plugins = [official('plugin-ts')]

describe('parsePluginsFlag', () => {
  it('throws for a plugin that is not in the registry', () => {
    expect(() => parsePluginsFlag({ plugins, value: 'ts,nope' })).toThrow('Not in the Kubb registry: nope.')
  })
})
