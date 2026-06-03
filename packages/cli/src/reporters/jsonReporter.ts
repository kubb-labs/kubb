import process from 'node:process'
import { createReporter } from '@kubb/core'
import { buildReport } from './report.ts'

/**
 * The `json` reporter. Writes the {@link Report} for each config to stdout as JSON, for CI tooling.
 * The terminal reporter is suppressed while this is active so stdout stays valid JSON.
 */
export const jsonReporter = createReporter({
  name: 'json',
  report(result) {
    const report = buildReport(result)
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  },
})
