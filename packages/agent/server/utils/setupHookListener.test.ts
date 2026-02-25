import type { KubbEvents } from '@kubb/core'
import { AsyncEventEmitter } from '@kubb/core/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setupHookListener } from './setupHookListener.ts'

vi.mock('tinyexec', () => ({
  x: vi.fn(),
}))

import { x } from 'tinyexec'

describe('setupHookListener', () => {
  let events: AsyncEventEmitter<KubbEvents>

  beforeEach(() => {
    events = new AsyncEventEmitter<KubbEvents>()
    vi.clearAllMocks()
  })

  afterEach(() => {
    events.removeAll()
  })

  it('skips execution when hook:start fires without an id', async () => {
    setupHookListener(events, '/root')

    await events.emit('hook:start', { id: undefined as any, command: 'echo', args: [] })

    expect(x).not.toHaveBeenCalled()
  })

  it('emits hook:end with success when command succeeds', async () => {
    vi.mocked(x).mockResolvedValue({ stdout: 'output\n', stderr: '', exitCode: 0 } as any)

    setupHookListener(events, '/root')

    const hookEndSpy = vi.fn()
    events.on('hook:end', hookEndSpy)

    await events.emit('hook:start', { id: 'test-id', command: 'echo', args: ['hello'] })

    expect(hookEndSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'test-id', command: 'echo', args: ['hello'], success: true, error: null }))
  })

  it('emits hook:end with failure and emits error when command throws', async () => {
    vi.mocked(x).mockRejectedValue(new Error('command not found'))

    setupHookListener(events, '/root')

    const hookEndSpy = vi.fn()
    const errorSpy = vi.fn()
    events.on('hook:end', hookEndSpy)
    events.on('error', errorSpy)

    await events.emit('hook:start', { id: 'fail-id', command: 'nonexistent', args: [] })

    expect(hookEndSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'fail-id', success: false, error: expect.any(Error) }))
    expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({ message: 'Hook execute failed: nonexistent' }))
  })

  it('includes args in the error message when command with args fails', async () => {
    vi.mocked(x).mockRejectedValue(new Error('failed'))

    setupHookListener(events, '/root')

    const errorSpy = vi.fn()
    events.on('error', errorSpy)

    await events.emit('hook:start', { id: 'id-1', command: 'npm', args: ['run', 'build'] })

    expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({ message: 'Hook execute failed: npm run build' }))
  })

  it('passes the root as cwd to tinyexec', async () => {
    vi.mocked(x).mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 } as any)

    setupHookListener(events, '/my/project/root')

    await events.emit('hook:start', { id: 'id-2', command: 'npm', args: ['run', 'lint'] })

    expect(x).toHaveBeenCalledWith('npm', ['run', 'lint'], expect.objectContaining({ nodeOptions: expect.objectContaining({ cwd: '/my/project/root' }) }))
  })

  it('logs stdout from the executed command', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.mocked(x).mockResolvedValue({ stdout: 'build success\n', stderr: '', exitCode: 0 } as any)

    setupHookListener(events, '/root')

    await events.emit('hook:start', { id: 'id-3', command: 'npm', args: ['run', 'build'] })

    expect(consoleSpy).toHaveBeenCalledWith('build success')

    consoleSpy.mockRestore()
  })
})
