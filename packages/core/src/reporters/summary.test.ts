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
})
