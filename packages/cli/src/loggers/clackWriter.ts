import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import type { LoggerWriter } from './types.ts'

/**
 * Draws with clack for local development: a gutter bar per group, animated steps, and a progress
 * bar for the writes.
 */
export const clackWriter: LoggerWriter = {
  audience: 'human',
  group: (title) => clack.intro(title),
  groupEnd: (text) => clack.outro(text),
  step: (text) => clack.log.step(text, { spacing: 0 }),
  info: (text) => clack.log.info(text),
  success: (text) => clack.log.success(text),
  warn: (text) => clack.log.warn(text),
  error: (text) => clack.log.error(text),
  block: (lines) => clack.log.message(lines, { spacing: 0 }),
  // A subprocess's output is not Kubb's tree, so it goes out past clack and its gutter bar. The
  // step above it is already stopped by the time this runs.
  raw: (lines) => console.log(styleText('dim', lines.join('\n'))),
  // The diagnostic carries its own code and indented rows, so clear clack's gutter and bar and let
  // the block stand on its own.
  diagnostic: (lines) => clack.log.message(lines, { symbol: '', secondarySymbol: '' }),
  update: (lines, title) =>
    clack.box(lines.join('\n'), title, {
      width: 'auto',
      formatBorder: (border: string) => styleText('yellow', border),
      rounded: true,
      withGuide: false,
      contentAlign: 'center',
      titleAlign: 'center',
    }),
  spinner: () => clack.spinner(),
  progress(max) {
    const bar = clack.progress({ style: 'block', max, size: 30 })

    return {
      start: (text) => bar.start(text),
      advance: (text) => bar.advance(1, text),
      stop: (text) => bar.stop(text),
    }
  },
}
