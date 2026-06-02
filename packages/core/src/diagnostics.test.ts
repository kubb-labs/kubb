import { describe, expect, it } from 'vitest'
import { DiagnosticError, toDiagnostic } from './diagnostics.ts'

describe('toDiagnostic', () => {
  it('should return the structured diagnostic from a DiagnosticError', () => {
    const error = new DiagnosticError({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing' })

    expect(toDiagnostic(error)).toMatchObject({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing' })
  })

  it('should carry help and plugin through a DiagnosticError', () => {
    const error = new DiagnosticError({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing', help: 'fix the ref', plugin: '@kubb/plugin-zod' })

    expect(toDiagnostic(error)).toMatchObject({ help: 'fix the ref', plugin: '@kubb/plugin-zod' })
  })

  it('should unwrap a DiagnosticError nested in the cause chain', () => {
    const inner = new DiagnosticError({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing' })
    const wrapped = new Error('listener failed', { cause: inner })

    expect(toDiagnostic(wrapped).code).toBe('KUBB_REF_NOT_FOUND')
  })

  it('should fall back to KUBB_UNKNOWN for a plain error', () => {
    expect(toDiagnostic(new Error('boom'))).toMatchObject({ code: 'KUBB_UNKNOWN', severity: 'error', message: 'boom' })
  })

  it('should not loop on a self-referencing cause', () => {
    const error = new Error('boom') as Error & { cause: unknown }
    error.cause = error

    expect(toDiagnostic(error).code).toBe('KUBB_UNKNOWN')
  })
})
