import { spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import type { PackageManagerInfo } from '@internals/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hasPackageJson, initPackageJson, installPackages } from './packageManager.ts'

vi.mock('node:fs', () => ({
  default: { existsSync: vi.fn() },
}))

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}))

function makeChildProcess(closeCode: number | null = 0) {
  const child = new EventEmitter()
  setTimeout(() => child.emit('close', closeCode), 0)
  return child
}

function makeErrorChildProcess(error: Error) {
  const child = new EventEmitter()
  setTimeout(() => child.emit('error', error), 0)
  return child
}

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
    it.each<{ pm: PackageManagerInfo; expectedArgs: string[] }>([
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
      vi.mocked(spawn).mockReturnValue(makeChildProcess(0) as ReturnType<typeof spawn>)
      await initPackageJson('/tmp/project', pm)
      expect(spawn).toHaveBeenCalledWith(pm.name, expectedArgs, expect.objectContaining({ cwd: '/tmp/project' }))
    })

    it('rejects when the process exits with non-zero code', async () => {
      vi.mocked(spawn).mockReturnValue(makeChildProcess(1) as ReturnType<typeof spawn>)
      const pm: PackageManagerInfo = {
        name: 'npm',
        lockFile: 'package-lock.json',
        installCommand: ['install'],
      }
      await expect(initPackageJson('/tmp/project', pm)).rejects.toThrow('"npm init -y" was terminated by signal undefined')
    })

    it('rejects when spawn emits an error', async () => {
      vi.mocked(spawn).mockReturnValue(makeErrorChildProcess(new Error('spawn ENOENT')) as ReturnType<typeof spawn>)
      const pm: PackageManagerInfo = {
        name: 'npm',
        lockFile: 'package-lock.json',
        installCommand: ['install'],
      }
      await expect(initPackageJson('/tmp/project', pm)).rejects.toThrow('spawn ENOENT')
    })
  })

  describe('installPackages', () => {
    it('runs the install command with package names', async () => {
      vi.mocked(spawn).mockReturnValue(makeChildProcess(0) as ReturnType<typeof spawn>)
      const pm: PackageManagerInfo = {
        name: 'pnpm',
        lockFile: 'pnpm-lock.yaml',
        installCommand: ['add'],
      }
      await installPackages(['kubb', '@kubb/plugin-ts'], pm, '/tmp/project')
      expect(spawn).toHaveBeenCalledWith('pnpm', ['add', 'kubb', '@kubb/plugin-ts'], expect.objectContaining({ cwd: '/tmp/project' }))
    })

    it('uses process.cwd() as default cwd', async () => {
      vi.mocked(spawn).mockReturnValue(makeChildProcess(0) as ReturnType<typeof spawn>)
      const pm: PackageManagerInfo = {
        name: 'npm',
        lockFile: 'package-lock.json',
        installCommand: ['install'],
      }
      await installPackages(['kubb'], pm)
      expect(spawn).toHaveBeenCalledWith('npm', ['install', 'kubb'], expect.objectContaining({ cwd: process.cwd() }))
    })

    it('rejects when the process exits with non-zero code', async () => {
      vi.mocked(spawn).mockReturnValue(makeChildProcess(2) as ReturnType<typeof spawn>)
      const pm: PackageManagerInfo = {
        name: 'pnpm',
        lockFile: 'pnpm-lock.yaml',
        installCommand: ['add'],
      }
      await expect(installPackages(['kubb'], pm)).rejects.toThrow('"pnpm add kubb" was terminated by signal undefined')
    })
  })
})
