import { describe, expect, it } from 'vitest'
import type { GenerationResult } from '../createReporter.ts'
import type { Config } from '../types.ts'
import { buildReport } from './report.ts'
import { formatSummary } from './summary.ts'

function summary(overrides: Partial<GenerationResult> = {}): Array<string> {
  const result: GenerationResult = {
    config: { name: 'petstore', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}, {}] } as unknown as Config,
    diagnostics: [],
    filesCreated: 4,
    status: 'success',
    hrStart: process.hrtime(),
    ...overrides,
  }

  return formatSummary(buildReport(result), { showTimings: false })
}

const changes = { added: 1, modified: 2, deleted: 1, linesAdded: 5, linesRemoved: 3 }
const staleFile = { path: 'src/gen/pet.ts', status: 'modified', linesAdded: 1, linesRemoved: 1 } as const

describe('formatSummary', () => {
  it('ends a run with the verdict, the kinds of change, and the Finished line', () => {
    const lines = summary({ filesUnchanged: 70, filesFromLockfile: 3, fileChanges: changes })

    expect(lines[1]).toBe('✓ Generated 4 files · 70 unchanged (3 via kubb-lock.json)')
    expect(lines[2]).toBe('  1 added · 2 modified · 1 deleted · +5 −3')
    expect(lines[3]).toMatch(/^ {2}Finished in .+ · \/tmp\/src\/gen · 2 plugins$/)
  })

  it.each([
    ['nothing changed', { filesUnchanged: 4, fileChanges: { ...changes, added: 0, modified: 0, deleted: 0 } }, '✓ Already up to date · 4 unchanged'],
    ['no file changes were collected', {}, '✓ Generated 4 files'],
    ['a dry run changes files', { dryRun: true, fileChanges: changes }, '◇ Dry run: 4 files would change'],
    ['a dry run changes nothing', { dryRun: true, filesUnchanged: 4 }, '◇ Dry run: no files would change · 4 unchanged'],
    ['a check finds everything up to date', { check: { changed: false, files: [] }, filesFromLockfile: 2 }, '✓ 4 files up to date · 2 via kubb-lock.json'],
    ['a check finds stale files', { check: { changed: true, files: [staleFile] }, filesUnchanged: 3 }, '✗ 1 file out of date · 3 up to date'],
  ] as const)('names the outcome when %s', (_name, overrides, expected) => {
    expect(summary(overrides)).toContain(expected)
  })

  it('names the errors and the failed plugins of a failed run', () => {
    const report = buildReport({
      config: { root: '/tmp', output: { path: 'src/gen' }, plugins: [{}, {}] } as unknown as Config,
      diagnostics: [{ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing Pet', plugin: 'plugin-ts' }],
      filesCreated: 0,
      status: 'failed',
      hrStart: process.hrtime(),
    })
    const lines = formatSummary({ ...report, plugins: { ...report.plugins, failed: ['plugin-ts'] } }, { showTimings: false })

    expect(lines[1]).toBe('✗ Generation failed · 1 error · plugin-ts failed')
    expect(lines.at(-1)).toContain('1 of 2 plugins failed')
  })

  it('puts each diff under its file and the lockfile warning before the verdict', () => {
    const patch = '===\n--- a/src/gen/pet.ts\n+++ b/src/gen/pet.ts\n@@ -1,1 +1,1 @@\n-old\n+new'
    const lines = summary({ check: { changed: true, files: [{ ...staleFile, patch }], lockfile: 'missing' } })

    expect(lines.slice(1, 6)).toStrictEqual(['  modified  src/gen/pet.ts  +1 −1', '    @@ -1,1 +1,1 @@', '    -old', '    +new', ''])
    expect(lines[6]).toMatch(/^⚠ No readable kubb-lock.json/)
    expect(lines[8]).toBe('✗ 1 file out of date')
    expect(lines[9]).toBe('  Run `kubb generate` to update them.')
  })

  it('points to --diff when a check has no diffs, and to --no-lockfile when it is set', () => {
    const lines = summary({ check: { changed: true, files: [staleFile], lockfile: 'disabled' } })

    expect(lines).toContain('  Run `kubb generate` to update them, or `kubb generate --diff` to see the changes.')
    expect(lines.some((line) => line.startsWith('⚠ --no-lockfile is set'))).toBe(true)
  })

  it('says a dry run wrote nothing', () => {
    expect(summary({ dryRun: true })).toContain('  Nothing was written. Run `kubb generate` to write the files.')
  })
})
