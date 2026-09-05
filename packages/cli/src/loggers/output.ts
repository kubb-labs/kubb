import * as prompts from '@clack/prompts'
import { isRichOutput } from '../utils/env.ts'

type IntroOptions = {
  title: string
  /**
   * Printed under the title, in the logger's warning style.
   */
  warning: string
  /**
   * Whether to open a clack block that a later {@link logOutro} closes. Off for a command that
   * prints and exits, since nothing would ever close the block.
   */
  block: boolean
}

/**
 * Opens the command's output with a title and a warning under it.
 */
export function logIntro({ title, warning, block }: IntroOptions): void {
  if (block && isRichOutput()) {
    prompts.intro(title)
    prompts.log.warn(warning)

    return
  }

  console.log(title)
  console.warn(warning)
  console.log()
}

/**
 * Prints one block of lines: clack's gutter when the terminal can carry it, plain lines otherwise.
 */
export function logBlock(lines: string | Array<string>): void {
  if (isRichOutput()) {
    prompts.log.message(lines)

    return
  }

  console.log([lines].flat().join('\n'))
}

/**
 * Closes the block {@link logIntro} opened. `outro` is the closing gutter rather than a written
 * line, so plain output prints the text on its own.
 */
export function logOutro(text: string): void {
  if (isRichOutput()) {
    prompts.outro(text)

    return
  }

  console.log(text)
}

/**
 * A spinner, or null when the terminal cannot animate one. Callers drive it with `spinner?.start()`
 * so the same code path works either way.
 */
export function createSpinner(): ReturnType<typeof prompts.spinner> | null {
  return isRichOutput() ? prompts.spinner() : null
}
