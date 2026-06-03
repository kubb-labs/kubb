import { relative, resolve } from 'node:path'
import process from 'node:process'
import { stripVTControlCharacters } from 'node:util'
import { formatMs, write } from '@internals/utils'
import { createReporter, type Diagnostic, isPerformanceDiagnostic, isProblemDiagnostic } from '@kubb/core'
import { formatDiagnostic } from '../loggers/diagnostics.ts'

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
 * Builds the `## Timings` section: one `plugin   duration` row per performance record, sorted
 * slowest first with the plugin names left-aligned and the durations right-aligned. Returns an
 * empty array when there are no timings.
 */
function buildTimingSection(diagnostics: ReadonlyArray<Diagnostic>): Array<string> {
  const timings = diagnostics.filter(isPerformanceDiagnostic).sort((a, b) => b.duration - a.duration)
  if (timings.length === 0) {
    return []
  }

  const nameWidth = Math.max(...timings.map((timing) => timing.plugin.length))
  const durations = timings.map((timing) => formatMs(timing.duration))
  const durationWidth = Math.max(...durations.map((duration) => duration.length))
  const rows = timings.map((timing, index) => `  ${timing.plugin.padEnd(nameWidth)}  ${durations[index]!.padStart(durationWidth)}`)

  return ['## Timings', '', ...rows]
}

/**
 * The `file` reporter. Writes a config's diagnostics to `.kubb/kubb-<name>-<timestamp>.log` as a
 * plain-text report: a `# <name> — <timestamp>` header, a `## Problems` section in the miette
 * block format, and a `## Timings` section with the per-plugin durations. Selected with
 * `--reporter file` (or `reporters: ['file']`), replacing the old `--debug` flag.
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

    const header = config.name ? `# ${config.name} — ${new Date().toISOString()}` : `# ${new Date().toISOString()}`
    const sections = [buildProblemSection(diagnostics), buildTimingSection(diagnostics)].filter((section) => section.length > 0)
    const content = stripVTControlCharacters([header, ...sections.map((section) => section.join('\n'))].join('\n\n'))

    const baseName = `${['kubb', config.name, Date.now()].filter(Boolean).join('-')}.log`
    const pathName = resolve(process.cwd(), '.kubb', baseName)

    await write(pathName, `${content}\n`)
    console.error(`Debug log written to ${relative(process.cwd(), pathName)}`)
  },
})
