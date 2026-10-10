import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { x } from 'tinyexec'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { detectPackageManager, initPackageJson, installPackages, type PackageManagerInfo, packageManagers } from './utils.ts'

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

  describe('initPackageJson', () => {
    it.each<{ pm: PackageManagerInfo; expectedArgs: Array<string> }>([
      { pm: packageManagers.npm, expectedArgs: ['init', '-y'] },
      { pm: packageManagers.pnpm, expectedArgs: ['init'] },
      { pm: packageManagers.yarn, expectedArgs: ['init', '-y'] },
      { pm: packageManagers.bun, expectedArgs: ['init', '-y'] },
    ])('runs $pm.name $expectedArgs', async ({ pm, expectedArgs }) => {
      vi.mocked(x).mockReturnValue(Promise.resolve() as never)
      await initPackageJson('/tmp/project', pm)
      expect(x).toHaveBeenCalledWith(pm.name, expectedArgs, expect.objectContaining({ nodeOptions: expect.objectContaining({ cwd: '/tmp/project' }) }))
    })
  })

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
