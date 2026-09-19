import { styleText } from 'node:util'
import { formatMs } from '@internals/utils'
import { SUMMARY_MAX_BAR_LENGTH, SUMMARY_TIME_SCALE_DIVISOR } from '../constants.ts'
import { randomCliColor } from './colors.ts'
import type { Report } from './report.ts'

/**
 * Writes a finished summary. The `cli` reporter formats the lines and hands them to one of these,
 * so the caller decides where they land: plain `console.log` by default, or the active logger's own
 * output when a host installs one.
 */
export type SummaryRenderer = (lines: ReadonlyArray<string>, meta: { title: string; status: 'success' | 'failed' }) => void

/**
 * Formats the vitest/jest-style summary for one {@link Report}: right-aligned dim labels with
 * `N passed (total)` counts, and a per-plugin `Timings` section when `showTimings`. Pure, so a host
 * can render the same lines through whatever output it already owns.
 *
 * @example
 * ```ts
 * const lines = formatSummary(buildReport(result), { showTimings: false })
 * ```
 */
export function formatSummary(report: Report, { showTimings }: { showTimings: boolean }): Array<string> {
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
