import fs from 'node:fs'
import { x } from 'tinyexec'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hasPackageJson, initPackageJson, installPackages } from './utils.ts'
import type { PackageManagerInfo } from "../../tools.ts"

vi.mock('node:fs', () => ({
  default: { existsSync: vi.fn() },
}))

vi.mock('tinyexec', () => ({
  x: vi.fn(),
}))

describe('packageManager', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.resetAllMocks())

  describe('hasPackageJson', () => {
    it.each([
      { exists: true, expected: true },
      { exists: false, expected: false },
    ])('returns $expected when existsSync returns $exists', ({ exists, expected }) => {
      vi.mocked(fs.existsSync).mockReturnValue(exists)
      expect(hasPackageJson('/test/dir')).toBe(expected)
    })

    it('uses process.cwd() as default cwd', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      hasPackageJson()
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('package.json'))
    })
  })

  describe('initPackageJson', () => {
    it.each<{ pm: PackageManagerInfo; expectedArgs: Array<string> }>([
      {
        pm: {
          name: 'npm',
          lockFile: 'package-lock.json',
          installCommand: ['install'],
        },
        expectedArgs: ['init', '-y'],
      },
      {
        pm: {
          name: 'pnpm',
          lockFile: 'pnpm-lock.yaml',
          installCommand: ['install'],
        },
        expectedArgs: ['init'],
      },
      {
        pm: { name: 'yarn', lockFile: 'yarn.lock', installCommand: ['add'] },
        expectedArgs: ['init', '-y'],
      },
      {
        pm: { name: 'bun', lockFile: 'bun.lockb', installCommand: ['add'] },
        expectedArgs: ['init', '-y'],
      },
    ])('runs $pm.name $expectedArgs', async ({ pm, expectedArgs }) => {
      vi.mocked(x).mockReturnValue(Promise.resolve() as never)
      await initPackageJson('/tmp/project', pm)
      expect(x).toHaveBeenCalledWith(pm.name, expectedArgs, expect.objectContaining({ nodeOptions: expect.objectContaining({ cwd: '/tmp/project' }) }))
    })

    it('rejects when the command fails', async () => {
      vi.mocked(x).mockImplementation(() => Promise.reject(new Error('Process exited with non-zero status (1)')) as never)
      const pm: PackageManagerInfo = {
        name: 'npm',
        lockFile: 'package-lock.json',
        installCommand: ['install'],
      }
      await expect(initPackageJson('/tmp/project', pm)).rejects.toThrow('Process exited with non-zero status')
    })
  })

  describe('installPackages', () => {
    it('runs the install command with package names', async () => {
      vi.mocked(x).mockReturnValue(Promise.resolve() as never)
      const pm: PackageManagerInfo = {
        name: 'pnpm',
        lockFile: 'pnpm-lock.yaml',
        installCommand: ['add'],
      }
      await installPackages(['kubb', '@kubb/plugin-ts'], pm, '/tmp/project')
      expect(x).toHaveBeenCalledWith(
        'pnpm',
        ['add', 'kubb', '@kubb/plugin-ts'],
        expect.objectContaining({ nodeOptions: expect.objectContaining({ cwd: '/tmp/project' }) }),
      )
    })

    it('uses process.cwd() as default cwd', async () => {
      vi.mocked(x).mockReturnValue(Promise.resolve() as never)
      const pm: PackageManagerInfo = {
        name: 'npm',
        lockFile: 'package-lock.json',
        installCommand: ['install'],
      }
      await installPackages(['kubb'], pm)
      expect(x).toHaveBeenCalledWith('npm', ['install', 'kubb'], expect.objectContaining({ nodeOptions: expect.objectContaining({ cwd: process.cwd() }) }))
    })

    it('rejects when the command fails', async () => {
      vi.mocked(x).mockImplementation(() => Promise.reject(new Error('Process exited with non-zero status (2)')) as never)
      const pm: PackageManagerInfo = {
        name: 'pnpm',
        lockFile: 'pnpm-lock.yaml',
        installCommand: ['add'],
      }
      await expect(installPackages(['kubb'], pm)).rejects.toThrow('Process exited with non-zero status')
    })
  })
})
