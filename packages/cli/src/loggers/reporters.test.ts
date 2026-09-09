import { Hookable, cliReporter, type Config, fileReporter, jsonReporter, type KubbHooks, logLevel, type Storage } from '@kubb/core'
import { describe, expect, it, vi } from 'vitest'
import * as agent from '../agent.ts'
import * as env from '../utils/env.ts'
import setupReporters, { installReporter } from './utils.ts'

describe('jsonReporter', () => {
  it('writes one JSON array for every config on lifecycle end', async () => {
    const context = new Hookable<KubbHooks>()
    const writes: Array<string> = []
    using _ = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      writes.push(String(chunk))
      return true
    })

    await setupReporters(context, { logLevel: logLevel.info, reporters: [jsonReporter] })

    await context.callHook('kubb:generation:end', {
      config: { name: 'petstore', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}] } as unknown as Config,
      storage: {} as Storage,
      diagnostics: [{ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing Pet', plugin: '@kubb/plugin-zod' }],
      filesCreated: 3,
      status: 'failed',
      hrStart: process.hrtime(),
    })
    await context.callHook('kubb:generation:end', {
      config: { name: 'orders', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}] } as unknown as Config,
      storage: {} as Storage,
      diagnostics: [],
      filesCreated: 5,
      status: 'success',
      hrStart: process.hrtime(),
    })
    await context.callHook('kubb:lifecycle:end')

    const reports = JSON.parse(writes.join(''))
    expect(reports).toHaveLength(2)
    expect(reports[0]).toMatchObject({ name: 'petstore', status: 'failed', counts: { errors: 1 } })
    expect(reports[1]).toMatchObject({ name: 'orders', status: 'success' })
  })
})

describe('cliReporter', () => {
  it('renders the summary per config', async () => {
    const context = new Hookable<KubbHooks>()
    const logs: Array<string> = []
    using _ = vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.join(' '))
    })

    installReporter(context, cliReporter, { logLevel: logLevel.info })

    await context.callHook('kubb:generation:end', {
      config: { name: 'petstore', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}, {}] } as unknown as Config,
      storage: {} as Storage,
      diagnostics: [],
      filesCreated: 12,
      status: 'success',
      hrStart: process.hrtime(),
    })

    const output = logs.join('\n')
    expect(output).toContain('petstore')
    expect(output).toContain('2 passed (2)')
    expect(output).toContain('12 generated')
  })

  it('renders nothing at silent', async () => {
    const context = new Hookable<KubbHooks>()
    const logs: Array<string> = []
    using _ = vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.join(' '))
    })

    installReporter(context, cliReporter, { logLevel: logLevel.silent })

    await context.callHook('kubb:generation:end', {
      config: { name: 'petstore', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}] } as unknown as Config,
      storage: {} as Storage,
      diagnostics: [],
      filesCreated: 1,
      status: 'success',
      hrStart: process.hrtime(),
    })

    expect(logs).toHaveLength(0)
  })
})

describe('setupReporters', () => {
  it('lets json own stdout without installing the live logger when json is selected', async () => {
    const context = new Hookable<KubbHooks>()

    await setupReporters(context, { logLevel: logLevel.info, reporters: [jsonReporter] })

    expect(context.listenerCount('kubb:hook:line')).toBe(0)
    expect(context.listenerCount('kubb:generation:end')).toBeGreaterThan(0)
  })

  it('wires the file reporter to the generation hook', async () => {
    const context = new Hookable<KubbHooks>()

    await setupReporters(context, { logLevel: logLevel.info, reporters: [fileReporter] })

    expect(context.listenerCount('kubb:generation:end')).toBeGreaterThan(0)
  })

  it('installs the plain logger instead of the interactive one when an AI agent is detected', async () => {
    using _tty = vi.spyOn(env, 'canUseTTY').mockReturnValue(true)
    using _agent = vi.spyOn(agent, 'getAgentName').mockReturnValue('claude')
    const context = new Hookable<KubbHooks>()

    await setupReporters(context, { logLevel: logLevel.info, reporters: [cliReporter] })

    // Only the clack logger streams hook output through `kubb:hook:line`.
    expect(context.listenerCount('kubb:hook:line')).toBe(0)
  })

  it('installs the interactive logger when no AI agent is detected and a TTY is available', async () => {
    using _tty = vi.spyOn(env, 'canUseTTY').mockReturnValue(true)
    using _agent = vi.spyOn(agent, 'getAgentName').mockReturnValue(undefined)
    const context = new Hookable<KubbHooks>()

    await setupReporters(context, { logLevel: logLevel.info, reporters: [cliReporter] })

    expect(context.listenerCount('kubb:hook:line')).toBeGreaterThan(0)
  })
})

describe('studio session events', () => {
  /**
   * A `kubb studio` connection emits `studio:*` on the same emitter as its generations, so the
   * loggers `kubb generate` installs render the whole command. Non-TTY here, so `plainLogger`
   * answers and the output is plain text.
   */
  async function render(emit: (context: Hookable<KubbHooks>) => Promise<void> | void, level: number = logLevel.info) {
    using _tty = vi.spyOn(env, 'canUseTTY').mockReturnValue(false)
    const context = new Hookable<KubbHooks>()
    const lines: Array<string> = []
    using _log = vi.spyOn(console, 'log').mockImplementation((line) => void lines.push(String(line)))

    await setupReporters(context, { logLevel: level, reporters: [cliReporter] })
    await emit(context)

    return lines
  }

  it('names both sides on connect, so a version mismatch is visible', async () => {
    const lines = await render((context) =>
      context.callHook('studio:connected', { url: 'http://localhost:3000', versions: { studio: '5.1.0', kubb: '5.0.6', agent: '5.0.6' } }),
    )

    expect(lines).toStrictEqual(['✓ Connected to http://localhost:3000 (v5.0.6, Studio v5.1.0)'])
  })

  it('reports a command and what it did', async () => {
    const lines = await render(async (context) => {
      await context.callHook('studio:command:start', { command: 'save' })
      await context.callHook('studio:command:end', { command: 'save', info: 'applied 2/3 edits to kubb.config.ts' })
    })

    expect(lines).toStrictEqual(['Kubb Studio asked to save', '✓ Finished save (applied 2/3 edits to kubb.config.ts)'])
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
