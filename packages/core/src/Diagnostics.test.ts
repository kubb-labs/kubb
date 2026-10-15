import { stripVTControlCharacters } from 'node:util'
import { describe, expect, it } from 'vitest'
import { type Diagnostic, type DiagnosticFormatOptions, Diagnostics, type ProblemDiagnostic } from './Diagnostics.ts'
import { Hookable } from './Hookable.ts'
import type { KubbHooks } from './types.ts'

const problem = (over: Partial<ProblemDiagnostic> = {}): ProblemDiagnostic => ({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'boom', ...over })

describe('Diagnostics.docsUrl', () => {
  it('slugifies the code into a kubb.dev docs link', () => {
    expect(Diagnostics.docsUrl('KUBB_REF_NOT_FOUND')).toMatch(/^https:\/\/kubb\.dev\/docs\/\d+\.x\/reference\/diagnostics#kubb-ref-not-found$/)
  })
})

describe('Diagnostics.explain', () => {
  it.each(Object.values(Diagnostics.code))('documents %s with a title, cause and fix', (code) => {
    const doc = Diagnostics.explain(code)

    expect(doc.title).toBeTruthy()
    expect(doc.cause).toBeTruthy()
    expect(doc.fix).toBeTruthy()
  })
})

describe('Diagnostics.serialize', () => {
  it('keeps the JSON-safe fields, adds the catalog entry and a docsUrl, and turns the cause into messages', () => {
    const serialized = Diagnostics.serialize(
      problem({ help: 'fix it', plugin: '@kubb/plugin-zod', location: { kind: 'schema', pointer: '#/components/schemas/Pet' }, cause: new Error('root') }),
    )

    expect(serialized).toStrictEqual({
      code: 'KUBB_REF_NOT_FOUND',
      severity: 'error',
      message: 'boom',
      title: Diagnostics.explain('KUBB_REF_NOT_FOUND').title,
      cause: Diagnostics.explain('KUBB_REF_NOT_FOUND').cause,
      help: 'fix it',
      plugin: '@kubb/plugin-zod',
      location: { kind: 'schema', pointer: '#/components/schemas/Pet' },
      causes: ['root'],
      docsUrl: Diagnostics.docsUrl('KUBB_REF_NOT_FOUND'),
    })
  })

  it('falls back to the catalog fix when the diagnostic has no help, except for info', () => {
    expect(Diagnostics.serialize(problem()).help).toBe(Diagnostics.explain('KUBB_REF_NOT_FOUND').fix)
    expect(Diagnostics.serialize(problem({ code: 'KUBB_PLUGIN_INFO', severity: 'info' })).help).toBeUndefined()
  })

  it('lists the cause chain without the messages already in `message`, and adds the root stack for a crash', () => {
    const root = new TypeError('x is undefined')
    const wrapped = new Error('Config failed loading', { cause: root })

    const crash = Diagnostics.serialize(problem({ code: 'KUBB_PLUGIN_FAILED', message: 'Config failed loading', cause: wrapped }))
    expect(crash.causes).toStrictEqual(['TypeError: x is undefined'])
    expect(crash.stack).toBe(root.stack)

    expect(Diagnostics.serialize(problem({ cause: wrapped })).stack).toBeUndefined()
  })

  it('omits the docsUrl for the unknown fallback code', () => {
    expect(Diagnostics.serialize(problem({ code: 'KUBB_UNKNOWN' })).docsUrl).toBeUndefined()
  })
})

describe('Diagnostics.from', () => {
  it('returns the structured diagnostic, with help and plugin, from a DiagnosticError', () => {
    const diagnostic = { code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing', help: 'fix the ref', plugin: '@kubb/plugin-zod' } as const

    expect(Diagnostics.from(new Diagnostics.Error(diagnostic))).toStrictEqual(diagnostic)
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

  it.each([
    ['a plain error', new Error('boom'), 'boom'],
    ['a non-error thrown value', 'oops', 'oops'],
  ])('returns KUBB_UNKNOWN for %s', (_name, thrown, message) => {
    expect(Diagnostics.from(thrown)).toMatchObject({ code: 'KUBB_UNKNOWN', severity: 'error', message })
  })

  it('should surface the root cause message, not the wrapper, for a wrapped unknown error', () => {
    const root = new Error('plugin blew up')
    const wrapped = new Error('Error in async listener for "kubb:plugin:start"', { cause: root })

    const diagnostic = Diagnostics.from(wrapped)
    expect(diagnostic).toMatchObject({ code: 'KUBB_UNKNOWN', message: 'plugin blew up' })
    expect(diagnostic.cause).toBe(root)
  })

  it('returns the innermost coded error, where the problem started', () => {
    const inner = new Diagnostics.Error({ code: 'KUBB_INVALID_PLUGIN_OPTIONS', severity: 'error', message: 'inner' })
    const outer = new Diagnostics.Error({ code: 'KUBB_UNKNOWN', severity: 'error', message: 'Config failed loading', cause: inner })

    expect(Diagnostics.from(outer)).toMatchObject({ code: 'KUBB_INVALID_PLUGIN_OPTIONS', message: 'inner' })
  })

  it('points a crash thrown without a cause at itself, so its stack survives', () => {
    const error = new Diagnostics.Error({ code: 'KUBB_PLUGIN_FAILED', severity: 'error', message: 'invariant broken' })

    expect(Diagnostics.serialize(Diagnostics.from(error)).stack).toBe(error.stack)
    expect(Diagnostics.from(new Diagnostics.Error({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'x' })).cause).toBeUndefined()
  })

  it('should not loop on a self-referencing cause', () => {
    const error = new Error('boom') as Error & { cause: unknown }
    error.cause = error

    expect(Diagnostics.from(error).code).toBe('KUBB_UNKNOWN')
  })
})

describe('Diagnostics.fromExtension', () => {
  const extension = { meta: { name: 'plugin-acme', issues: 'https://github.com/acme/plugin/issues' } }

  it('reports a plugin crash as KUBB_PLUGIN_FAILED with the plugin and its issue tracker', () => {
    const cause = new Error('boom')

    expect(Diagnostics.fromExtension(cause, { kind: 'plugin', extension })).toStrictEqual({
      code: 'KUBB_PLUGIN_FAILED',
      severity: 'error',
      message: 'boom',
      cause,
      plugin: 'plugin-acme',
      issues: 'https://github.com/acme/plugin/issues',
    })
  })

  it('adds the issue tracker to a *_FAILED code the extension throws itself', () => {
    const error = new Diagnostics.Error({ code: 'KUBB_PLUGIN_FAILED', severity: 'error', message: 'invariant broken' })

    expect(Diagnostics.fromExtension(error, { kind: 'plugin', extension })).toMatchObject({
      code: 'KUBB_PLUGIN_FAILED',
      message: 'invariant broken',
      plugin: 'plugin-acme',
      issues: 'https://github.com/acme/plugin/issues',
    })
  })

  it('names an adapter or parser in the message, not in `plugin`, so it is not counted as a failed plugin', () => {
    const adapter = Diagnostics.fromExtension(new Error('boom'), { kind: 'adapter', extension: { name: 'oas' } })
    const parser = Diagnostics.fromExtension(new Error('boom'), { kind: 'parser', extension: { name: 'typescript' } })

    expect(adapter).toMatchObject({ code: 'KUBB_ADAPTER_FAILED', message: 'adapter "oas" crashed: boom' })
    expect(parser).toMatchObject({ code: 'KUBB_PARSER_FAILED', message: 'parser "typescript" crashed: boom' })
    expect(adapter).not.toHaveProperty('plugin')
    expect(adapter).not.toHaveProperty('issues')
  })

  it('keeps the code of a structured error and adds no issue link', () => {
    const error = new Diagnostics.Error({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing' })

    expect(Diagnostics.fromExtension(error, { kind: 'plugin', extension })).toStrictEqual({ ...error.diagnostic, plugin: 'plugin-acme' })
  })

  it('does not treat an abort as a crash', () => {
    const abort = new DOMException('aborted', 'AbortError')

    expect(Diagnostics.fromExtension(abort, { kind: 'adapter', extension })).toMatchObject({ code: 'KUBB_UNKNOWN' })
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

// styleText respects NO_COLOR/non-TTY, so assert on the plain text the parts contain.
describe('Diagnostics.format', () => {
  /** An error with a fixed stack, so the snapshots do not depend on where the test runs. */
  const withStack = (error: Error, frames: Array<string>) =>
    Object.assign(error, { stack: [`${error.name}: ${error.message}`, ...frames.map((frame) => `    at ${frame}`)].join('\n') })

  const cases: Array<[string, Diagnostic]> = [
    [
      'a coded problem with location and help',
      {
        code: 'KUBB_REF_NOT_FOUND',
        severity: 'error',
        message: 'Could not find #/components/schemas/Owner',
        plugin: 'plugin-ts',
        location: { kind: 'schema', pointer: '#/components/schemas/Pet/properties/owner' },
        help: 'Add the missing definition under components.schemas, or fix the $ref.',
      },
    ],
    [
      'a plugin crash with a cause chain',
      {
        code: 'KUBB_PLUGIN_FAILED',
        severity: 'error',
        message: 'While generating operation "listPets" (GET /pets): Cannot read name',
        plugin: 'plugin-zod',
        location: { kind: 'operation', pointer: '#/paths/~1pets/get' },
        issues: 'https://github.com/acme/plugin-zod/issues',
        cause: new Error('Cannot read name', { cause: withStack(new TypeError('node.schema is undefined'), ['print (zod.ts:12:3)', 'run (zod.ts:40:9)']) }),
      },
    ],
    ['an unknown error', { code: 'KUBB_UNKNOWN', severity: 'error', message: 'boom', cause: withStack(new Error('boom'), ['config (kubb.config.ts:3:9)']) }],
    [
      'a warning',
      {
        code: 'KUBB_UNSUPPORTED_FORMAT',
        severity: 'warning',
        message: 'Format "money" falls back to string',
        plugin: 'plugin-ts',
        location: { kind: 'schema', pointer: '#/components/schemas/Order/properties/total' },
      },
    ],
  ]

  const render = (diagnostic: Diagnostic, options: DiagnosticFormatOptions) => stripVTControlCharacters(Diagnostics.formatLines(diagnostic, options).join('\n'))

  it.each(cases)('renders %s for an agent', (_label, diagnostic) => {
    expect(render(diagnostic, { audience: 'agent' })).toMatchSnapshot()
  })

  it.each(cases)('renders %s for a human', (_label, diagnostic) => {
    expect(render(diagnostic, { audience: 'human', width: 80 })).toMatchSnapshot()
  })

  it('shows the full stack to a human only when verbose', () => {
    const [, crash] = cases[1]!

    expect(render(crash, { audience: 'human', width: 80 })).not.toContain('at run (zod.ts:40:9)')
    expect(render(crash, { audience: 'human', width: 80, verbose: true })).toContain('at run (zod.ts:40:9)')
  })

  it('keeps the code on the first line of a multi-line message for both audiences', () => {
    const multiLine: Diagnostic = { code: 'KUBB_INVALID_DOCUMENT', severity: 'error', message: 'Cannot parse at line 7, column 1:\n\n  /pets: [unclosed\n^' }

    expect(render(multiLine, { audience: 'agent' }).split('\n').slice(0, 3)).toStrictEqual([
      'error KUBB_INVALID_DOCUMENT: Cannot parse at line 7, column 1:',
      '    /pets: [unclosed',
      '  ^',
    ])
    expect(render(multiLine, { audience: 'human', width: 80 }).split('\n')[0]).toMatch(/^✖ Cannot parse at line 7, column 1: +KUBB_INVALID_DOCUMENT$/)
  })

  it('keeps an agent block free of escape codes even when color is on', () => {
    const [, coded] = cases[0]!

    expect(Diagnostics.formatLines(coded).join('\n')).toBe(render(coded, { audience: 'agent' }))
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

describe('Diagnostics.emit', () => {
  it('sends an unknown problem with its own message and help to kubb:error, keeping the cause', async () => {
    const hooks = new Hookable<KubbHooks>()
    const errors: Array<Error> = []
    hooks.hook('kubb:error', ({ error }) => void errors.push(error))
    const root = new Error('boom')

    await Diagnostics.emit(hooks, { code: 'KUBB_UNKNOWN', severity: 'error', message: 'Config failed loading: kubb.config.ts', help: 'Fix it.', cause: root })
    await Diagnostics.emit(hooks, { code: 'KUBB_UNKNOWN', severity: 'error', message: 'boom', cause: root })

    expect(errors[0]).toMatchObject({ message: 'Config failed loading: kubb.config.ts', diagnostic: { help: 'Fix it.' }, cause: root })
    expect(errors[1]).toBe(root)
  })
})
