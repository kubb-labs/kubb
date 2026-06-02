import { describe, expect, it } from 'vitest'
import { formatDiagnostic } from './diagnostics.ts'

// styleText respects NO_COLOR/non-TTY, so assert on the plain text the lines contain.
describe('formatDiagnostic', () => {
  it('renders a miette-style header with the code and message', () => {
    const [header] = formatDiagnostic({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'Could not find Pet' })

    expect(header).toContain('×')
    expect(header).toContain('KUBB_REF_NOT_FOUND')
    expect(header).toContain('Could not find Pet')
  })

  it('wraps the code in plugin(code) when a plugin is known', () => {
    const [header] = formatDiagnostic({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'boom', plugin: '@kubb/plugin-zod' })

    expect(header).toContain('@kubb/plugin-zod(')
  })

  it('adds an `at` line with the pointer when a location is known', () => {
    const lines = formatDiagnostic({
      code: 'KUBB_REF_NOT_FOUND',
      severity: 'error',
      message: 'boom',
      location: { kind: 'schema', pointer: '#/components/schemas/Pet' },
    })

    expect(lines.some((line) => line.includes('at #/components/schemas/Pet'))).toBe(true)
  })

  it('adds help and docs lines, and omits docs for KUBB_UNKNOWN', () => {
    const withHelp = formatDiagnostic({ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'boom', help: 'fix the ref' })
    expect(withHelp.some((line) => line.includes('help: fix the ref'))).toBe(true)
    expect(withHelp.some((line) => line.includes('docs: https://kubb.dev'))).toBe(true)

    const unknown = formatDiagnostic({ code: 'KUBB_UNKNOWN', severity: 'error', message: 'boom' })
    expect(unknown.some((line) => line.includes('docs:'))).toBe(false)
  })
})
