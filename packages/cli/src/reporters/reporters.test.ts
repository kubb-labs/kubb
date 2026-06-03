import { AsyncEventEmitter } from '@internals/utils'
import { type Config, type KubbHooks, logLevel } from '@kubb/core'
import { describe, expect, it, vi } from 'vitest'
import { setupReporters } from '../loggers/utils.ts'
import { installJsonReporter } from './jsonReporter.ts'

describe('installJsonReporter', () => {
  it('writes the accumulated report to stdout on lifecycle:end', async () => {
    const context = new AsyncEventEmitter<KubbHooks>()
    const writes: Array<string> = []
    using _ = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      writes.push(String(chunk))
      return true
    })

    installJsonReporter(context)

    await context.emit('kubb:generation:summary', {
      config: {} as Config,
      diagnostics: [{ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing Pet' }],
      filesCreated: 3,
      status: 'failed',
      hrStart: process.hrtime(),
    })
    await context.emit('kubb:lifecycle:end')

    const report = JSON.parse(writes.join(''))
    expect(report.status).toBe('failed')
    expect(report.summary).toMatchObject({ errors: 1, files: 3 })
  })
})

describe('setupReporters', () => {
  it('returns no terminal sink and lets json own stdout when json is selected', async () => {
    const context = new AsyncEventEmitter<KubbHooks>()

    const sink = await setupReporters(context, { logLevel: logLevel.info, reporters: ['json'] })

    expect(sink).toBeNull()
    expect(context.listenerCount('kubb:lifecycle:end')).toBeGreaterThan(0)
  })

  it('wires the file reporter to lifecycle, diagnostic, and plugin events', async () => {
    const context = new AsyncEventEmitter<KubbHooks>()

    await setupReporters(context, { logLevel: logLevel.info, reporters: ['file'] })

    expect(context.listenerCount('kubb:diagnostic')).toBeGreaterThan(0)
    expect(context.listenerCount('kubb:plugin:start')).toBeGreaterThan(0)
    expect(context.listenerCount('kubb:generation:end')).toBeGreaterThan(0)
  })
})
