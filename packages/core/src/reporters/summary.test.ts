import { stripVTControlCharacters } from 'node:util'
import { describe, expect, it, vi } from 'vitest'
import type { Report } from './report.ts'
import { formatSummary } from './summary.ts'

const report: Report = {
  name: 'petstore',
  status: 'success',
  plugins: { passed: 4, failed: [], total: 4 },
  counts: { errors: 0, warnings: 0, infos: 0 },
  filesCreated: 71,
  filesUnchanged: 54,
  fileChanges: { added: 14, modified: 3, deleted: 1, linesAdded: 312, linesRemoved: 47 },
  durationMs: 466,
  output: '/project/src/gen',
  timings: [],
  diagnostics: [],
}

function render(overrides: Partial<Report> = {}): string {
  return stripVTControlCharacters(formatSummary({ ...report, ...overrides }, { showTimings: false }).join('\n'))
}

describe('formatSummary', () => {
  it('leads with the outcome and separates generated files, plugins, and file changes', () => {
    using _cwd = vi.spyOn(process, 'cwd').mockReturnValue('/project')
    expect(render()).toBe(
      [
        '✓ Generation complete  466ms',
        '',
        '  17 files generated · 54 unchanged',
        '  Plugins  4 passed',
        '  Output   ./src/gen',
        '',
        'File changes',
        '  14 added · 3 modified · 1 deleted',
        '  Lines  +312 −47',
      ].join('\n'),
    )
  })

  it('keeps an early failure clear without displaying zero plugin successes or failures', () => {
    const text = render({
      status: 'failed',
      plugins: { passed: 0, failed: [], total: 2 },
      counts: { errors: 1, warnings: 0, infos: 0 },
      filesCreated: 0,
      filesUnchanged: 0,
      fileChanges: undefined,
    })
    expect(text).toContain('✗ Generation failed')
    expect(text).toContain('  Plugins  2 not run')
    expect(text).toContain('1 error')
    expect(text).toContain('Target')
    expect(text).not.toMatch(/0 passed|0 failed|File changes/)
  })

  it('labels dry runs as plans rather than completed writes', () => {
    const text = render({ dryRun: true })
    expect(text).toContain('◇ Dry run complete')
    expect(text).toContain('17 files planned')
    expect(text).toContain('Nothing was written.')
    expect(text).toContain('Planned file changes')
    expect(text).not.toContain('files generated')
  })

  it('calls out warnings, unchanged output, and failed plugins', () => {
    expect(render({ counts: { errors: 0, warnings: 2, infos: 0 } })).toContain('Generation complete with warnings')
    expect(render({ filesCreated: 54 })).toContain('Already up to date')
    expect(render({ status: 'failed', plugins: { passed: 3, failed: ['plugin-zod'], total: 4 } })).toContain('Failed plugins  plugin-zod')
  })
})
