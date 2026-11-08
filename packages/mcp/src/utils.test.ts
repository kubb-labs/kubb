import type { Diagnostic } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { formatDiagnostics } from './utils.ts'

describe('formatDiagnostics', () => {
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
