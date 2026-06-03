import { relative, resolve } from 'node:path'
import process from 'node:process'
import { stripVTControlCharacters } from 'node:util'
import { formatMs, write } from '@internals/utils'
import { createReporter, type Diagnostic, isProblemDiagnostic } from '@kubb/core'
import { formatDiagnostic } from '../loggers/diagnostics.ts'
import { buildReport, type Report } from './report.ts'

/**
 * Builds the `## Summary` section: the same counts the cli and json reporters expose, as a list of
 * `label  value` rows with the labels padded to a common width.
 */
function buildSummarySection(report: Report): Array<string> {
  const { status, plugins, counts, filesCreated, durationMs, output } = report

  const rows: Array<[label: string, value: string]> = [
    ['Status', status],
    [
      'Plugins',
      status === 'success' ? `${plugins.passed} passed (${plugins.total})` : `${plugins.passed} passed | ${plugins.failed.length} failed (${plugins.total})`,
    ],
  ]

  if (plugins.failed.length > 0) {
    rows.push(['Failed', plugins.failed.join(', ')])
  }

  rows.push(['Issues', `${counts.errors} errors | ${counts.warnings} warnings | ${counts.infos} infos`])
  rows.push(['Files', `${filesCreated} generated`])
  rows.push(['Duration', formatMs(durationMs)])
  rows.push(['Output', output])

  const labelWidth = Math.max(...rows.map(([label]) => label.length))
  const lines = rows.map(([label, value]) => `  ${label.padEnd(labelWidth)}  ${value}`)

  return ['## Summary', '', ...lines]
}

/**
 * Builds the `## Problems` section: each problem rendered in the miette block format, blocks
 * separated by a blank line. Returns an empty array when there are no problems, so the caller
 * can drop the heading.
 */
function buildProblemSection(diagnostics: ReadonlyArray<Diagnostic>): Array<string> {
  const problems = diagnostics.filter(isProblemDiagnostic)
  if (problems.length === 0) {
    return []
  }

  const blocks = problems.map((diagnostic) => formatDiagnostic(diagnostic).join('\n'))
  return ['## Problems', '', blocks.join('\n\n')]
}

/**
 * Builds the `## Timings` section from a {@link Report}: one `plugin   duration` row per record,
 * slowest first with the plugin names left-aligned and the durations right-aligned. Returns an
 * empty array when there are no timings.
 */
function buildTimingSection(report: Report): Array<string> {
  const { timings } = report
  if (timings.length === 0) {
    return []
  }

  const nameWidth = Math.max(...timings.map((timing) => timing.plugin.length))
  const durations = timings.map((timing) => formatMs(timing.durationMs))
  const durationWidth = Math.max(...durations.map((duration) => duration.length))
  const rows = timings.map((timing, index) => `  ${timing.plugin.padEnd(nameWidth)}  ${durations[index]!.padStart(durationWidth)}`)

  return ['## Timings', '', ...rows]
}

/**
 * The `file` reporter. Writes a config's {@link Report} to `.kubb/kubb-<name>-<timestamp>.log` as a
 * plain-text document: a `# <name> — <timestamp>` header, a `## Summary` with the same counts the
 * cli and json reporters expose, a `## Problems` section in the miette block format, and a
 * `## Timings` section. Selected with `--reporter file` (or `reporters: ['file']`), replacing the
 * old `--debug` flag.
 *
 * @note Unlike the streaming logger it replaced, it captures the collected diagnostics once a
 * config finishes, not the live `kubb:info`/`kubb:plugin` event stream. Color is stripped so the
 * file stays plain text even when the run is attached to a TTY.
 */
export const fileReporter = createReporter({
  name: 'file',
  async report(result) {
    const { diagnostics, config } = result
    if (diagnostics.length === 0) {
      return
    }

    const report = buildReport(result)
    const header = config.name ? `# ${config.name} — ${new Date().toISOString()}` : `# ${new Date().toISOString()}`
    const sections = [buildSummarySection(report), buildProblemSection(diagnostics), buildTimingSection(report)].filter((section) => section.length > 0)
    const content = stripVTControlCharacters([header, ...sections.map((section) => section.join('\n'))].join('\n\n'))

    const baseName = `${['kubb', config.name, Date.now()].filter(Boolean).join('-')}.log`
    const pathName = resolve(process.cwd(), '.kubb', baseName)

    await write(pathName, `${content}\n`)
    console.error(`Debug log written to ${relative(process.cwd(), pathName)}`)
  },
})
