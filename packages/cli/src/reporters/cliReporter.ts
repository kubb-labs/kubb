import { resolve } from 'node:path'
import { styleText } from 'node:util'
import { formatHrtime, randomCliColor } from '@internals/utils'
import { createReporter, Diagnostics, type GenerationResult, isPerformanceDiagnostic, logLevel as logLevelMap } from '@kubb/core'
import { SUMMARY_MAX_BAR_LENGTH, SUMMARY_TIME_SCALE_DIVISOR } from '../constants.ts'

/**
 * Builds the vitest/jest-style summary for one config: right-aligned dim labels with
 * `N passed (total)` counts, and a per-plugin `Timings` section when `showTimings`.
 */
function buildSummaryLines(result: GenerationResult, { showTimings }: { showTimings: boolean }): Array<string> {
  const { config, diagnostics, filesCreated, status, hrStart } = result

  const failedPlugins = Diagnostics.failedPlugins(diagnostics)
  const pluginsCount = config.plugins?.length ?? 0
  const passed = pluginsCount - failedPlugins.length
  const { errors, warnings } = Diagnostics.count(diagnostics)
  const timings = showTimings ? diagnostics.filter(isPerformanceDiagnostic) : []

  const rows: Array<[label: string, value: string]> = []

  rows.push([
    'Plugins',
    status === 'success'
      ? `${styleText('green', `${passed} passed`)} (${pluginsCount})`
      : `${styleText('green', `${passed} passed`)} | ${styleText('red', `${failedPlugins.length} failed`)} (${pluginsCount})`,
  ])

  if (status === 'failed' && failedPlugins.length > 0) {
    rows.push(['Failed', failedPlugins.map((name) => randomCliColor(name)).join(', ')])
  }

  if (errors > 0 || warnings > 0) {
    const issues = [
      errors > 0 ? styleText('red', `${errors} ${errors === 1 ? 'error' : 'errors'}`) : undefined,
      warnings > 0 ? styleText('yellow', `${warnings} ${warnings === 1 ? 'warning' : 'warnings'}`) : undefined,
    ]
      .filter(Boolean)
      .join(' | ')
    rows.push(['Issues', issues])
  }

  rows.push(['Files', `${styleText('green', String(filesCreated))} generated`])
  rows.push(['Duration', styleText('green', formatHrtime(hrStart))])
  rows.push(['Output', resolve(config.root, config.output.path)])

  const labelWidth = Math.max(...rows.map(([label]) => label.length), timings.length > 0 ? 'Timings'.length : 0)
  const lines = rows.map(([label, value]) => `${styleText('dim', label.padStart(labelWidth))}  ${value}`)

  if (timings.length > 0) {
    const sorted = [...timings].sort((a, b) => b.duration - a.duration)
    const nameWidth = Math.max(0, ...sorted.map((timing) => timing.plugin.length))
    const indent = ' '.repeat(labelWidth + 2)

    lines.push(styleText('dim', 'Timings'.padStart(labelWidth)))
    for (const timing of sorted) {
      const timeStr = timing.duration >= 1000 ? `${(timing.duration / 1000).toFixed(2)}s` : `${Math.round(timing.duration)}ms`
      const barLength = Math.min(Math.ceil(timing.duration / SUMMARY_TIME_SCALE_DIVISOR), SUMMARY_MAX_BAR_LENGTH)
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
 * The default `cli` reporter. Renders the summary for each config as it finishes, independent of
 * the live logger view. Suppressed at `silent`; the `verbose` level adds the per-plugin timings.
 */
export const cliReporter = createReporter({
  name: 'cli',
  report(result, { logLevel }) {
    if (logLevel <= logLevelMap.silent) {
      return
    }

    const lines = buildSummaryLines(result, { showTimings: logLevel >= logLevelMap.verbose })
    renderSummary(lines, { title: result.config.name || '', status: result.status })
  },
})
