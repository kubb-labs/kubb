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

  it('normalizes plugin, issue, and timing data shared by every reporter', () => {
    const report = buildReport(result)

    expect(report.name).toBe('petstore')
    expect(report.status).toBe('failed')
    expect(report.plugins).toStrictEqual({ passed: 1, failed: ['@kubb/plugin-zod'], total: 2 })
    expect(report.counts).toStrictEqual({ errors: 1, warnings: 1, infos: 0 })
    expect(report.filesCreated).toBe(3)
    expect(report.output).toMatch(/src\/gen$/)
    expect(typeof report.durationMs).toBe('number')
  })

  it('lists timings slowest first and keeps only problem diagnostics', () => {
    const report = buildReport(result)

    expect(report.timings).toStrictEqual([
      { plugin: '@kubb/plugin-zod', durationMs: 88 },
      { plugin: '@kubb/plugin-ts', durationMs: 12 },
    ])
    expect(report.diagnostics).toHaveLength(2)
    expect(report.diagnostics[0]).toMatchObject({ code: 'KUBB_REF_NOT_FOUND', plugin: '@kubb/plugin-zod', location: { pointer: '#/components/schemas/Pet' } })
    expect(report.diagnostics[0]?.docsUrl).toMatch(/\/diagnostics\/kubb-ref-not-found$/)
  })
})
