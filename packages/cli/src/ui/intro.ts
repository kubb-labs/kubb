import { styleText } from 'node:util'
import * as prompts from '@clack/prompts'
import { isRichOutput } from '../utils/env.ts'
import { writer } from './log.ts'

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
 * Prints one empty line between two groups, without clack's gutter bar, since the bar belongs to a
 * group and a spacer sits outside every one.
 */
export function logSpacer(): void {
  console.log('')
}

/** Whether a run stops to ask something: no `--yes`, no `--dry-run`, and a person at a terminal. */
export function isInteractiveRun({ yes, dryRun }: { yes?: unknown; dryRun?: unknown }): boolean {
  return !yes && !dryRun && process.stdin.isTTY === true
}
