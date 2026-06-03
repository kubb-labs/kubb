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
    return buildReport(result)
  },
  drain(_context, reports) {
    process.stdout.write(`${JSON.stringify(reports, null, 2)}\n`)
  },
})
