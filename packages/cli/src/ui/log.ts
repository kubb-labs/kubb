import * as prompts from '@clack/prompts'
import { isRichOutput } from '../utils/env.ts'
import { clackWriter } from '../loggers/clackLogger.ts'
import type { LoggerWriter } from '../loggers/defineLogger.ts'
import { plainWriter, SYMBOLS } from '../loggers/plainLogger.ts'

/** The writer the loggers draw with on this terminal, so a command's own lines look like its run. */
export function writer(): LoggerWriter {
  return isRichOutput() ? clackWriter : plainWriter
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
