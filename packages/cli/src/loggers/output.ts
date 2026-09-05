import * as prompts from '@clack/prompts'
import { isRichOutput } from '../utils/env.ts'

/**
 * Prefixes the plain writers use, the same ones `plainLogger` prints, so a command's own output
 * and the hook output around it read as one stream.
 */
const SYMBOLS = { info: 'ℹ', warn: '⚠', error: '✗', step: '◇' } as const

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
