import { setTimeout as sleep } from 'node:timers/promises'
import { stripVTControlCharacters, styleText } from 'node:util'
import * as prompts from '@clack/prompts'
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
 * A command worth running next, which takes the tip's place.
 */
type NextStep = {
  command: string
  description: string
}

/**
 * Prints one tip outside every group: the `next` step when there is one, otherwise a random
 * sponsor tip. Rich terminals get the styled variant; plain/CI output gets a stable text-only line
 * so the tip is still visible as final output.
 */
export function logTip(next?: NextStep): void {
  if (next) {
    console.log(
      isRichOutput()
        ? `  ${styleText('dim', 'Next')}  ${styleText('cyan', next.command)}  ${styleText('dim', next.description)}`
        : `Next: ${next.command} (${next.description})`,
    )
    return
  }

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
 * Opens a command's output with its title.
 */
export function logIntro({ title, warning, block = true }: IntroOptions): void {
  if (block && isRichOutput()) {
    if (title) {
      prompts.intro(title)
    }

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
 * Prints one empty line between two groups, without clack's gutter bar, since the bar belongs to a
 * group and a spacer sits outside every one.
 */
export function logSpacer(): void {
  console.log('')
}

/**
 * Opens the command with the Kubb mascot and version, or a single version line where the terminal
 * cannot draw it. The mascot first plays its wake-up frames in place, which takes under a second.
 */
export async function logBanner(version: string): Promise<void> {
  const intro = (expression: Expression) => getIntro({ title: 'Turn your API spec into type-safe code', description: 'Ready to start', version, expression })
  // A line wider than the terminal wraps and throws off the redraw, so a narrow terminal gets the plain line too.
  const fits = () =>
    stripVTControlCharacters(intro('open'))
      .split('\n')
      .every((line) => line.length <= process.stdout.columns)

  if (!isRichOutput() || !process.stdout.hasColors(256) || !fits()) {
    console.log(`Kubb CLI v${version}`)

    return
  }

  console.log('')
  for (const [index, [expression, ms]] of wakeUp.entries()) {
    const frame = intro(expression)
    if (index > 0) process.stdout.moveCursor(0, -frame.split('\n').length)
    console.log(frame)
    await sleep(ms)
  }
  console.log('')
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
