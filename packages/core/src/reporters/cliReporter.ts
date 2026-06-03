import { styleText } from 'node:util'
import { formatMs, randomCliColor } from '@internals/utils'
import { SUMMARY_MAX_BAR_LENGTH, SUMMARY_TIME_SCALE_DIVISOR } from '../constants.ts'
import { logLevel as logLevelMap } from '../defineLogger.ts'
import { createReporter } from '../createReporter.ts'
import { buildReport, type Report } from './report.ts'

/**
 * Builds the vitest/jest-style summary for one {@link Report}: right-aligned dim labels with
 * `N passed (total)` counts, and a per-plugin `Timings` section when `showTimings`.
 */
function buildSummaryLines(report: Report, { showTimings }: { showTimings: boolean }): Array<string> {
  const { status, plugins, counts, filesCreated, durationMs, output, timings } = report

  const rows: Array<[label: string, value: string]> = []

  rows.push([
    'Plugins',
    status === 'success'
      ? `${styleText('green', `${plugins.passed} passed`)} (${plugins.total})`
      : `${styleText('green', `${plugins.passed} passed`)} | ${styleText('red', `${plugins.failed.length} failed`)} (${plugins.total})`,
  ])

  if (status === 'failed' && plugins.failed.length > 0) {
    rows.push(['Failed', plugins.failed.map((name) => randomCliColor(name)).join(', ')])
  }

  if (counts.errors > 0 || counts.warnings > 0) {
    const issues = [
      counts.errors > 0 ? styleText('red', `${counts.errors} ${counts.errors === 1 ? 'error' : 'errors'}`) : undefined,
      counts.warnings > 0 ? styleText('yellow', `${counts.warnings} ${counts.warnings === 1 ? 'warning' : 'warnings'}`) : undefined,
    ]
      .filter(Boolean)
      .join(' | ')
    rows.push(['Issues', issues])
  }

  rows.push(['Files', `${styleText('green', String(filesCreated))} generated`])
  rows.push(['Duration', styleText('green', formatMs(durationMs))])
  rows.push(['Output', output])

  const labelWidth = Math.max(...rows.map(([label]) => label.length), timings.length > 0 ? 'Timings'.length : 0)
  const lines = rows.map(([label, value]) => `${styleText('dim', label.padStart(labelWidth))}  ${value}`)

  if (showTimings && timings.length > 0) {
    const nameWidth = Math.max(0, ...timings.map((timing) => timing.plugin.length))
    const indent = ' '.repeat(labelWidth + 2)

    lines.push(styleText('dim', 'Timings'.padStart(labelWidth)))
    for (const timing of timings) {
      const timeStr = formatMs(timing.durationMs)
      const barLength = Math.min(Math.ceil(timing.durationMs / SUMMARY_TIME_SCALE_DIVISOR), SUMMARY_MAX_BAR_LENGTH)
      const bar = styleText('dim', '█'.repeat(barLength))
      lines.push(`${indent}${styleText('dim', '•')} ${timing.plugin.padEnd(nameWidth)} ${bar} ${timeStr}`)
    }
  }

  return lines
}

/**
 * Renders the summary as plain `console.log` lines so it works in every CLI (no clack/TTY
 * dependency): a blank line, the config name colored by status, then the summary rows.
 */
function renderSummary(lines: ReadonlyArray<string>, { title, status }: { title: string; status: 'success' | 'failed' }): void {
  console.log('')
  if (title) {
    console.log(styleText(status === 'failed' ? 'red' : 'green', title))
  }
  for (const line of lines) {
    console.log(line)
  }
}

/**
 * The default `cli` reporter. Renders the {@link Report} for each config as it finishes, independent
 * of the live logger view. Suppressed at `silent`; the `verbose` level adds the per-plugin timings.
 */
export const cliReporter = createReporter({
  name: 'cli',
  report(result, { logLevel }) {
    if (logLevel <= logLevelMap.silent) {
      return
    }

    const report = buildReport(result)
    const lines = buildSummaryLines(report, { showTimings: logLevel >= logLevelMap.verbose })
    renderSummary(lines, { title: report.name, status: report.status })
  },
})
