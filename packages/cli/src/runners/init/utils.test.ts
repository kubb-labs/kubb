import { x } from 'tinyexec'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { initPackageJson, installPackages } from './utils.ts'
import type { PackageManagerInfo } from '../../tools.ts'

vi.mock('tinyexec', () => ({
  x: vi.fn(),
}))

describe('packageManager', () => {
  afterEach(() => vi.resetAllMocks())

  describe('initPackageJson', () => {
    it.each<{ pm: PackageManagerInfo; expectedArgs: Array<string> }>([
      {
        pm: {
          name: 'npm',
          lockFiles: ['package-lock.json'],
          installCommand: ['install'],
        },
        expectedArgs: ['init', '-y'],
      },
      {
        pm: {
          name: 'pnpm',
          lockFiles: ['pnpm-lock.yaml'],
          installCommand: ['install'],
        },
        expectedArgs: ['init'],
      },
      {
        pm: { name: 'yarn', lockFiles: ['yarn.lock'], installCommand: ['add'] },
        expectedArgs: ['init', '-y'],
      },
      {
        pm: { name: 'bun', lockFiles: ['bun.lockb'], installCommand: ['add'] },
        expectedArgs: ['init', '-y'],
      },
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
