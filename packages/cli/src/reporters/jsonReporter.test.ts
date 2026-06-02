import { type Diagnostic, Diagnostics } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { buildJsonReport } from './jsonReporter.ts'

describe('buildJsonReport', () => {
  const diagnostics: Array<Diagnostic> = [
    {
      code: 'KUBB_REF_NOT_FOUND',
      severity: 'error',
      message: 'missing Pet',
      help: 'add it',
      plugin: '@kubb/plugin-zod',
      location: { kind: 'schema', pointer: '#/components/schemas/Pet' },
    },
    { code: 'KUBB_UNSUPPORTED_FORMAT', severity: 'warning', message: 'unknown format' },
    Diagnostics.timing({ plugin: '@kubb/plugin-ts', duration: 12 }),
  ]

  it('drops timing diagnostics and reports problem counts', () => {
    const report = buildJsonReport({ diagnostics, files: 4, durationMs: 100 })

    expect(report.status).toBe('failed')
    expect(report.summary).toStrictEqual({ errors: 1, warnings: 1, files: 4, durationMs: 100 })
    expect(report.diagnostics).toHaveLength(2)
    expect(report.diagnostics[0]).toMatchObject({ code: 'KUBB_REF_NOT_FOUND', plugin: '@kubb/plugin-zod', location: { pointer: '#/components/schemas/Pet' } })
    expect(report.diagnostics[0]?.docsUrl).toMatch(/\/diagnostics\/kubb-ref-not-found$/)
  })

  it('is success with no errors and serializes to stable JSON', () => {
    const report = buildJsonReport({ diagnostics: [{ code: 'KUBB_UNSUPPORTED_FORMAT', severity: 'warning', message: 'x' }], files: 1, durationMs: 5 })

    expect(report.status).toBe('success')
    expect(() => JSON.stringify(report)).not.toThrow()
  })
})
