import { styleText } from 'node:util'
import * as prompts from '@clack/prompts'
import { isRichOutput } from '../utils/env.ts'
import { getIntro } from './banner.ts'

/**
 * Prefixes the plain writers use, the same ones `plainLogger` prints, so a command's own output
 * and the hook output around it read as one stream.
 */
const SYMBOLS = { info: 'ℹ', warn: '⚠', error: '✗', step: '◇' } as const

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

const TIP_ROTATION_INTERVAL_MS = 30_000
const MAX_ROTATING_TIPS = 1

let tipIndex = Math.floor(Math.random() * SPONSOR_TIPS.length)

function nextTip(): string {
  const tip = SPONSOR_TIPS[tipIndex]!
  tipIndex = (tipIndex + 1) % SPONSOR_TIPS.length

  return `${tip}: ${SPONSOR_LINKS[Math.floor(Math.random() * SPONSOR_LINKS.length)]}`
}

function formatTip(tip: string): string {
  return styleText('magenta', ' Tip  ') + styleText('yellow', tip)
}

/**
 * Prints the next rotating tip outside every group. Rich terminals get the styled variant;
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

type TipRotationOptions = {
  intervalMs?: number
  /**
   * How many tips to show before the rotation stops on its own. Pass
   * `Number.POSITIVE_INFINITY` for a command that keeps running, such as a `kubb studio` session
   * waiting for jobs.
   *
   * @default 1
   */
  max?: number
  /**
   * Asked before each tip. A `false` answer skips that turn without stopping the rotation, so a tip
   * never lands in the middle of a run.
   */
  isIdle?: () => boolean
  /** Called immediately before a rotating tip is written. */
  beforeTip?: () => void
  /** Called immediately after a rotating tip is written. */
  afterTip?: () => void
}

/**
 * Rotates tips during an interactive long-running command. Returns the function that stops it.
 *
 * @example A session that tips every five minutes it sits idle
 * ```ts
 * const stop = startTipRotation({ intervalMs: 300_000, max: Number.POSITIVE_INFINITY, isIdle })
 * ```
 */
export function startTipRotation({
  intervalMs = TIP_ROTATION_INTERVAL_MS,
  max = MAX_ROTATING_TIPS,
  isIdle,
  beforeTip,
  afterTip,
}: TipRotationOptions = {}): () => void {
  if (!isRichOutput()) return () => {}

  let shown = 0
  const timer = setInterval(() => {
    if (isIdle && !isIdle()) {
      return
    }

    beforeTip?.()
    logTip()
    afterTip?.()
    shown++
    if (shown >= max) clearInterval(timer)
  }, intervalMs)
  timer.unref()

  return () => clearInterval(timer)
}

type Level = keyof typeof SYMBOLS

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
  if (isRichOutput()) {
    prompts.outro(text)

    return
  }

  console.log(text)
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
 * cannot draw it.
 */
export function logBanner(version: string): void {
  if (isRichOutput()) {
    console.log(`\n${getIntro({ title: 'The meta framework for code generation', description: 'Ready to start', version, areEyesOpen: true })}\n`)

    return
  }

  console.log(`Kubb CLI v${version}`)
}

/**
 * Prints lines as one block, without a symbol in front of them.
 */
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

type Spinner = {
  start: (message?: string) => void
  stop: (message?: string) => void
  /**
   * Ends the step as failed, so a phase that went wrong does not read as finished.
   */
  error: (message?: string) => void
  message: (message?: string) => void
}

/**
 * A progress spinner, or a writer that prints each message it is given when the terminal cannot
 * animate one. Callers drive both the same way, including the failure state.
 */
export function createSpinner(): Spinner {
  if (isRichOutput()) {
    return prompts.spinner()
  }

  const print = (message?: string) => {
    if (message) {
      console.log(message)
    }
  }

  return {
    start: print,
    stop: print,
    error: (message?: string) => {
      if (message) {
        console.log(`${SYMBOLS.error} ${message}`)
      }
    },
    message: print,
  }
}
