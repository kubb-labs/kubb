import { describe, expect, it } from 'vitest'
import { type Diagnostic, Diagnostics, type ProblemDiagnostic } from './Diagnostics.ts'

const problem = (over: Partial<ProblemDiagnostic> = {}): ProblemDiagnostic => ({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'boom', ...over })

describe('Diagnostics.docsUrl', () => {
  it('slugifies the code into a kubb.dev docs link', () => {
    expect(Diagnostics.docsUrl('KUBB_REF_NOT_FOUND')).toMatch(/^https:\/\/kubb\.dev\/docs\/\d+\.x\/reference\/diagnostics\/kubb-ref-not-found$/)
  })
})

describe('Diagnostics.explain', () => {
  it('documents every code with a title, cause, and fix', () => {
    for (const code of Object.values(Diagnostics.code)) {
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
    const error = new Diagnostics.Error({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing' })

    expect(Diagnostics.from(error)).toMatchObject({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing' })
  })

  it('should carry help and plugin through a DiagnosticError', () => {
    const error = new Diagnostics.Error({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing', help: 'fix the ref', plugin: '@kubb/plugin-zod' })

    expect(Diagnostics.from(error)).toMatchObject({ help: 'fix the ref', plugin: '@kubb/plugin-zod' })
  })

  it('should unwrap a DiagnosticError nested in the cause chain', () => {
    const inner = new Diagnostics.Error({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing' })
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

describe('Diagnostics.isError', () => {
  it('recognizes a locally thrown DiagnosticError', () => {
    expect(Diagnostics.isError(new Diagnostics.Error({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing' }))).toBe(true)
  })

  it('recognizes a DiagnosticError from a duplicated core copy through the shared brand', () => {
    // A different `@kubb/core` copy fails `instanceof` but sets the same `Symbol.for` brand.
    const foreign = { [Symbol.for('@kubb/core/diagnostics/error')]: true }

    expect(Diagnostics.isError(foreign)).toBe(true)
  })

  it('recognizes a DiagnosticError structurally when it predates the brand', () => {
    // An older duplicated copy carries no brand, only the `name` and a `diagnostic` with a code.
    const foreign = Object.assign(new Error('missing'), {
      name: 'DiagnosticError',
      diagnostic: { code: 'KUBB_INPUT_NOT_FOUND', severity: 'error', message: 'missing' },
    })

    expect(Diagnostics.isError(foreign)).toBe(true)
  })

  it('rejects a plain error', () => {
    expect(Diagnostics.isError(new Error('boom'))).toBe(false)
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

describe('Diagnostics.narrow', () => {
  it('returns the variant for a matching code and null otherwise', () => {
    const update = Diagnostics.update({ currentVersion: '5.0.0', latestVersion: '5.1.0' })

    expect(Diagnostics.narrow(update, Diagnostics.code.updateAvailable)).toBe(update)
    expect(Diagnostics.narrow(update, Diagnostics.code.refNotFound)).toBeNull()
  })

  it('narrows a problem by its specific code', () => {
    const diagnostic = problem()

    expect(Diagnostics.narrow(diagnostic, Diagnostics.code.refNotFound)).toBe(diagnostic)
    expect(Diagnostics.narrow(diagnostic, Diagnostics.code.performance)).toBeNull()
  })
})

describe('diagnostic kind guards', () => {
  it('narrows by kind, treating a missing kind as a problem', () => {
    const performance = Diagnostics.performance({ plugin: 'a', duration: 5 })
    const update = Diagnostics.update({ currentVersion: '5.0.0', latestVersion: '5.1.0' })

    expect(Diagnostics.isProblem(problem())).toBe(true)
    expect(Diagnostics.isProblem(performance)).toBe(false)
    expect(Diagnostics.isPerformance(performance)).toBe(true)
    expect(Diagnostics.isUpdate(update)).toBe(true)
    expect(Diagnostics.isUpdate(performance)).toBe(false)
  })
})

describe('Diagnostics.update', () => {
  it('builds an info update notice carrying both versions', () => {
    const diagnostic = Diagnostics.update({ currentVersion: '5.0.0', latestVersion: '5.1.0' })

    expect(diagnostic).toMatchObject({ kind: 'update', code: 'KUBB_UPDATE_AVAILABLE', severity: 'info', currentVersion: '5.0.0', latestVersion: '5.1.0' })
    expect(diagnostic.message).toContain('v5.0.0 → v5.1.0')
  })
})

// styleText respects NO_COLOR/non-TTY, so assert on the plain text the parts contain.
describe('Diagnostics.format', () => {
  it('splits a diagnostic into a headline and tree details', () => {
    const { headline, details } = Diagnostics.format({
      code: 'KUBB_REF_NOT_FOUND',
      severity: 'error',
      message: 'boom',
      help: 'fix the ref',
      location: { kind: 'schema', pointer: '#/components/schemas/Pet' },
    })

    expect(headline).toContain('[KUBB_REF_NOT_FOUND]')
    expect(headline).toContain('boom')
    expect(details.some((line) => line.includes('at: #/components/schemas/Pet'))).toBe(true)
    expect(details.some((line) => line.includes('fix: fix the ref'))).toBe(true)
    expect(details.some((line) => line.includes('see: https://kubb.dev'))).toBe(true)
  })

  it('puts the plugin after the code in the headline', () => {
    expect(Diagnostics.format({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'boom', plugin: '@kubb/plugin-zod' }).headline).toContain(
      '@kubb/plugin-zod:',
    )
  })

  it('omits the see line for KUBB_UNKNOWN', () => {
    expect(Diagnostics.format({ code: 'KUBB_UNKNOWN', severity: 'error', message: 'boom' }).details.some((line) => line.includes('see:'))).toBe(false)
  })
})

describe('Diagnostics.formatLines', () => {
  it('renders a self-contained tree block with the code on the header', () => {
    const [header] = Diagnostics.formatLines({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'Could not find Pet' })

    expect(header).toContain('[KUBB_REF_NOT_FOUND]')
    expect(header).toContain('Could not find Pet')
  })

  it('renders an update notice as a line with the version message', () => {
    const [header] = Diagnostics.formatLines(Diagnostics.update({ currentVersion: '5.0.0', latestVersion: '5.1.0' }))

    expect(header).toContain('KUBB_UPDATE_AVAILABLE')
    expect(header).toContain('v5.0.0 → v5.1.0')
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
