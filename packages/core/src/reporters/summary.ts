import { isAbsolute, relative } from 'node:path'
import { styleText } from 'node:util'
import { formatMs } from '@internals/utils'
import { host } from '../host.ts'
import type { FileChanges } from '../createReporter.ts'
import { LOCKFILE_NAME } from '../lockfile.ts'
import type { Report } from './report.ts'

/**
 * Writes the summary through the host's output, or plain console lines by default.
 */
export type SummaryRenderer = (lines: ReadonlyArray<string>, meta: { title: string; status: 'success' | 'failed' }) => void

function summaryTitle({ status, check, dryRun, counts, filesCreated, filesUnchanged }: Report): string {
  if (status === 'failed') return '✗ Generation failed'
  if (check) return check.changed ? '✗ Generated code is out of date' : '✓ Generated code is up to date'
  if (dryRun) return '◇ Dry run complete'
  if (counts.warnings) return '✓ Generation complete with warnings'
  if (filesCreated > 0 && filesCreated === filesUnchanged) return '✓ Already up to date'
  return '✓ Generation complete'
}

function summaryTone({ status, check, counts }: Report): 'red' | 'yellow' | 'green' {
  if (status === 'failed' || check?.changed) return 'red'
  return counts.warnings ? 'yellow' : 'green'
}

const separator = styleText('dim', ' · ')

/** How many files the run changes, and the word for it. A check counts every file a run would change, deletions included. */
function countChangedFiles({ check, dryRun, filesCreated, filesUnchanged }: Report): { count: number; verb: string } {
  if (check?.changed) return { count: check.files.length, verb: 'out of date' }
  if (check) return { count: filesCreated, verb: 'checked' }
  return { count: Math.max(0, filesCreated - filesUnchanged), verb: dryRun ? 'planned' : 'generated' }
}

/**
 * `3 files out of date · 70 unchanged · 12 from kubb-lock.json`. A clean check has only checked files, so it names
 * no unchanged ones. The lockfile count works like the "reused" count of a package manager: files that matched
 * through `kubb-lock.json` instead of by their text.
 */
function filesLine(report: Report): string {
  const { count, verb } = countChangedFiles(report)
  const parts = [styleText(count ? 'bold' : 'dim', `${count} ${count === 1 ? 'file' : 'files'} ${verb}`)]
  if (report.filesUnchanged && report.check?.changed !== false) parts.push(styleText('dim', `${report.filesUnchanged} unchanged`))
  if (report.filesFromLockfile) parts.push(styleText('dim', `${report.filesFromLockfile} from ${LOCKFILE_NAME}`))

  return `  ${parts.join(separator)}`
}

function changeCounts({ added, modified, deleted }: FileChanges): string {
  return [
    styleText(added ? 'green' : 'dim', `${added} added`),
    styleText(modified ? 'yellow' : 'dim', `${modified} modified`),
    styleText(deleted ? 'red' : 'dim', `${deleted} deleted`),
  ].join(separator)
}

function lineCounts({ linesAdded, linesRemoved }: Pick<FileChanges, 'linesAdded' | 'linesRemoved'>): string {
  return `${styleText(linesAdded ? 'green' : 'dim', `+${linesAdded}`)} ${styleText(linesRemoved ? 'red' : 'dim', `−${linesRemoved}`)}`
}

const statusTones = { added: 'green', modified: 'yellow', deleted: 'red' } as const

/**
 * The files a check found out of date as a table of status, path and line counts, then the totals
 * and how to fix it. A clean check prints nothing here.
 */
function outOfDateLines({ check, fileChanges }: Report): Array<string> {
  if (!check?.changed || !fileChanges) return []
  // A loop, not `Math.max(...)`: a first check can list thousands of files, and a spread that long can overflow the stack.
  const pathWidth = check.files.reduce((width, file) => Math.max(width, file.path.length), 0)

  return [
    '',
    styleText('bold', 'Out-of-date files'),
    ...check.files.map((file) => `  ${styleText(statusTones[file.status], file.status.padEnd(8))}  ${file.path.padEnd(pathWidth)}  ${lineCounts(file)}`),
    '',
    `  ${changeCounts(fileChanges)}`,
    '  Run `kubb generate` to update them.',
  ]
}

/** The totals of a run that wrote, or of a dry run that would write. */
function fileChangeLines({ fileChanges, dryRun }: Report): Array<string> {
  if (!fileChanges) return []

  return [
    '',
    styleText('bold', dryRun ? 'Planned file changes' : 'File changes'),
    `  ${changeCounts(fileChanges)}`,
    `  ${styleText('dim', 'Lines')}  ${lineCounts(fileChanges)}`,
  ]
}

/**
 * Puts the outcome first, followed by file counts, labeled plugin results, and the output path.
 * Hosts that collect file changes get a compact diff section. Verbose output adds plugin timings.
 */
export function formatSummary(report: Report, { showTimings }: { showTimings: boolean }): Array<string> {
  const { status, plugins, counts, check, dryRun, durationMs, output, timings } = report
  const failed = status === 'failed'
  const tone = summaryTone(report)
  const title = summaryTitle(report)
  const lines = [`${styleText(tone, title)}  ${styleText('dim', formatMs(durationMs))}`, '', filesLine(report)]

  const notRun = plugins.total - plugins.passed - plugins.failed.length
  const pluginCounts = [
    plugins.passed > 0 ? styleText('green', `${plugins.passed} passed`) : undefined,
    plugins.failed.length > 0 ? styleText('red', `${plugins.failed.length} failed`) : undefined,
    notRun > 0 ? styleText('dim', `${notRun} not run`) : undefined,
  ].filter(Boolean)
  lines.push(`  ${styleText('dim', 'Plugins')}  ${pluginCounts.join(separator) || styleText('dim', 'none configured')}`)

  if (plugins.failed.length) lines.push(`  ${styleText('dim', 'Failed plugins')}  ${styleText('red', plugins.failed.join(', '))}`)

  const issues = [
    counts.errors > 0 ? styleText('red', `${counts.errors} ${counts.errors === 1 ? 'error' : 'errors'}`) : undefined,
    counts.warnings > 0 ? styleText('yellow', `${counts.warnings} ${counts.warnings === 1 ? 'warning' : 'warnings'}`) : undefined,
  ].filter(Boolean)
  if (issues.length) lines.push(`  ${styleText('dim', 'Issues')}   ${issues.join(separator)}`)

  const destination = relative(host.cwd(), output)
  const displayPath = destination.startsWith('..') || isAbsolute(destination) ? output : `./${destination}`
  lines.push(`  ${styleText('dim', failed || dryRun ? 'Target' : 'Output')}   ${styleText(failed ? 'dim' : 'cyan', displayPath)}`)
  // A check says what is stale and how to update it, so it needs no reminder that nothing was written.
  if (dryRun && !check) lines.push(`  ${styleText('dim', 'Nothing was written.')}`)
  lines.push(...(check ? outOfDateLines(report) : fileChangeLines(report)))

  if (showTimings && timings.length > 0) {
    const nameWidth = Math.max(...timings.map((timing) => timing.plugin.length))
    lines.push('', styleText('dim', 'Plugin timings'))
    for (const timing of timings) lines.push(`  ${timing.plugin.padEnd(nameWidth)}  ${styleText('dim', formatMs(timing.durationMs))}`)
  }

  return lines
}
