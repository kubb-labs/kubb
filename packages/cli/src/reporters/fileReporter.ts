import { relative, resolve } from 'node:path'
import process from 'node:process'
import { write } from '@internals/utils'
import { createReporter, isProblemDiagnostic } from '@kubb/core'
import { formatDiagnostic } from '../loggers/diagnostics.ts'

/**
 * The `file` reporter. Writes a config's diagnostics to `.kubb/kubb-<name>-<timestamp>.log`: every
 * problem in the miette block format and every performance record as its one-line message.
 * Selected with `--reporter file` (or `reporters: ['file']`), replacing the old `--debug` flag.
 *
 * @note Unlike the streaming logger it replaced, it captures the collected diagnostics once a
 * config finishes, not the live `kubb:info`/`kubb:plugin` event stream.
 */
export const fileReporter = createReporter({
  name: 'file',
  async report(result) {
    const { diagnostics } = result
    if (diagnostics.length === 0) {
      return
    }

    const lines = diagnostics.flatMap((diagnostic) => (isProblemDiagnostic(diagnostic) ? formatDiagnostic(diagnostic) : [diagnostic.message]))
    const baseName = `${['kubb', result.config.name, Date.now()].filter(Boolean).join('-')}.log`
    const pathName = resolve(process.cwd(), '.kubb', baseName)

    await write(pathName, `${lines.join('\n')}\n`)
    console.error(`Debug log written to ${relative(process.cwd(), pathName)}`)
  },
})
