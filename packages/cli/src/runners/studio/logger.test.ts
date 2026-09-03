import { Hookable, logLevel as logLevelMap } from '@kubb/core'
import type { AgentHooks } from '@kubb/studio'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installStudioLogger } from './logger.ts'

/**
 * Non-TTY is what these assert, so the logger takes its `console` writer and the output is plain
 * text with no clack gutter and no color. `isRichOutput()` reads `CI` from the environment, so the
 * environment is what gets stubbed rather than the module.
 */
function capture() {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})

  return () => log.mock.calls.map(([line]) => String(line))
}

function install({ logLevel = logLevelMap.info, spinner }: { logLevel?: number; spinner?: never } = {}) {
  const hooks = new Hookable<AgentHooks>()
  installStudioLogger(hooks, { logLevel, spinner })

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
  it('reports a command and what it did', async () => {
    const lines = capture()
    const hooks = install()

    await hooks.callHook('studio:command:start', { command: 'save' })
    await hooks.callHook('studio:command:end', { command: 'save', info: 'applied 2/3 edits to kubb.config.ts' })

    expect(lines()).toStrictEqual(['Kubb Studio asked to save', 'Finished save (applied 2/3 edits to kubb.config.ts)'])
  })

  it('drops everything but errors at silent', async () => {
    const lines = capture()
    const hooks = install({ logLevel: logLevelMap.silent })

    await hooks.callHook('studio:connected', { studioUrl: 'http://localhost:3000' })
    await hooks.callHook('studio:command:start', { command: 'generate' })
    await hooks.callHook('studio:warn', { message: 'Ignored save' })

    expect(lines()).toStrictEqual([])

    // A failure stays visible, or the command exits without saying why.
    await hooks.callHook('studio:error', { error: new Error('token revoked') })

    expect(lines()).toStrictEqual(['token revoked'])
  })

  it('stops the spinner on the first connect and writes the line on a reconnect', async () => {
    const lines = capture()
    const spinner = { start: vi.fn(), stop: vi.fn(), message: vi.fn() }
    const hooks = new Hookable<AgentHooks>()
    installStudioLogger(hooks, { logLevel: logLevelMap.info, spinner: spinner as never })

    await hooks.callHook('studio:connected', { studioUrl: 'http://localhost:3000' })

    expect(spinner.stop).toHaveBeenCalledWith('Connected to http://localhost:3000')
    expect(lines()).toStrictEqual([])

    // The spinner is spent, so a reconnect has to report itself in writing.
    await hooks.callHook('studio:connected', { studioUrl: 'http://localhost:3000' })

    expect(spinner.stop).toHaveBeenCalledTimes(1)
    expect(lines()).toStrictEqual(['Connected to http://localhost:3000'])
  })
})
