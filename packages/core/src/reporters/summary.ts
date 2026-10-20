import { isAbsolute, relative } from 'node:path'
import { styleText } from 'node:util'
import { formatMs } from '@internals/utils'
import type { Report } from './report.ts'

/**
 * Writes the summary through the host's output, or plain console lines by default.
 */
export type SummaryRenderer = (lines: ReadonlyArray<string>, meta: { title: string; status: 'success' | 'failed' }) => void

/**
 * Puts the outcome first, followed by file counts, labeled plugin results, and the output path.
 * Hosts that collect file changes get a compact diff section. Verbose output adds plugin timings.
 */
export function formatSummary(report: Report, { showTimings }: { showTimings: boolean }): Array<string> {
  const { status, plugins, counts, filesCreated, filesUnchanged, fileChanges, dryRun, durationMs, output, timings } = report
  const failed = status === 'failed'
  const successTone = counts.warnings ? 'yellow' : 'green'
  const tone = failed ? 'red' : successTone
  const title = (() => {
    if (failed) return '✗ Generation failed'
    if (dryRun) return '◇ Dry run complete'
    if (counts.warnings) return '✓ Generation complete with warnings'
    if (filesCreated > 0 && filesCreated === filesUnchanged) return '✓ Already up to date'
    return '✓ Generation complete'
  })()
  const separator = styleText('dim', ' · ')
  const generated = Math.max(0, filesCreated - filesUnchanged)
  const fileLabel = `${generated} ${generated === 1 ? 'file' : 'files'} ${dryRun ? 'planned' : 'generated'}`
  const lines = [
    `${styleText(tone, title)}  ${styleText('dim', formatMs(durationMs))}`,
    '',
    `  ${styleText(generated ? 'bold' : 'dim', fileLabel)}${filesUnchanged ? separator + styleText('dim', `${filesUnchanged} unchanged`) : ''}`,
  ]

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

  const destination = relative(process.cwd(), output)
  const displayPath = destination.startsWith('..') || isAbsolute(destination) ? output : `./${destination}`
  lines.push(`  ${styleText('dim', failed || dryRun ? 'Target' : 'Output')}   ${styleText(failed ? 'dim' : 'cyan', displayPath)}`)
  if (dryRun) lines.push(`  ${styleText('dim', 'Nothing was written.')}`)

  if (fileChanges) {
    lines.push(
      '',
      styleText('bold', dryRun ? 'Planned file changes' : 'File changes'),
      `  ${styleText(fileChanges.added ? 'green' : 'dim', `${fileChanges.added} added`)}${separator}${styleText(fileChanges.modified ? 'yellow' : 'dim', `${fileChanges.modified} modified`)}${separator}${styleText(fileChanges.deleted ? 'red' : 'dim', `${fileChanges.deleted} deleted`)}`,
      `  ${styleText('dim', 'Lines')}  ${styleText(fileChanges.linesAdded ? 'green' : 'dim', `+${fileChanges.linesAdded}`)} ${styleText(fileChanges.linesRemoved ? 'red' : 'dim', `−${fileChanges.linesRemoved}`)}`,
    )
  }

  if (showTimings && timings.length > 0) {
    const nameWidth = Math.max(...timings.map((timing) => timing.plugin.length))
    lines.push('', styleText('dim', 'Plugin timings'))
    for (const timing of timings) lines.push(`  ${timing.plugin.padEnd(nameWidth)}  ${styleText('dim', formatMs(timing.durationMs))}`)
  }

  return lines
}
