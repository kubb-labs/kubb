import { Hookable } from 'kubb/kit'
import type { AgentHooks } from '../types.ts'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setupHookListener } from './setupHookListener.ts'

vi.mock('tinyexec', () => ({
  x: vi.fn(),
}))

import { x } from 'tinyexec'

type FakeProcOptions = {
  lines?: Array<string>
  exitCode?: number
  stdout?: string
  stderr?: string
}

/**
 * Builds a stand-in for tinyexec's `Result`: an object that is both async-iterable over
 * stdout lines and awaitable to the final `{ stdout, stderr, exitCode }` output.
 */
function fakeProc({ lines = [], exitCode = 0, stdout = '', stderr = '' }: FakeProcOptions = {}) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const line of lines) {
        yield line
      }
    },
    then(onFulfilled: (value: { stdout: string; stderr: string; exitCode: number }) => unknown) {
      return Promise.resolve({ stdout, stderr, exitCode }).then(onFulfilled)
    },
  }
}

describe('setupHookListener', () => {
  let hooks: Hookable<AgentHooks>

  beforeEach(() => {
    hooks = new Hookable<AgentHooks>()
    vi.clearAllMocks()
  })

  afterEach(() => {
    hooks.removeAllHooks()
  })

  it('skips execution when hook:start fires without an id', async () => {
    setupHookListener(hooks, '/root')

    await hooks.callHook('kubb:hook:start', { id: undefined as any, command: 'echo', args: [] })

    expect(x).not.toHaveBeenCalled()
  })

  it('emits hook:end with success when command exits zero', async () => {
    vi.mocked(x).mockReturnValue(fakeProc({ lines: ['output'], exitCode: 0 }) as any)

    setupHookListener(hooks, '/root')

    const hookEndSpy = vi.fn()
    hooks.hook('kubb:hook:end', hookEndSpy)

    await hooks.callHook('kubb:hook:start', { id: 'test-id', command: 'echo', args: ['hello'] })

    expect(hookEndSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'test-id', command: 'echo', args: ['hello'], success: true, error: null }))
  })

  it('streams each stdout line as a hook:line event', async () => {
    vi.mocked(x).mockReturnValue(fakeProc({ lines: ['first', 'second'], exitCode: 0 }) as any)

    setupHookListener(hooks, '/root')

    const lineSpy = vi.fn()
    hooks.hook('kubb:hook:line', lineSpy)

    await hooks.callHook('kubb:hook:start', { id: 'stream-id', command: 'oxlint', args: [] })

    expect(lineSpy).toHaveBeenNthCalledWith(1, { id: 'stream-id', line: 'first' })
    expect(lineSpy).toHaveBeenNthCalledWith(2, { id: 'stream-id', line: 'second' })
  })

  it('emits hook:end failure and an error on non-zero exit', async () => {
    vi.mocked(x).mockReturnValue(fakeProc({ lines: ['boom'], exitCode: 1, stdout: 'boom', stderr: 'parse error' }) as any)

    setupHookListener(hooks, '/root')

    const hookEndSpy = vi.fn()
    const errorSpy = vi.fn()
    hooks.hook('kubb:hook:end', hookEndSpy)
    hooks.hook('kubb:error', errorSpy)

    await hooks.callHook('kubb:hook:start', { id: 'fail-id', command: 'oxlint', args: ['--fix'] })

    expect(hookEndSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'fail-id', success: false, error: expect.any(Error) }))
    expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({ error: expect.objectContaining({ message: 'Hook execute failed: oxlint --fix' }) }))
  })

  it('emits hook:end failure and error when spawning throws', async () => {
    vi.mocked(x).mockImplementation(() => {
      throw new Error('command not found')
    })

    setupHookListener(hooks, '/root')

    const hookEndSpy = vi.fn()
    const errorSpy = vi.fn()
    hooks.hook('kubb:hook:end', hookEndSpy)
    hooks.hook('kubb:error', errorSpy)

    await hooks.callHook('kubb:hook:start', { id: 'throw-id', command: 'nonexistent', args: [] })

    expect(hookEndSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'throw-id', success: false, error: expect.any(Error) }))
    expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({ error: expect.objectContaining({ message: 'Hook execute failed: nonexistent' }) }))
  })

  it('passes the root as cwd to tinyexec', async () => {
    vi.mocked(x).mockReturnValue(fakeProc({ exitCode: 0 }) as any)

    setupHookListener(hooks, '/my/project/root')

    await hooks.callHook('kubb:hook:start', { id: 'cwd-id', command: 'npm', args: ['run', 'lint'] })

    expect(x).toHaveBeenCalledWith('npm', ['run', 'lint'], expect.objectContaining({ nodeOptions: expect.objectContaining({ cwd: '/my/project/root' }) }))
  })
})
