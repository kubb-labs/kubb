import process from 'node:process'
import { createReporter } from '../createReporter.ts'
import { buildReport } from './report.ts'

/**
 * The `json` reporter. `report` returns one config's {@link Report}, which {@link createReporter}
 * buffers, and `drain` writes them as a single pretty-printed JSON array on `kubb:lifecycle:end`.
 * Buffering keeps a multi-config run one valid JSON document on stdout instead of concatenated
 * objects that would break `jq .`. The terminal reporter is suppressed while `json` is active so
 * stdout stays valid JSON.
 */
export const jsonReporter = createReporter({
  name: 'json',
  report(result) {
    const report = buildReport(result)
    if (!report.check) return report
    // The diffs go to stderr in `json` mode, so the report keeps only the file list.
    const files = report.check.files.map(({ patch: _patch, ...file }) => file)
    return { ...report, check: { ...report.check, files } }
  },
  drain(_context, reports) {
    process.stdout.write(`${JSON.stringify(reports, null, 2)}\n`)
  },
})
