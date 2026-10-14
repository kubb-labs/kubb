import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { detectPackageManager, missingPluginDependencies } from './utils.ts'

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
    expect(
      missingPluginDependencies({ selected: ['plugin-ts', 'plugin-axios', 'plugin-react-query', 'plugin-msw'], manifests: [ts, axios, reactQuery, msw] }),
    ).toEqual([])
  })

  it('reports a missing dependency and a consumer without a client', () => {
    expect(missingPluginDependencies({ selected: ['plugin-react-query'], manifests: [reactQuery] })).toEqual([
      'plugin-react-query needs plugin-ts.',
      'plugin-react-query needs a client plugin, such as plugin-axios or plugin-fetch.',
    ])
  })
})
