import { describe, expect, it } from 'vitest'
import { diagnosticCode } from './constants.ts'
import {
  type Diagnostic,
  DiagnosticError,
  Diagnostics,
  isPerformanceDiagnostic,
  isProblemDiagnostic,
  isUpdateDiagnostic,
  narrowDiagnostic,
} from './diagnostics.ts'

const problem = (over: Partial<Diagnostic> = {}): Diagnostic => ({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'boom', ...over })

describe('Diagnostics.docsUrl', () => {
  it('slugifies the code into a kubb.dev docs link', () => {
    expect(Diagnostics.docsUrl('KUBB_REF_NOT_FOUND')).toMatch(/^https:\/\/kubb\.dev\/docs\/\d+\.x\/diagnostics\/kubb-ref-not-found$/)
  })
})

describe('Diagnostics.explain', () => {
  it('documents every code with a title, cause, and fix', () => {
    for (const code of Object.values(diagnosticCode)) {
      const doc = Diagnostics.explain(code)
      expect(doc.title).toBeTruthy()
      expect(doc.cause).toBeTruthy()
      expect(doc.fix).toBeTruthy()
    }
  })
})

describe('Diagnostics.serialize', () => {
  it('keeps the JSON-safe fields and adds a docsUrl, dropping the cause', () => {
    const serialized = Diagnostics.serialize(
      problem({ help: 'fix it', plugin: '@kubb/plugin-zod', location: { kind: 'schema', pointer: '#/components/schemas/Pet' }, cause: new Error('root') }),
    )

    expect(serialized).toStrictEqual({
      code: 'KUBB_REF_NOT_FOUND',
      severity: 'error',
      message: 'boom',
      help: 'fix it',
      plugin: '@kubb/plugin-zod',
      location: { kind: 'schema', pointer: '#/components/schemas/Pet' },
      docsUrl: Diagnostics.docsUrl('KUBB_REF_NOT_FOUND'),
    })
  })

  it('omits the docsUrl for the unknown fallback code', () => {
    expect(Diagnostics.serialize(problem({ code: 'KUBB_UNKNOWN' })).docsUrl).toBeUndefined()
  })
})

describe('Diagnostics.from', () => {
  it('should return the structured diagnostic from a DiagnosticError', () => {
    const error = new DiagnosticError({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing' })

    expect(Diagnostics.from(error)).toMatchObject({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing' })
  })

  it('should carry help and plugin through a DiagnosticError', () => {
    const error = new DiagnosticError({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing', help: 'fix the ref', plugin: '@kubb/plugin-zod' })

    expect(Diagnostics.from(error)).toMatchObject({ help: 'fix the ref', plugin: '@kubb/plugin-zod' })
  })

  it('should unwrap a DiagnosticError nested in the cause chain', () => {
    const inner = new DiagnosticError({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing' })
    const wrapped = new Error('listener failed', { cause: inner })

    expect(Diagnostics.from(wrapped).code).toBe('KUBB_REF_NOT_FOUND')
  })

  it('recognizes a DiagnosticError from a duplicated core copy structurally', () => {
    // A different `@kubb/core` copy produces a DiagnosticError that fails `instanceof` but
    // still carries its `diagnostic`. Simulate one with a plain Error of the same shape.
    const foreign = Object.assign(new Error('missing'), {
      name: 'DiagnosticError',
      diagnostic: { code: 'KUBB_INPUT_NOT_FOUND', severity: 'error', message: 'missing' },
    })

    expect(Diagnostics.from(foreign).code).toBe('KUBB_INPUT_NOT_FOUND')
  })

  it('should fall back to KUBB_UNKNOWN for a plain error', () => {
    expect(Diagnostics.from(new Error('boom'))).toMatchObject({ code: 'KUBB_UNKNOWN', severity: 'error', message: 'boom' })
  })

  it('should surface the root cause message, not the wrapper, for a wrapped unknown error', () => {
    const root = new Error('plugin blew up')
    const wrapped = new Error('Error in async listener for "kubb:plugin:start"', { cause: root })

    const diagnostic = Diagnostics.from(wrapped)
    expect(diagnostic).toMatchObject({ code: 'KUBB_UNKNOWN', message: 'plugin blew up' })
    expect(diagnostic.cause).toBe(root)
  })

  it('should coerce a non-error thrown value', () => {
    expect(Diagnostics.from('oops')).toMatchObject({ code: 'KUBB_UNKNOWN', severity: 'error', message: 'oops' })
  })

  it('should not loop on a self-referencing cause', () => {
    const error = new Error('boom') as Error & { cause: unknown }
    error.cause = error

    expect(Diagnostics.from(error).code).toBe('KUBB_UNKNOWN')
  })
})

describe('Diagnostics.count', () => {
  it('counts problems by severity and ignores performance', () => {
    const counts = Diagnostics.count([
      problem(),
      problem({ severity: 'warning' }),
      problem({ severity: 'info' }),
      Diagnostics.performance({ plugin: 'a', duration: 5 }),
    ])

    expect(counts).toStrictEqual({ errors: 1, warnings: 1, infos: 1 })
  })
})

describe('narrowDiagnostic', () => {
  it('returns the variant for a matching code and null otherwise', () => {
    const update = Diagnostics.update({ currentVersion: '5.0.0', latestVersion: '5.1.0' })

    expect(narrowDiagnostic(update, diagnosticCode.updateAvailable)).toBe(update)
    expect(narrowDiagnostic(update, diagnosticCode.refNotFound)).toBeNull()
  })

  it('narrows a problem by its specific code', () => {
    const diagnostic = problem()

    expect(narrowDiagnostic(diagnostic, diagnosticCode.refNotFound)).toBe(diagnostic)
    expect(narrowDiagnostic(diagnostic, diagnosticCode.performance)).toBeNull()
  })
})

describe('diagnostic kind guards', () => {
  it('narrows by kind, treating a missing kind as a problem', () => {
    const performance = Diagnostics.performance({ plugin: 'a', duration: 5 })
    const update = Diagnostics.update({ currentVersion: '5.0.0', latestVersion: '5.1.0' })

    expect(isProblemDiagnostic(problem())).toBe(true)
    expect(isProblemDiagnostic(performance)).toBe(false)
    expect(isPerformanceDiagnostic(performance)).toBe(true)
    expect(isUpdateDiagnostic(update)).toBe(true)
    expect(isUpdateDiagnostic(performance)).toBe(false)
  })
})

describe('Diagnostics.update', () => {
  it('builds an info update notice carrying both versions', () => {
    const diagnostic = Diagnostics.update({ currentVersion: '5.0.0', latestVersion: '5.1.0' })

    expect(diagnostic).toMatchObject({ kind: 'update', code: 'KUBB_UPDATE_AVAILABLE', severity: 'info', currentVersion: '5.0.0', latestVersion: '5.1.0' })
    expect(diagnostic.message).toContain('v5.0.0 → v5.1.0')
  })
})

describe('Diagnostics.dedupe', () => {
  it('drops problems sharing code + pointer + plugin, keeps every performance record', () => {
    const loc = { kind: 'schema', pointer: '#/components/schemas/Pet' } as const
    const result = Diagnostics.dedupe([
      problem({ location: loc, plugin: 'a' }),
      problem({ location: loc, plugin: 'a' }),
      problem({ location: loc, plugin: 'b' }),
      Diagnostics.performance({ plugin: 'a', duration: 1 }),
      Diagnostics.performance({ plugin: 'a', duration: 2 }),
    ])

    // one per (a) and (b), plus both performance records
    expect(result).toHaveLength(4)
  })
})

describe('Diagnostics.scope / Diagnostics.report', () => {
  it('routes reported diagnostics to the active sink and returns true', () => {
    const collected: Array<Diagnostic> = []
    const reported = Diagnostics.scope(
      (diagnostic) => collected.push(diagnostic),
      () => Diagnostics.report(problem()),
    )

    expect(reported).toBe(true)
    expect(collected).toHaveLength(1)
  })

  it('returns false when there is no active run', () => {
    expect(Diagnostics.report(problem())).toBe(false)
  })
})
