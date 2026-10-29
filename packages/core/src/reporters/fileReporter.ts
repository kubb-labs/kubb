import { join, relative } from 'node:path'
import process from 'node:process'
import { stripVTControlCharacters } from 'node:util'
import { writeRaw } from '@internals/utils'
import { createReporter } from '../createReporter.ts'
import { type Diagnostic, Diagnostics } from '../Diagnostics.ts'
import { buildReport, reportTarget } from './report.ts'
import { formatSummary } from './summary.ts'

/**
 * Builds the `## Problems` section: each problem rendered in the miette block format, blocks
 * separated by a blank line. Returns an empty array when there are no problems, so the caller
 * can drop the heading.
 */
function buildProblemSection(diagnostics: ReadonlyArray<Diagnostic>): Array<string> {
  const problems = diagnostics.filter(Diagnostics.isProblem)
  if (problems.length === 0) {
    return []
  }

  // The full stack, since a log file is what a bug report attaches.
  const blocks = problems.map((diagnostic) => Diagnostics.format(diagnostic, { verbose: true }).join('\n'))
  return ['## Problems', '', blocks.join('\n\n')]
}

/**
 * The `file` reporter. Writes a config's {@link Report} to `.kubb/kubb-<name>-<timestamp>.log` as a
 * plain-text document: a `# <name> — <timestamp>` header, a `## Summary` with the same lines the
 * cli reporter prints (timings included), and a `## Problems` section in the miette block format.
 * Selected with `--reporter file` (or `reporters: ['file']`).
 *
 * @note It captures the collected diagnostics once a config finishes, not the live
 * `kubb:info`/`kubb:plugin` hook stream. Color is stripped so the file stays plain text even when
 * the run is attached to a TTY.
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
    const summary = ['## Summary', '', ...formatSummary(report, { showTimings: true })]
    const sections = [summary, buildProblemSection(diagnostics)].filter((section) => section.length > 0)
    const content = stripVTControlCharacters([header, ...sections.map((section) => section.join('\n'))].join('\n\n'))

    const { dir, name } = reportTarget(config)
    const path = join(dir, `${name}.log`)

    await writeRaw(path, `${content}\n`)
    console.error(`Debug log written to ${relative(process.cwd(), path)}`)
  },
})
