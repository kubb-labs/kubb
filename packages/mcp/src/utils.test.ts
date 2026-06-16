import type { SerializedDiagnostic } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { formatDiagnostics } from './utils.ts'

describe('formatDiagnostics', () => {
  it('renders code, pointer, fix, and see as a tree for an agent without ANSI styling', () => {
    const diagnostic: SerializedDiagnostic = {
      code: 'KUBB_REF_NOT_FOUND',
      severity: 'error',
      message: 'missing Pet',
      plugin: '@kubb/adapter-oas',
      location: { kind: 'schema', pointer: '#/components/schemas/Pet' },
      help: 'add it',
      docsUrl: 'https://kubb.dev/docs/5.x/reference/diagnostics/kubb-ref-not-found',
    }

    const output = formatDiagnostics([diagnostic])

    expect(output).toBe(
      [
        '[KUBB_REF_NOT_FOUND] @kubb/adapter-oas: missing Pet',
        '├▶ at: #/components/schemas/Pet',
        '├▶ fix: add it',
        '╰▶ see: https://kubb.dev/docs/5.x/reference/diagnostics/kubb-ref-not-found',
      ].join('\n'),
    )
  })

  it('drops absent fields and uses the bare code when no plugin is set', () => {
    expect(formatDiagnostics([{ code: 'KUBB_UNKNOWN', severity: 'error', message: 'boom' }])).toBe('[KUBB_UNKNOWN]: boom')
  })
})
