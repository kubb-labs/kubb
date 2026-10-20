import type { DiagnosticFormatOptions } from '@kubb/core'

/**
 * How a run ended, which decides the symbol a group closes on.
 */
export type LogStatus = 'success' | 'failed'

/**
 * A step whose end is not known when it starts. Rich output animates it; plain output prints each
 * message it is given.
 */
export type WriterSpinner = {
  start: (text: string) => void
  message: (text: string) => void
  clear: () => void
  stop: (text: string) => void
  error: (text: string) => void
}

/**
 * A step with a known number of items to work through.
 */
export type WriterProgress = {
  start: (text: string) => void
  advance: (text: string) => void
  stop: (text: string) => void
}

/**
 * How one logger draws. `installLogger` decides what a run says and in what order; a writer
 * decides only how each line looks, so every logger reports the same run the same way.
 */
export type LoggerWriter = {
  /** Who reads this output, which picks the diagnostic format and whether problems wait to be grouped. */
  audience: DiagnosticFormatOptions['audience']
  /**
   * Opens a group. Every `group` is closed by a {@link LoggerWriter.groupEnd}.
   */
  group: (title: string) => void
  groupEnd: (text: string) => void
  step: (text: string) => void
  info: (text: string) => void
  success: (text: string) => void
  warn: (text: string) => void
  error: (text: string) => void
  /**
   * Lines belonging to the step above them, drawn as one block.
   */
  block: (lines: Array<string>) => void
  /**
   * A subprocess's own output, drawn outside the group so it reads as its block.
   */
  raw: (lines: Array<string>) => void
  /**
   * A coded diagnostic's headline and its indented detail rows.
   */
  diagnostic: (lines: Array<string>) => void
  /**
   * The "update available" notice, which gets a frame of its own where one can be drawn.
   */
  update: (lines: Array<string>, title: string) => void
  spinner: () => WriterSpinner
  progress: (max: number) => WriterProgress
}
