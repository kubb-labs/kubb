import { x } from 'tinyexec'
import { describe, expect, it, vi } from 'vitest'
import { installPackages, packageManagers } from './utils.ts'

vi.mock('tinyexec', () => ({ x: vi.fn() }))

describe('installPackages', () => {
  it('keeps the package manager output off the terminal and puts the end of it in the error when the install fails', async () => {
    vi.mocked(x).mockResolvedValueOnce({ exitCode: 0, stdout: 'Progress: resolved 3', stderr: '' } as Awaited<ReturnType<typeof x>>)
    await expect(installPackages(['@kubb/plugin-zod@5.4.8'], packageManagers.pnpm, '/repo')).resolves.toBeUndefined()
    expect(x).toHaveBeenCalledWith('pnpm', [...packageManagers.pnpm.installCommand, '@kubb/plugin-zod@5.4.8'], {
      nodeOptions: { cwd: '/repo', stdio: ['ignore', 'pipe', 'pipe'] },
      timeout: 5 * 60_000,
      throwOnError: false,
    })

    vi.mocked(x).mockResolvedValueOnce({ exitCode: 1, stdout: 'Progress: resolved 3', stderr: 'ERR_PNPM_FETCH_404 Not Found' } as Awaited<ReturnType<typeof x>>)
    await expect(installPackages(['@kubb/plugin-nope'], packageManagers.pnpm, '/repo')).rejects.toThrow(
      /failed with exit code 1:\nProgress: resolved 3\nERR_PNPM_FETCH_404 Not Found$/,
    )
  })
})
