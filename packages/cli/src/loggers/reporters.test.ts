import { stripVTControlCharacters } from 'node:util'
import { Hookable, cliReporter, type Config, jsonReporter, type KubbHooks, logLevel } from '@kubb/core'
import { describe, expect, it, vi } from 'vitest'
import * as agent from '../agent.ts'
import * as env from '../utils/env.ts'
import setupReporters from './reporters.ts'

describe('setupReporters', () => {
  it('lets json own stdout without installing the live logger when json is selected', async () => {
    const context = new Hookable<KubbHooks>()

    setupReporters(context, { logLevel: logLevel.info, reporters: [jsonReporter] })

    expect(context.listenerCount('kubb:hook:line')).toBe(0)
    expect(context.listenerCount('kubb:generation:end')).toBeGreaterThan(0)
  })

  /**
   * A usable terminal outside CI, so only the agent decides which logger `isRichOutput` picks.
   */
  function withInteractiveStdout(): Disposable {
    const { isTTY, columns } = process.stdout
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true, configurable: true })
    Object.defineProperty(process.stdout, 'columns', { value: 80, writable: true, configurable: true })
    vi.stubEnv('CI', '')
    vi.stubEnv('GITHUB_ACTIONS', '')

    return {
      [Symbol.dispose]() {
        Object.defineProperty(process.stdout, 'isTTY', { value: isTTY, writable: true, configurable: true })
        Object.defineProperty(process.stdout, 'columns', { value: columns, writable: true, configurable: true })
        vi.unstubAllEnvs()
      },
    }
  }

  /**
   * Both loggers open a group, but only the plain one writes it with `console.log`: clack draws
   * straight to the stream. Colors are stripped, since the stubbed terminal makes `styleText` emit them.
   */
  async function renderGroup() {
    const context = new Hookable<KubbHooks>()
    const lines: Array<string> = []
    using _log = vi.spyOn(console, 'log').mockImplementation((line = '') => void lines.push(stripVTControlCharacters(String(line))))

    setupReporters(context, { logLevel: logLevel.info, reporters: [cliReporter] })
    await context.callHook('kubb:generation:start', {
      config: { name: 'petstore', root: '/tmp', output: { path: 'src/gen' }, plugins: [] } as unknown as Config,
    })

    return lines
  }

  it.each([
    { agentName: 'claude', plain: true, label: 'an AI agent is detected' },
    { agentName: undefined, plain: false, label: 'no AI agent is detected' },
  ])('installs the plain logger: $plain when a TTY is available and $label', async ({ agentName, plain }) => {
    using _stdout = withInteractiveStdout()
    using _agent = vi.spyOn(agent, 'getAgentName').mockReturnValue(agentName)

    expect((await renderGroup()).includes('petstore')).toBe(plain)
  })
})

describe('studio session events', () => {
  /**
   * A `kubb studio` connection emits `studio:*` on the same emitter as its generations, so the
   * loggers `kubb generate` installs render the whole command. Non-TTY here, so `plainLogger`
   * answers and the output is plain text.
   */
  async function render(emit: (context: Hookable<KubbHooks>) => Promise<void> | void, level: number = logLevel.info) {
    using _rich = vi.spyOn(env, 'isRichOutput').mockReturnValue(false)
    const context = new Hookable<KubbHooks>()
    const lines: Array<string> = []
    using _log = vi.spyOn(console, 'log').mockImplementation((line) => void lines.push(String(line)))

    setupReporters(context, { logLevel: level, reporters: [cliReporter] })
    await emit(context)

    return lines
  }

  it('names both sides on connect, so a version mismatch is visible', async () => {
    const lines = await render((context) =>
      context.callHook('studio:connected', { url: 'http://localhost:3000', versions: { studio: '5.1.0', kubb: '5.0.6', agent: '5.0.6' } }),
    )

    expect(lines).toStrictEqual(['✓ Connected to http://localhost:3000 (v5.0.6, Studio v5.1.0)'])
  })

  it('reports readiness once Studio confirms registration', async () => {
    const lines = await render((context) => context.callHook('studio:ready', {}))

    expect(lines).toStrictEqual(['✓ Ready to receive jobs'])
  })

  it('reports a command and what it did', async () => {
    const lines = await render(async (context) => {
      await context.callHook('studio:command:start', { command: 'save' })
      await context.callHook('studio:command:end', { command: 'save', info: 'applied 2/3 edits to kubb.config.ts' })
    })

    expect(lines).toStrictEqual(['Kubb Studio asked to save', '✓ Finished save (applied 2/3 edits to kubb.config.ts)', '✓ Ready to receive jobs'])
  })

  it('announces a retry instead of leaving the runtime to print it', async () => {
    const lines = await render((context) => context.callHook('studio:reconnecting', { delayMs: 30_000 }))

    expect(lines).toStrictEqual(['Retrying connection to Kubb Studio in 30.00s'])
  })

  it('names the flag that grants a refused permission', async () => {
    const lines = await render((context) =>
      context.callHook('studio:warn', { message: 'Ignored save: editing kubb.config.ts was not granted', permission: 'allowConfigEdit' }),
    )

    expect(lines).toStrictEqual(['⚠ Ignored save: editing kubb.config.ts was not granted; pass --allow-config-edit to allow it'])
  })

  it('drops everything but errors at silent', async () => {
    const lines = await render(async (context) => {
      await context.callHook('studio:connecting', { url: 'http://localhost:3000' })
      await context.callHook('studio:warn', { message: 'Ignored save' })
      // A failure stays visible, or the command exits without saying why.
      await context.callHook('studio:error', { error: new Error('token revoked') })
    }, logLevel.silent)

    expect(lines).toStrictEqual(['✗ token revoked'])
  })
})
