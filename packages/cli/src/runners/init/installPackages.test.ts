import { x } from 'tinyexec'
import { describe, expect, it, vi } from 'vitest'
import { installPackages } from './utils.ts'

vi.mock('tinyexec', () => ({ x: vi.fn() }))

const pnpm = { name: 'pnpm', agent: 'pnpm' } as const

const proc = (exitCode: number, lines: Array<string>) =>
  Object.assign(
    (async function* () {
      yield* lines
    })(),
    { exitCode },
  ) as unknown as ReturnType<typeof x>

describe('installPackages', () => {
  it('streams the package manager output to the caller and puts the end of it in the error when the install fails', async () => {
    const onLine = vi.fn()
    vi.mocked(x).mockReturnValueOnce(proc(0, ['Progress: resolved 3', 'Done']))
    await expect(installPackages(['@kubb/plugin-zod@5.4.8'], pnpm, '/repo', onLine)).resolves.toBeUndefined()
    expect(x).toHaveBeenCalledWith('pnpm', ['add', '-D', '@kubb/plugin-zod@5.4.8'], {
      nodeOptions: { cwd: '/repo', stdio: ['ignore', 'pipe', 'pipe'] },
      timeout: 5 * 60_000,
      throwOnError: false,
    })
    expect(onLine.mock.calls.flat()).toStrictEqual(['Progress: resolved 3', 'Done'])

    vi.mocked(x).mockReturnValueOnce(proc(1, ['Progress: resolved 3', 'ERR_PNPM_FETCH_404 Not Found']))
    await expect(installPackages(['@kubb/plugin-nope'], pnpm, '/repo')).rejects.toThrow(
      /failed with exit code 1:\nProgress: resolved 3\nERR_PNPM_FETCH_404 Not Found$/,
    )
  })
})
