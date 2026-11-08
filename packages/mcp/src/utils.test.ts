import { type Diagnostic, Diagnostics } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { formatDiagnostics } from './utils.ts'

describe('formatDiagnostics', () => {
  it('renders the agent block from Diagnostics.format without ANSI styling', () => {
    const diagnostic: Diagnostic = {
      code: 'KUBB_REF_NOT_FOUND',
      severity: 'error',
      message: 'missing Pet',
      plugin: '@kubb/adapter-oas',
      location: { kind: 'schema', pointer: '#/components/schemas/Pet' },
      help: 'add it',
    }

    expect(formatDiagnostics([diagnostic])).toBe(
      [
        'error KUBB_REF_NOT_FOUND [@kubb/adapter-oas]: missing Pet',
        '  at: #/components/schemas/Pet',
        `  why: ${Diagnostics.explain('KUBB_REF_NOT_FOUND').cause}`,
        '  fix: add it',
        `  docs: ${Diagnostics.docsUrl('KUBB_REF_NOT_FOUND')}`,
      ].join('\n'),
    )
  })

  it('renders the underlying errors and the report link, separating entries with a blank line', () => {
    const crash: Diagnostic = {
      code: 'KUBB_PLUGIN_FAILED',
      severity: 'error',
      message: 'boom',
      cause: new Error('boom', { cause: new TypeError('x is undefined') }),
      issues: 'https://github.com/example/plugin/issues',
    }
    const output = formatDiagnostics([crash, { code: 'KUBB_UNKNOWN', severity: 'error', message: 'second' }])

    expect(output).toContain('  caused by: TypeError: x is undefined')
    expect(output).toContain('  report: https://github.com/example/plugin/issues')
    expect(output).toContain('\n\nerror KUBB_UNKNOWN: second')
  })
})
