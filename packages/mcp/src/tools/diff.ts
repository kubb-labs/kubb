import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import * as v from 'valibot'
import { runKubb } from '../cli.ts'
import { summarizeDiff } from '../utils.ts'
import { configPathSchema, toConfigArgs } from './shared.ts'

const diffSchema = v.object({
  configPath: configPathSchema,
  format: v.optional(
    v.pipe(
      v.picklist(['full', 'summary']),
      v.description(
        '`full` returns the unified diff of every out-of-date file, cut at about 30,000 characters. `summary` returns one line per file with its added and removed line counts, for a large API',
      ),
    ),
    'full',
  ),
  lockfile: v.optional(v.pipe(v.boolean(), v.description('Read kubb-lock.json. Set to false to compare with the generated text alone')), true),
})

// The file list under a cut diff stays short, so the notice does not bring the output back over the limit.
const MAX_FILES_IN_NOTICE = 100

/**
 * One line per out-of-date file with its line counts, under a count of the files. Lists `maxFiles`
 * files at most, then the number left out. Returns `undefined` when `output` holds no diff.
 */
function formatSummary(output: string, maxFiles = Number.POSITIVE_INFINITY): string | undefined {
  const files = summarizeDiff(output)
  if (!files.length) return undefined
  const lines = files.slice(0, maxFiles).map(({ file, linesAdded, linesRemoved }) => `${file} (+${linesAdded} -${linesRemoved})`)
  if (files.length > maxFiles) lines.push(`and ${files.length - maxFiles} more. Call kubb_diff with format "summary" for the full list.`)
  return `${files.length} generated ${files.length === 1 ? 'file is' : 'files are'} out of date:\n${lines.join('\n')}`
}

export const diffTool = defineTool(
  {
    name: 'kubb_diff',
    title: 'Diff the generated files',
    description:
      'Show how the generated files on disk differ from what `kubb_generate` would write now: the generated-file diff. It writes nothing, so use it to preview a generation, or to check that the generated code is in sync with the spec and the config. It does not compare two versions of an OpenAPI spec, and it is not a git diff. Runs `kubb generate --diff` and returns the CLI output and exit code: 0 means the files are up to date, 1 means they are out of date. `full` returns a unified diff for each out-of-date file and cuts long output with a notice and the list of files, and `summary` returns only that list with the added and removed line counts.',
    schema: diffSchema,
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  },
  async ({ configPath, format = 'full', lockfile = true }) => {
    const configArgs = await toConfigArgs(configPath)
    if ('error' in configArgs) return tool.error(configArgs.error)
    return runKubb({
      args: ['generate', ...configArgs.args, '--diff', ...(lockfile ? [] : ['--no-lockfile'])],
      isSuccess: (code) => code === 0 || code === 1,
      formatOutput: (output) => (format === 'summary' ? (formatSummary(output) ?? output) : output),
      truncationHint: (output) => {
        if (format === 'summary') return 'The end of the file list is missing.'
        const summary = formatSummary(output, MAX_FILES_IN_NOTICE)
        return summary ? `The diffs of the later files are missing. The out-of-date files are listed below.\n\n${summary}` : undefined
      },
    })
  },
)
