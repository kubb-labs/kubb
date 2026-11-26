import { lstat, realpath } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { stripVTControlCharacters } from 'node:util'
import { CONFIG_EXTENSIONS } from '@internals/shared'
import { isPathInside } from '@internals/utils'
import { type Diagnostic, Diagnostics } from '@kubb/core'

/**
 * Renders diagnostics as a plain-text block for an AI assistant, through the same
 * `Diagnostics.format` the CLI uses for agents, without ANSI styling. Each entry keeps the stable
 * code, the source pointer, the cause, the fix, the underlying errors, the docs link, and the issue
 * tracker, so the agent can act on the problem rather than parsing a bare message.
 */
export function formatDiagnostics(diagnostics: ReadonlyArray<Diagnostic>): string {
  return diagnostics.map((diagnostic) => stripVTControlCharacters(Diagnostics.format(diagnostic, { audience: 'agent' }).join('\n'))).join('\n\n')
}

/**
 * The path with every symlink resolved. A path that does not exist yet resolves through its nearest existing parent.
 * Returns `undefined`, so the check fails closed, for a dangling symlink or any error other than a missing path.
 */
async function realPath(target: string): Promise<string | undefined> {
  const missing: Array<string> = []
  for (let current = target; ; current = path.dirname(current)) {
    try {
      return path.join(await realpath(current), ...missing)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') return undefined
      // `realpath` also reports ENOENT for a symlink whose target is gone; that link could later point anywhere.
      const isDanglingLink = await lstat(current).then(
        (stats) => stats.isSymbolicLink(),
        () => false,
      )
      if (isDanglingLink) return undefined
      if (path.dirname(current) === current) return undefined
      missing.unshift(path.basename(current))
    }
  }
}

/**
 * Whether `target`, after resolving symlinks, stays inside `base`. Fails closed when either path
 * cannot be resolved.
 */
export async function isRealPathInside({ target, base }: { target: string; base: string }): Promise<boolean> {
  const [real, realBase] = await Promise.all([realPath(target), realPath(base)])
  return real !== undefined && realBase !== undefined && isPathInside(real, realBase)
}

/**
 * Checks a config path the AI client supplies: it must carry a config extension and stay inside the
 * working directory. Returns the absolute path, or the reason it was refused.
 */
export async function checkConfigPath(configPath: string): Promise<{ file: string } | { error: string }> {
  const ext = path.extname(configPath)
  if (!CONFIG_EXTENSIONS.some((extension) => extension === ext)) {
    return { error: `Invalid config file extension "${ext}". Allowed: ${CONFIG_EXTENSIONS.join(', ')}` }
  }
  const base = path.resolve(process.cwd())
  const file = path.resolve(base, configPath)
  if (!(await isRealPathInside({ target: file, base }))) {
    return { error: 'Invalid config file path: must be within the current working directory' }
  }
  return { file }
}

/**
 * The most characters a tool returns as text. Claude Code warns above 10,000 tokens and cuts a
 * tool response at 25,000, and 30,000 characters of code or a diff stay under the first number.
 */
export const MAX_OUTPUT_CHARS = 30_000

/**
 * Cuts `text` so that it fits in `MAX_OUTPUT_CHARS` together with a notice that gives both sizes and
 * the text `hint` returns, so the AI client knows the output is partial and what to call next. The cut
 * falls on a line break when one is close to the limit, and never inside a surrogate pair. `hint` is
 * called only for a text that is cut. A text within the limit comes back as is.
 *
 * @example
 * `truncateOutput(output, () => 'Call kubb_diff with format "summary" for the full file list.')`
 */
export function truncateOutput(text: string, hint?: () => string | undefined): string {
  if (text.length <= MAX_OUTPUT_CHARS) return text
  const extra = hint?.()
  const notice = (shown: number) => `\n\n[Output cut: showing the first ${shown} of ${text.length} characters.${extra ? ` ${extra}` : ''}]`
  // The notice is sized with the full length, which has at least as many digits as the shown length.
  const room = Math.max(0, MAX_OUTPUT_CHARS - notice(text.length).length)
  // A line break far before the limit, as one very long line leaves, would drop most of the room.
  const lineEnd = text.lastIndexOf('\n', room)
  let end = lineEnd >= room * 0.75 ? lineEnd : room
  const last = text.charCodeAt(end - 1)
  if (last >= 0xd800 && last <= 0xdbff) end--
  const kept = text.slice(0, end)
  return `${kept}${notice(kept.length)}`
}

export type DiffFileSummary = {
  /**
   * The file path from the `+++` header, without the `b/` prefix.
   */
  file: string
  linesAdded: number
  linesRemoved: number
}

const HUNK_HEADER = /^@@ -\d+(?:,(\d+))? \+\d+(?:,(\d+))? @@/

/**
 * Counts one line inside a hunk on `file`, and returns how many lines of the old and the new
 * side it used: a context line uses one of each, and the `\ No newline at end of file` marker uses none.
 */
function countHunkLine(line: string, file: DiffFileSummary): { old: number; new: number } {
  if (line.startsWith('+')) {
    file.linesAdded++
    return { old: 0, new: 1 }
  }
  if (line.startsWith('-')) {
    file.linesRemoved++
    return { old: 1, new: 0 }
  }
  return line.startsWith('\\') ? { old: 0, new: 0 } : { old: 1, new: 1 }
}

const FILE_HEADER_LINES = [/^--- /, /^=+$/, /^Index: /]

/**
 * Removes the lines a patch prints above its `+++` line from the end of `lines`.
 */
function dropFileHeader(lines: Array<string>): void {
  for (const pattern of FILE_HEADER_LINES) {
    if (pattern.test(lines.at(-1) ?? '')) lines.pop()
  }
}

/**
 * Reads unified diff text, such as the output of `kubb generate --diff`. Returns the files with their
 * added and removed line counts, and `rest`: the lines outside a diff, such as the log and the warnings of the CLI.
 */
export function summarizeDiff(diff: string): { files: Array<DiffFileSummary>; rest: string } {
  const files: Array<DiffFileSummary> = []
  const rest: Array<string> = []
  let current: DiffFileSummary | undefined
  // Lines left in the current hunk. Counting them keeps a changed line that starts with `++ ` or `@@` from reading as a header.
  let oldLeft = 0
  let newLeft = 0
  for (const line of diff.split('\n')) {
    if (current && oldLeft + newLeft > 0) {
      const used = countHunkLine(line, current)
      oldLeft -= used.old
      newLeft -= used.new
      continue
    }
    const hunk = HUNK_HEADER.exec(line)
    if (hunk && current) {
      oldLeft = Number(hunk[1] ?? 1)
      newLeft = Number(hunk[2] ?? 1)
      continue
    }
    if (line.startsWith('+++ ')) {
      dropFileHeader(rest)
      current = { file: line.slice(4).split('\t')[0]!.replace(/^b\//, ''), linesAdded: 0, linesRemoved: 0 }
      files.push(current)
      continue
    }
    if (!line.startsWith('\\ No newline')) rest.push(line)
  }
  return { files, rest: rest.join('\n').trim() }
}
