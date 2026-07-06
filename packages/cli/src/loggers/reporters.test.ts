import { AsyncEventEmitter, cliReporter, type Config, fileReporter, jsonReporter, type KubbHooks, logLevel, type Storage } from '@kubb/core'
import { describe, expect, it, vi } from 'vitest'
import setupReporters, { installReporter } from './utils.ts'

describe('jsonReporter', () => {
  it('writes one JSON array for every config on lifecycle end', async () => {
    const context = new AsyncEventEmitter<KubbHooks>()
    const writes: Array<string> = []
    using _ = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      writes.push(String(chunk))
      return true
    })

    await setupReporters(context, { logLevel: logLevel.info, reporters: [jsonReporter] })

    await context.emit('kubb:generation:end', {
      config: { name: 'petstore', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}] } as unknown as Config,
      storage: {} as Storage,
      diagnostics: [{ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing Pet', plugin: '@kubb/plugin-zod' }],
      filesCreated: 3,
      status: 'failed',
      hrStart: process.hrtime(),
    })
    await context.emit('kubb:generation:end', {
      config: { name: 'orders', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}] } as unknown as Config,
      storage: {} as Storage,
      diagnostics: [],
      filesCreated: 5,
      status: 'success',
      hrStart: process.hrtime(),
    })
    await context.emit('kubb:lifecycle:end')

    const reports = JSON.parse(writes.join(''))
    expect(reports).toHaveLength(2)
    expect(reports[0]).toMatchObject({ name: 'petstore', status: 'failed', counts: { errors: 1 } })
    expect(reports[1]).toMatchObject({ name: 'orders', status: 'success' })
  })
})

describe('cliReporter', () => {
  it('renders the summary per config', async () => {
    const context = new AsyncEventEmitter<KubbHooks>()
    const logs: Array<string> = []
    using _ = vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.join(' '))
    })

    installReporter(context, cliReporter, { logLevel: logLevel.info })

    await context.emit('kubb:generation:end', {
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
    const context = new AsyncEventEmitter<KubbHooks>()
    const logs: Array<string> = []
    using _ = vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.join(' '))
    })

    installReporter(context, cliReporter, { logLevel: logLevel.silent })

    await context.emit('kubb:generation:end', {
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
    const context = new AsyncEventEmitter<KubbHooks>()

    await setupReporters(context, { logLevel: logLevel.info, reporters: [jsonReporter] })

    expect(context.listenerCount('kubb:hook:line')).toBe(0)
    expect(context.listenerCount('kubb:generation:end')).toBeGreaterThan(0)
  })

  it('wires the file reporter to the generation event', async () => {
    const context = new AsyncEventEmitter<KubbHooks>()

    await setupReporters(context, { logLevel: logLevel.info, reporters: [fileReporter] })

    expect(context.listenerCount('kubb:generation:end')).toBeGreaterThan(0)
  })
})
