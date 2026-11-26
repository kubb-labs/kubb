import { defineTool } from 'tmcp/tool'
import * as v from 'valibot'
import { runKubb } from '../cli.ts'
import { configPathSchema } from './shared.ts'

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

type CheckedFile = { path: string; linesAdded: number; linesRemoved: number }

/**
 * The out-of-date files of every config, from the JSON report `kubb generate --reporter json` prints on stdout.
 * Returns `undefined` when stdout holds no report, as after a run that failed before it reported.
 */
function readCheckedFiles(stdout: string): Array<CheckedFile> | undefined {
  try {
    const reports: unknown = JSON.parse(stdout)
    if (!Array.isArray(reports)) return undefined
    return reports.flatMap((report: { check?: { files?: Array<CheckedFile> } } | null) => report?.check?.files ?? [])
  } catch {
    return undefined
  }
}

/**
 * One line per out-of-date file with its line counts, under a count of the files. Lists files until
 * `maxChars` is used, then the number left out.
 */
function formatSummary(files: ReadonlyArray<CheckedFile>, maxChars = Number.POSITIVE_INFINITY): string {
  const lines: Array<string> = []
  let used = 0
  for (const { path, linesAdded, linesRemoved } of files) {
    const line = `${path} (+${linesAdded} -${linesRemoved})`
    if (used + line.length + 1 > maxChars) break
    lines.push(line)
    used += line.length + 1
  }
  if (files.length > lines.length) lines.push(`and ${files.length - lines.length} more. Call kubb_diff with format "summary" for the full list.`)
  return `${files.length} generated ${files.length === 1 ? 'file is' : 'files are'} out of date:\n${lines.join('\n')}`
}

export const diffTool = defineTool(
  {
    name: 'kubb_diff',
    title: 'Diff the generated files',
    description:
      'Show how the generated files on disk differ from what `kubb_generate` would write now: the generated-file diff. It writes nothing, so use it to preview a generation, or to check that the generated code is in sync with the spec and the config. It does not compare two versions of an OpenAPI spec, and it is not a git diff. Runs `kubb generate --diff` with the JSON reporter and returns the run log, the diffs, and the exit code: 0 means the files are up to date, 1 means they are out of date. `full` returns a unified diff for each out-of-date file and cuts long output with a notice and the list of files, and `summary` returns only that list with the added and removed line counts.',
    schema: diffSchema,
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  },
  ({ configPath, format = 'full', lockfile = true }) =>
    // The JSON report owns stdout, so the run log, the warnings, and the diffs of `--diff` arrive on stderr.
    runKubb({
      args: ['generate', format === 'summary' ? '--check' : '--diff', '--reporter', 'json', ...(lockfile ? [] : ['--no-lockfile'])],
      configPath,
      isSuccess: (code) => code === 0 || code === 1,
      formatOutput: ({ stdout, stderr, output }) => {
        const files = readCheckedFiles(stdout)
        if (!files) return output
        if (format === 'full' || !files.length) return stderr
        return [stderr, formatSummary(files)].filter(Boolean).join('\n\n')
      },
      truncationHint: ({ stdout }) => {
        if (format === 'summary') return 'The end of the file list is missing.'
        const files = readCheckedFiles(stdout)
        if (!files?.length) return undefined
        return `The diffs of the later files are missing. The out-of-date files are listed below.\n\n${formatSummary(files, MAX_NOTICE_LIST_CHARS)}`
      },
    }),
)
