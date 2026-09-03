import { Hookable, logLevel as logLevelMap } from '@kubb/core'
import type { AgentHooks } from '@kubb/studio'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installStudioLogger } from './logger.ts'

/**
 * Non-TTY is what these assert, so the logger takes its `console` writer and the output is plain
 * text with no clack gutter and no color. `canUseTTY()` reads `CI` from the environment, so the
 * environment is what gets stubbed rather than the module.
 */
function capture() {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})

  return {
    lines: () => log.mock.calls.map(([line]) => String(line)),
    errors: () => error.mock.calls.map(([line]) => String(line)),
  }
}

function install({ poolSize = 1, logLevel = logLevelMap.info }: { poolSize?: number; logLevel?: number } = {}) {
  const hooks = new Hookable<AgentHooks>()
  installStudioLogger(hooks, { logLevel, poolSize })

  return hooks
}

beforeEach(() => {
  vi.stubEnv('CI', '1')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('installStudioLogger', () => {
  it('leaves out the session tag when the agent serves a single session', async () => {
    const output = capture()
    const hooks = install({ poolSize: 1 })

    await hooks.callHook('studio:connected', { tag: 'brave-otter', studioUrl: 'http://localhost:3000' })

    expect(output.lines()).toStrictEqual(['Connected to http://localhost:3000'])
  })

  it('shows the session tag once there is more than one to tell apart', async () => {
    const output = capture()
    const hooks = install({ poolSize: 3 })

    await hooks.callHook('studio:connected', { tag: 'brave-otter', studioUrl: 'http://localhost:3000' })

    expect(output.lines()).toStrictEqual(['[brave-otter] Connected to http://localhost:3000'])
  })

  it('reports a command and what it did', async () => {
    const output = capture()
    const hooks = install()

    await hooks.callHook('studio:command:start', { tag: 'brave-otter', command: 'save' })
    await hooks.callHook('studio:command:end', { tag: 'brave-otter', command: 'save', info: 'applied 2/3 edits to kubb.config.ts' })

    expect(output.lines()).toStrictEqual(['Kubb Studio asked to save', 'Finished save (applied 2/3 edits to kubb.config.ts)'])
  })

  it('drops everything but errors at silent', async () => {
    const output = capture()
    const hooks = install({ logLevel: logLevelMap.silent })

    await hooks.callHook('studio:connected', { tag: 'brave-otter', studioUrl: 'http://localhost:3000' })
    await hooks.callHook('studio:command:start', { tag: 'brave-otter', command: 'generate' })
    await hooks.callHook('studio:warn', { tag: 'brave-otter', message: 'Ignored save' })

    expect(output.lines()).toStrictEqual([])

    // A failure stays visible, or the command exits without saying why.
    await hooks.callHook('studio:error', { tag: 'brave-otter', error: new Error('token revoked') })

    expect(output.errors()).toStrictEqual(['token revoked'])
  })

  it('stops the spinner on the first connect and writes the line on a reconnect', async () => {
    const output = capture()
    const spinner = { start: vi.fn(), stop: vi.fn(), message: vi.fn() }
    const hooks = new Hookable<AgentHooks>()
    installStudioLogger(hooks, { logLevel: logLevelMap.info, poolSize: 1, spinner: spinner as never })

    await hooks.callHook('studio:connected', { tag: 'brave-otter', studioUrl: 'http://localhost:3000' })

    expect(spinner.stop).toHaveBeenCalledWith('Connected to http://localhost:3000')
    expect(output.lines()).toStrictEqual([])

    // The spinner is spent, so a reconnect has to report itself in writing.
    await hooks.callHook('studio:connected', { tag: 'brave-otter', studioUrl: 'http://localhost:3000' })

    expect(spinner.stop).toHaveBeenCalledTimes(1)
    expect(output.lines()).toStrictEqual(['Connected to http://localhost:3000'])
  })
})
