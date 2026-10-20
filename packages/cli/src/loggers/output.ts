import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { stripVTControlCharacters, styleText } from 'node:util'
import * as prompts from '@clack/prompts'
import { formatMs, getElapsedMs } from '@internals/utils'
import type { FileChange } from '../runners/generate/utils.ts'
import { isRichOutput } from '../utils/env.ts'
import { type Expression, getIntro, wakeUp } from './banner.ts'
import { clackWriter } from './clackLogger.ts'
import type { LoggerWriter, WriterSpinner } from './defineLogger.ts'
import { plainWriter, SYMBOLS } from './plainLogger.ts'

const SPONSOR_TIPS = [
  'Your sponsorship keeps Kubb codegen, plugins, and docs maintained',
  'Sponsor faster generators and better Kubb Studio workflows',
  'Help keep Kubb free for TypeScript teams building APIs',
  'Support React Query, Zod, Faker, and MSW integrations',
  'Back open-source tools that turn OpenAPI into TypeScript',
  'Sponsor fixes, releases, and new plugins for your API workflow',
  'Help Kubb stay independent and focused on developer tools',
] as const

const SPONSOR_LINKS = ['https://github.com/sponsors/stijnvanhulle', 'https://opencollective.com/kubb', 'https://kubb.dev/sponsors'] as const

/** The writer the loggers draw with on this terminal, so a command's own lines look like its run. */
function writer(): LoggerWriter {
  return isRichOutput() ? clackWriter : plainWriter
}

function nextTip(): string {
  const tip = SPONSOR_TIPS[Math.floor(Math.random() * SPONSOR_TIPS.length)]!
  const link = SPONSOR_LINKS[Math.floor(Math.random() * SPONSOR_LINKS.length)]!
  return `${tip}: ${link}`
}

function formatTip(tip: string): string {
  return styleText('magenta', ' Tip  ') + styleText('yellow', tip)
}

/**
 * Prints one random tip outside every group. Rich terminals get the styled variant;
 * plain/CI output gets a stable text-only line so the tip is still visible as final output.
 */
export function logTip(): void {
  const tip = nextTip()
  if (!isRichOutput()) {
    console.log(`Tip: ${tip}`)
    return
  }

  console.log(`${styleText('magenta', '✦')}${formatTip(tip)}`)
}

type Level = keyof typeof SYMBOLS

// Not through the writers: in plain output a command's own info and warning carry their symbol, and clack's step keeps its spacing.
function write(level: Level, message: string): void {
  if (isRichOutput()) {
    prompts.log[level](message)

    return
  }

  console.log(`${SYMBOLS[level]} ${message}`)
}

type IntroOptions = {
  title?: string
  /**
   * Printed under the title, for a command that has a caveat to lead with.
   */
  warning?: string
  /**
   * Whether to open a block a later {@link logOutro} closes. Pass `false` for a command that
   * prints and exits, since nothing would ever close the block.
   *
   * @default true
   */
  block?: boolean
}

/**
 * Opens a command's output. A command the banner already names passes no title.
 */
export function logIntro({ title, warning, block = true }: IntroOptions): void {
  if (block && isRichOutput()) {
    if (title) prompts.intro(title)

    if (warning) {
      prompts.log.warn(warning)
    }

    return
  }

  if (title) {
    console.log(title)
  }

  if (warning) {
    console.warn(warning)
  }

  if (title || warning) {
    console.log()
  }
}

/**
 * Closes the block {@link logIntro} opened. The closing gutter is not a written line, so plain
 * output prints the text on its own.
 */
export function logOutro(text: string): void {
  writer().groupEnd(text)
}

/**
 * Finishes a command with its outcome and duration before the labeled details.
 * A command with prompts closes its existing block; validation writes a standalone summary.
 */
export function logCommandSummary({
  title,
  status,
  hrStart,
  lines,
  block = false,
}: {
  title: string
  status: 'success' | 'failed' | 'warning' | 'planned' | 'canceled'
  hrStart: [number, number]
  lines: ReadonlyArray<string>
  block?: boolean
}): void {
  const colors = { success: 'green', failed: 'red', warning: 'yellow', planned: 'cyan', canceled: 'dim' } as const
  const symbols = { success: '✓', failed: '✗', warning: '!', planned: '◇', canceled: '○' } as const
  const summary = [`${styleText(colors[status], `${symbols[status]} ${title}`)}  ${styleText('dim', formatMs(getElapsedMs(hrStart)))}`, '', ...lines].join('\n')
  if (block) {
    logOutro(summary)
    return
  }
  if (status === 'failed') {
    console.error(summary)
    return
  }
  console.log(summary)
}

/**
 * Prints one empty line between two groups, without clack's gutter bar, since the bar belongs to a
 * group and a spacer sits outside every one.
 */
export function logSpacer(): void {
  console.log('')
}

function bannerIntro(version: string, expression: Expression, command: string): string {
  return getIntro({ title: 'Turn your API spec into type-safe code', description: `kubb ${command}`, version, expression })
}

/** Whether the mascot can be drawn: a rich, 256-color terminal wide enough that no line wraps and throws off a redraw. */
function canDrawMascot(version: string, command: string): boolean {
  if (!isRichOutput() || !process.stdout.hasColors(256)) return false

  return stripVTControlCharacters(bannerIntro(version, 'open', command))
    .split('\n')
    .every((line) => line.length <= process.stdout.columns)
}

/** Whether a run stops to ask something: no `--yes`, no `--dry-run`, and a person at a terminal. */
export function isInteractiveRun({ yes, dryRun }: { yes?: unknown; dryRun?: unknown }): boolean {
  return !yes && !dryRun && process.stdin.isTTY === true
}

/**
 * Whether a command opens with the mascot. Only the long-running ones do: `generate`, a Studio
 * session or pairing, and `add` or `update` while they ask questions. Quick commands print only
 * their result.
 */
export function wantsMascot({ commandPath, values }: { commandPath: ReadonlyArray<string>; values: Record<string, unknown> }): boolean {
  const [command, subCommand] = commandPath
  if (values.help || values.version) return false
  if (command === 'studio') return subCommand === undefined || subCommand === 'connect' || subCommand === 'login'
  if (command === 'add' || command === 'update' || command === 'init') return isInteractiveRun({ yes: values.yes, dryRun: values.dryRun ?? values['dry-run'] })

  return command === undefined || command === 'generate'
}

/**
 * The still Kubb mascot with the version and the running command, such as `studio connect`, or a
 * single version line where the terminal cannot draw it. Commands print it as their header; it
 * draws at once, with no wake-up frames.
 */
export function getBanner(version: string, command: string): string {
  return canDrawMascot(version, command) ? `\n${bannerIntro(version, 'open', command)}` : `Kubb CLI v${version}`
}

/**
 * Opens `kubb generate` with the mascot playing its wake-up frames in place, which takes under a
 * second and overlaps the config load. Elsewhere the still {@link getBanner} is the header.
 */
export async function logBanner(version: string): Promise<void> {
  if (!canDrawMascot(version, 'generate')) {
    console.log(getBanner(version, 'generate'))

    return
  }

  console.log('')
  for (const [index, [expression, ms]] of wakeUp.entries()) {
    const frame = bannerIntro(version, expression, 'generate')
    if (index > 0) process.stdout.moveCursor(0, -frame.split('\n').length)
    console.log(frame)
    await sleep(ms)
  }
}

/** Pads each column to its widest cell, one line per row. */
export function formatTable(rows: ReadonlyArray<ReadonlyArray<string>>): Array<string> {
  const widths = Array.from({ length: Math.max(0, ...rows.map((row) => row.length)) }, (_, index) => Math.max(...rows.map((row) => row[index]?.length ?? 0)))
  return rows.map((row) =>
    row
      .map((cell, index) => cell.padEnd(widths[index]!))
      .join('  ')
      .trimEnd(),
  )
}

const fileStatusStyle = { A: 'green', M: 'yellow', D: 'red' } as const

/** Changed files listed before the rest collapse into one line. */
const FILE_LIST_LIMIT = 10

/** Lists added, modified or removed files, each `M` with its line counts when known, then counts the rest. */
export function logFileChanges(files: ReadonlyArray<FileChange>): void {
  if (!files.length) return

  const rows = files.slice(0, FILE_LIST_LIMIT).map(({ status, path: filePath, added, removed }) => {
    const lines = added || removed ? `  ${styleText('green', `+${added ?? 0}`)} ${styleText('red', `-${removed ?? 0}`)}` : ''
    return `${styleText(fileStatusStyle[status], status)} ${styleText('cyan', path.relative(process.cwd(), filePath))}${lines}`
  })
  const more = files.length - rows.length
  logBlock(more > 0 ? [...rows, styleText('dim', `… ${more} more`)] : rows)
}

/** Prints lines as one block, without a symbol in front of them. Not the writer's block, which drops clack's spacing around it. */
export function logBlock(lines: string | Array<string>): void {
  if (isRichOutput()) {
    prompts.log.message(lines)

    return
  }

  console.log([lines].flat().join('\n'))
}

export function logInfo(message: string): void {
  write('info', message)
}

export function logWarn(message: string): void {
  write('warn', message)
}

export function logError(message: string): void {
  write('error', message)
}

/**
 * Reports a step the command is taking, rather than something it found.
 */
export function logStep(message: string): void {
  write('step', message)
}

/**
 * A progress spinner, or a writer that prints each message it is given when the terminal cannot
 * animate one. Callers drive both the same way, including the failure state.
 */
export function createSpinner(): WriterSpinner {
  return writer().spinner()
}

/** How long a wait may run before a spinner shows, so a fast answer draws nothing. */
const SPINNER_DELAY_MS = 150

/**
 * Awaits `promise`, showing a spinner with `message` only when it takes longer than 150 ms.
 */
export async function withSpinner<T>({ promise, message }: { promise: Promise<T>; message: string }): Promise<T> {
  let spinner: WriterSpinner | undefined
  const timer = setTimeout(() => {
    spinner = createSpinner()
    spinner.start(message)
  }, SPINNER_DELAY_MS)
  try {
    return await promise
  } finally {
    clearTimeout(timer)
    spinner?.clear()
  }
}
