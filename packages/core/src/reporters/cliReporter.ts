import { styleText } from 'node:util'
import { createReporter, logLevel as logLevelMap, type Reporter } from '../createReporter.ts'
import { buildReport } from './report.ts'
import { formatSummary, type SummaryRenderer } from './summary.ts'

/**
 * Renders the summary as plain `console.log` lines so it works in every CLI (no clack/TTY
 * dependency): a blank line, the config name colored by status, then the summary rows.
 */
const consoleRenderer: SummaryRenderer = (lines, { title, status }) => {
  console.log('')
  if (title) {
    console.log(styleText(status === 'failed' ? 'red' : 'green', title))
  }
  for (const line of lines) {
    console.log(line)
  }
}

/**
 * Builds a `cli` reporter that renders the {@link Report} for each config as it finishes.
 * Suppressed at `silent`. The `verbose` level adds the per-plugin timings.
 *
 * Pass `render` to send the summary through output the host already owns, so it lands inside that
 * host's grouping instead of alongside it. Omit it for the plain `console.log` writer.
 *
 * @example
 * ```ts
 * const reporter = createCliReporter({ render: (lines) => lines.forEach((line) => clack.log.message(line)) })
 * ```
 */
export function createCliReporter({ render = consoleRenderer }: { render?: SummaryRenderer } = {}): Reporter {
  return createReporter({
    name: 'cli',
    report(result, { logLevel }) {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const report = buildReport(result)

      render(formatSummary(report, { showTimings: logLevel >= logLevelMap.verbose }), { title: report.name, status: report.status })
    },
  })
}

/**
 * The default `cli` reporter, writing its summary straight to the console. Independent of the live
 * logger view.
 */
export const cliReporter = createCliReporter()
