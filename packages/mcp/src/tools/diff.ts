import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import * as v from 'valibot'
import { runKubb } from '../cli.ts'
import { type DiffFileSummary, summarizeDiff } from '../utils.ts'
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

// The most characters of file list under a cut diff, so the list cannot push the diff out of the response.
const MAX_NOTICE_LIST_CHARS = 5_000

/**
 * One line per out-of-date file with its line counts, under a count of the files. Lists files until
 * `maxChars` is used, then the number left out.
 */
function formatSummary(files: ReadonlyArray<DiffFileSummary>, maxChars = Number.POSITIVE_INFINITY): string {
  const lines: Array<string> = []
  let used = 0
  for (const { file, linesAdded, linesRemoved } of files) {
    const line = `${file} (+${linesAdded} -${linesRemoved})`
    if (used + line.length + 1 > maxChars) break
    lines.push(line)
    used += line.length + 1
  }
  if (files.length > lines.length) lines.push(`and ${files.length - lines.length} more. Call kubb_diff with format "summary" for the full list.`)
  return `${files.length} generated ${files.length === 1 ? 'file is' : 'files are'} out of date:\n${lines.join('\n')}`
}

/**
 * The CLI output with each diff replaced by one line in the file list. The lines outside a diff, such
 * as warnings, stay above the list. Output without a diff comes back as is.
 */
function toSummary(output: string): string {
  const { files, rest } = summarizeDiff(output)
  if (!files.length) return output
  return [rest, formatSummary(files)].filter(Boolean).join('\n\n')
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
      formatOutput: (output) => (format === 'summary' ? toSummary(output) : output),
      truncationHint: (output) => {
        if (format === 'summary') return 'The end of the file list is missing.'
        const { files } = summarizeDiff(output)
        if (!files.length) return undefined
        return `The diffs of the later files are missing. The out-of-date files are listed below.\n\n${formatSummary(files, MAX_NOTICE_LIST_CHARS)}`
      },
    })
  },
)
