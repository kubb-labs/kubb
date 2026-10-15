import { describe, expect, it } from 'vitest'
import type { GenerationResult } from '../createReporter.ts'
import { Diagnostics } from '../Diagnostics.ts'
import type { Config } from '../types.ts'
import { buildReport } from './report.ts'

describe('buildReport', () => {
  const result: GenerationResult = {
    config: { name: 'petstore', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}, {}] } as unknown as Config,
    diagnostics: [
      {
        code: 'KUBB_REF_NOT_FOUND',
        severity: 'error',
        message: 'missing Pet',
        help: 'add it',
        plugin: '@kubb/plugin-zod',
        location: { kind: 'schema', pointer: '#/components/schemas/Pet' },
      },
      { code: 'KUBB_UNSUPPORTED_FORMAT', severity: 'warning', message: 'unknown format' },
      Diagnostics.performance({ plugin: '@kubb/plugin-ts', duration: 12 }),
      Diagnostics.performance({ plugin: '@kubb/plugin-zod', duration: 88 }),
    ],
    filesCreated: 3,
    status: 'failed',
    hrStart: process.hrtime(),
  }

  it('normalizes plugin, issue, and timing data shared by every reporter, timings slowest first and problems only', () => {
    const report = buildReport(result)

    expect(report.name).toBe('petstore')
    expect(report.status).toBe('failed')
    expect(report.plugins).toStrictEqual({ passed: 1, failed: ['@kubb/plugin-zod'], total: 2 })
    expect(report.counts).toStrictEqual({ errors: 1, warnings: 1, infos: 0 })
    expect(report.filesCreated).toBe(3)
    expect(report.output).toMatch(/src\/gen$/)
    expect(typeof report.durationMs).toBe('number')
    expect(report.timings).toStrictEqual([
      { plugin: '@kubb/plugin-zod', durationMs: 88 },
      { plugin: '@kubb/plugin-ts', durationMs: 12 },
    ])
    expect(report.diagnostics).toHaveLength(2)
    expect(report.diagnostics[0]).toMatchObject({ code: 'KUBB_REF_NOT_FOUND', plugin: '@kubb/plugin-zod', location: { pointer: '#/components/schemas/Pet' } })
    expect(report.diagnostics[0]?.docsUrl).toMatch(/\/diagnostics#kubb-ref-not-found$/)
  })

  it('counts no plugin as passed when the run failed before any plugin ran', () => {
    const report = buildReport({ ...result, diagnostics: [{ code: 'KUBB_INVALID_PLUGIN_OPTIONS', severity: 'error', message: 'plugins[0] is a function' }] })

    expect(report.plugins).toStrictEqual({ passed: 0, failed: [], total: 2 })
  })
})
