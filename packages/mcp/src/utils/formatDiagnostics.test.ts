import type { SerializedDiagnostic } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { formatDiagnostics } from './formatDiagnostics.ts'

describe('formatDiagnostics', () => {
  it('renders code, pointer, help, and docs for an agent without ANSI styling', () => {
    const diagnostic: SerializedDiagnostic = {
      code: 'KUBB_REF_NOT_FOUND',
      severity: 'error',
      message: 'missing Pet',
      plugin: '@kubb/adapter-oas',
      location: { kind: 'schema', pointer: '#/components/schemas/Pet' },
      help: 'add it',
      docsUrl: 'https://kubb.dev/docs/5.x/diagnostics/kubb-ref-not-found',
    }

    const output = formatDiagnostics([diagnostic])

    expect(output).toBe(
      [
        'error @kubb/adapter-oas(KUBB_REF_NOT_FOUND): missing Pet',
        '  at #/components/schemas/Pet',
        '  help: add it',
        '  docs: https://kubb.dev/docs/5.x/diagnostics/kubb-ref-not-found',
      ].join('\n'),
    )
  })

  it('drops absent fields and uses the bare code when no plugin is set', () => {
    expect(formatDiagnostics([{ code: 'KUBB_UNKNOWN', severity: 'error', message: 'boom' }])).toBe('error KUBB_UNKNOWN: boom')
  })
})
