import { styleText } from 'node:util'
import * as prompts from '@clack/prompts'
import { isRichOutput } from '../utils/env.ts'

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

const tips = { sponsor: SPONSOR_TIPS, studio: SPONSOR_TIPS } as const

const SPONSOR_LINKS = ['https://github.com/sponsors/stijnvanhulle', 'https://opencollective.com/kubb', 'https://kubb.dev/sponsors'] as const

const TIP_ROTATION_INTERVAL_MS = 30_000
const MAX_ROTATING_TIPS = 1

type TipGroup = keyof typeof tips

const tipIndexes: Record<TipGroup, number> = {
  sponsor: Math.floor(Math.random() * tips.sponsor.length),
  studio: Math.floor(Math.random() * tips.studio.length),
}

function nextTip(group: TipGroup = 'sponsor'): string {
  const groupTips = tips[group]
  const tip = groupTips[tipIndexes[group]]!
  tipIndexes[group] = (tipIndexes[group] + 1) % groupTips.length

  return `${tip}: ${SPONSOR_LINKS[Math.floor(Math.random() * SPONSOR_LINKS.length)]}`
}

function formatTip(tip: string): string {
  const text = ` Tip  ${tip}`
  const labelLength = ' Tip  '.length

  return styleText('magenta', text.slice(0, labelLength)) + styleText('yellow', text.slice(labelLength))
}

/**
 * Prints the next rotating tip as a highlighted message.
 */
export function logTip(group: TipGroup = 'sponsor'): void {
  if (isRichOutput()) {
    console.log(`\n${styleText('magenta', '✦')}${formatTip(nextTip(group))}`)
  }
}

/**
 * Rotates tips during an interactive long-running command.
 */
export function startTipRotation(group: TipGroup = 'sponsor'): () => void {
  if (!isRichOutput()) return () => {}

  let shown = 0
  const timer = setInterval(() => {
    logTip(group)
    shown++
    if (shown >= MAX_ROTATING_TIPS) clearInterval(timer)
  }, TIP_ROTATION_INTERVAL_MS)
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
  title: string
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
    prompts.intro(title)

    if (warning) {
      prompts.log.warn(warning)
    }

    return
  }

  console.log(title)

  if (warning) {
    console.warn(warning)
  }

  console.log()
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
  stop: (message?: string, code?: number) => void
  message: (message?: string) => void
}

/**
 * A progress spinner, or a writer that prints each message it is given when the terminal cannot
 * animate one. Callers drive both the same way.
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

  return { start: print, stop: print, message: print }
}
