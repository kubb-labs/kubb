import { isAbsolute, relative } from 'node:path'
import { styleText } from 'node:util'
import { formatMs } from '@internals/utils'
import { host } from '../host.ts'
import type { FileChanges } from '../createReporter.ts'
import { LOCKFILE_NAME } from '../lockfile.ts'
import type { Report } from './report.ts'

/**
 * Writes the summary through the host's output, or plain console lines by default.
 */
export type SummaryRenderer = (lines: ReadonlyArray<string>, meta: { title: string; status: 'success' | 'failed' }) => void

const separator = styleText('dim', ' · ')
const statusTones = { added: 'green', modified: 'yellow', deleted: 'red' } as const

function plural(count: number, word: string): string {
  return `${count} ${count === 1 ? word : `${word}s`}`
}

function lineCounts({ linesAdded, linesRemoved }: Pick<FileChanges, 'linesAdded' | 'linesRemoved'>): string {
  return `${styleText(linesAdded ? 'green' : 'dim', `+${linesAdded}`)} ${styleText(linesRemoved ? 'red' : 'dim', `−${linesRemoved}`)}`
}

const patchLineColors = [
  ['@@', 'cyan'],
  ['+', 'green'],
  ['-', 'red'],
  ['\\', 'dim'],
] as const

/** The hunks of a unified diff, indented under their file. The `=====`, `---`, and `+++` header lines repeat the file line, so they go. */
function patchLines(patch: string): Array<string> {
  const lines = patch.split('\n')
  const start = lines.findIndex((line) => line.startsWith('@@'))

  return lines.slice(start === -1 ? lines.length : start).map((line) => {
    const color = patchLineColors.find(([prefix]) => line.startsWith(prefix))?.[1]
    return `    ${color ? styleText(color, line) : line}`
  })
}

/**
 * One block per out-of-date file: its status, path, and line counts, then its hunks when the check
 * holds a diff. Like `git diff` or Biome, a file's diff sits under the file instead of in a list of its own.
 */
function fileBlocks({ check }: Report): Array<string> {
  if (!check?.changed) return []
  // A loop, not `Math.max(...)`: a first check can list thousands of files, and a spread that long can overflow the stack.
  const pathWidth = check.files.reduce((width, file) => Math.max(width, file.path.length), 0)
  const lines: Array<string> = []
  for (const file of check.files) {
    const head = `  ${styleText(statusTones[file.status], file.status.padEnd(8))}  ${file.path.padEnd(pathWidth)}  ${lineCounts(file)}`
    if (!file.patch) {
      lines.push(head)
      continue
    }
    lines.push(head, ...patchLines(file.patch), '')
  }
  if (lines.at(-1) !== '') lines.push('')

  return lines
}

/** A warning the reader needs before the verdict, such as why formatted files show as out of date. */
function warningLines({ check }: Report): Array<string> {
  if (!check?.lockfile) return []
  const message =
    check.lockfile === 'missing'
      ? `No readable ${LOCKFILE_NAME}, so a file the formatter or linter changed shows as out of date. Run \`kubb generate\` and commit ${LOCKFILE_NAME}.`
      : `--no-lockfile is set, so a file the formatter or linter changed shows as out of date. Remove it to compare through ${LOCKFILE_NAME}.`

  return [styleText('yellow', `⚠ ${message}`), '']
}

/** `70 unchanged (3 via kubb-lock.json)`, the way a package manager counts the packages it reused. */
function unchangedText({ filesUnchanged, filesFromLockfile }: Report, word: string): string | undefined {
  if (!filesUnchanged) return undefined
  const via = filesFromLockfile ? ` (${filesFromLockfile} via ${LOCKFILE_NAME})` : ''

  return `${filesUnchanged} ${word}${via}`
}

type Verdict = { text: string; tone: 'red' | 'yellow' | 'green' | 'cyan' }

const joinParts = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(separator)

function failedVerdict({ counts, plugins }: Report): Verdict {
  const failed = plugins.failed.length ? `${plugins.failed.join(', ')} failed` : undefined

  return { text: joinParts('✗ Generation failed', counts.errors ? plural(counts.errors, 'error') : undefined, failed), tone: 'red' }
}

function checkVerdict(report: Report, check: NonNullable<Report['check']>): Verdict {
  if (check.changed) return { text: joinParts(`✗ ${plural(check.files.length, 'file')} out of date`, unchangedText(report, 'up to date')), tone: 'red' }
  const via = report.filesFromLockfile ? `${report.filesFromLockfile} via ${LOCKFILE_NAME}` : undefined

  return { text: joinParts(`✓ ${plural(report.filesCreated, 'file')} up to date`, via), tone: report.counts.warnings ? 'yellow' : 'green' }
}

function runVerdict(report: Report): Verdict {
  const { dryRun, counts, filesCreated, fileChanges } = report
  const tone = counts.warnings ? 'yellow' : 'green'
  const changed = fileChanges ? fileChanges.added + fileChanges.modified + fileChanges.deleted : 0
  const unchanged = unchangedText(report, 'unchanged')
  if (dryRun)
    return { text: joinParts(changed ? `◇ Dry run: ${plural(changed, 'file')} would change` : '◇ Dry run: no files would change', unchanged), tone: 'cyan' }
  if (!fileChanges) return { text: `✓ Generated ${plural(filesCreated, 'file')}`, tone }

  return { text: joinParts(changed ? `✓ Generated ${plural(changed, 'file')}` : '✓ Already up to date', unchanged), tone }
}

/** The verdict: one line that says what happened, with the file counts. It is the line a reader looks for, so it comes last. */
function verdict(report: Report): Verdict {
  if (report.status === 'failed') return failedVerdict(report)
  if (report.check) return checkVerdict(report, report.check)

  return runVerdict(report)
}

/** `1 added · 1 modified · 1 deleted · +2 −2`, only the kinds of change that happened. */
function changeLine({ fileChanges }: Report): string | undefined {
  if (!fileChanges) return undefined
  const kinds = (['added', 'modified', 'deleted'] as const).filter((kind) => fileChanges[kind] > 0)
  if (!kinds.length) return undefined

  return [...kinds.map((kind) => styleText(statusTones[kind], `${fileChanges[kind]} ${kind}`)), lineCounts(fileChanges)].join(separator)
}

/** What to run next, when the run left something to do. */
function fixLine({ check, dryRun, status }: Report): string | undefined {
  if (status === 'failed') return undefined
  if (check?.changed) {
    const hasDiff = check.files.some((file) => file.patch)
    return hasDiff ? 'Run `kubb generate` to update them.' : 'Run `kubb generate` to update them, or `kubb generate --diff` to see the changes.'
  }
  if (dryRun && !check) return 'Nothing was written. Run `kubb generate` to write the files.'

  return undefined
}

/** How the plugins did: `2 plugins` when all passed, otherwise how many failed or did not run. */
function pluginText({ plugins }: Report): string {
  const { total, passed, failed } = plugins
  if (!total) return 'no plugins configured'
  if (failed.length) return `${failed.length} of ${plural(total, 'plugin')} failed`
  if (passed < total) return `${total - passed} of ${plural(total, 'plugin')} not run`

  return plural(total, 'plugin')
}

/** `Finished in 218ms · ./src/gen · 2 plugins · 1 warning`, the run's details after the verdict. */
function finishedLine(report: Report): string {
  const { durationMs, output, counts, status } = report
  const destination = relative(host.cwd(), output)
  const displayPath = destination.startsWith('..') || isAbsolute(destination) ? output : `./${destination}`
  const parts = [
    `Finished in ${formatMs(durationMs)}`,
    displayPath,
    pluginText(report),
    // A failed run names its errors in the verdict.
    counts.errors && status !== 'failed' ? plural(counts.errors, 'error') : undefined,
    counts.warnings ? plural(counts.warnings, 'warning') : undefined,
  ]

  return styleText('dim', parts.filter(Boolean).join(' · '))
}

/**
 * Details first and the verdict last, the way `oxlint`, `oxfmt --check`, and `pnpm` end a run: the
 * out-of-date files with their diffs, then warnings, then one verdict line, the kinds of change,
 * what to run next, and the run's details. Verbose output adds plugin timings.
 */
export function formatSummary(report: Report, { showTimings }: { showTimings: boolean }): Array<string> {
  const { text, tone } = verdict(report)
  // A blank line sets the summary apart from the build log above it.
  const lines = ['', ...fileBlocks(report), ...warningLines(report), styleText(tone, text)]
  for (const line of [changeLine(report), fixLine(report), finishedLine(report)]) {
    if (line) lines.push(`  ${line}`)
  }

  const { timings } = report
  if (showTimings && timings.length > 0) {
    const nameWidth = Math.max(...timings.map((timing) => timing.plugin.length))
    lines.push('', styleText('dim', 'Plugin timings'))
    for (const timing of timings) lines.push(`  ${timing.plugin.padEnd(nameWidth)}  ${styleText('dim', formatMs(timing.durationMs))}`)
  }

  return lines
}
