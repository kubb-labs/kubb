import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { x } from 'tinyexec'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { detectPackageManager, installPackages, missingPluginDependencies, type PackageManagerInfo } from './utils.ts'

vi.mock('tinyexec', () => ({
  x: vi.fn(),
}))

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

  it.each(['bun.lock', 'bun.lockb'])('detects bun from %s', (lockFile) => {
    writeFileSync(join(cwd, lockFile), '')

    expect(detectPackageManager(cwd).name).toBe('bun')
  })

  it('falls back to npm when nothing is found', () => {
    expect(detectPackageManager(cwd).name).toBe('npm')
  })
})

describe('packageManager', () => {
  afterEach(() => vi.resetAllMocks())

  describe('installPackages', () => {
    it('runs the install command with package names', async () => {
      vi.mocked(x).mockReturnValue(Promise.resolve() as never)
      const pm: PackageManagerInfo = {
        name: 'pnpm',
        lockFiles: ['pnpm-lock.yaml'],
        initCommand: ['init'],
        installCommand: ['add'],
      }
      await installPackages(['kubb', '@kubb/plugin-ts'], pm, '/tmp/project')
      expect(x).toHaveBeenCalledWith(
        'pnpm',
        ['add', 'kubb', '@kubb/plugin-ts'],
        expect.objectContaining({ nodeOptions: expect.objectContaining({ cwd: '/tmp/project' }) }),
      )
    })
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
