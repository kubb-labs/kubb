import { styleText } from 'node:util'
import { formatMs } from '@internals/utils'

/**
 * Colors for each part of the Kubb mascot illustration.
 */
const palette = {
  /**
   * Top cap of the skittle.
   */
  lid: (text: string) => styleText('red', text),
  /**
   * Wood body.
   */
  wood: (text: string) => styleText('yellow', text),
  /**
   * Base wood body.
   */
  woodBase: (text: string) => styleText(['dim', 'yellow'], text),
  /**
   * Eye whites.
   */
  eye: (text: string) => styleText('white', text),
  /**
   * Highlight accent.
   */
  highlight: (text: string) => styleText('gray', text),
  /**
   * Cheek blush.
   */
  blush: (text: string) => styleText('magenta', text),
}

/**
 * Generates the Kubb mascot welcome banner as an ANSI-colored string.
 *
 * @example
 * ```ts
 * console.log(getIntro({ title: 'kubb.config.ts', description: 'generating…', version: '5.0.0', areEyesOpen: true }))
 * ```
 */
export function getIntro({
  title,
  description,
  version,
  areEyesOpen,
}: {
  /**
   * Name of the active configuration or tool being started.
   */
  title: string
  /**
   * Short subtitle shown next to the arrow prompt.
   */
  description: string
  /**
   * Kubb version string rendered in the header.
   */
  version: string
  /**
   * When `false` the eyes are shown as closed dashes instead of open blocks.
   */
  areEyesOpen: boolean
}): string {
  const kubbVersion = styleText(['bold', 'yellow'], `KUBB v${version}`)

  const eyeTop = areEyesOpen ? palette.eye('█▀█') : palette.eye('───')
  const eyeBottom = areEyesOpen ? palette.eye('▀▀▀') : palette.eye('───')

  return [
    `   ${palette.lid('▄▄▄▄▄▄▄▄▄▄▄▄▄')}`,
    `  ${palette.wood('█  ')}${palette.highlight('▄▄')}${palette.wood('     ')}${palette.highlight('▄▄')}${palette.wood('  █')} ${kubbVersion}`,
    `  ${palette.wood('█ ')}${eyeTop}${palette.wood('     ')}${eyeTop}${palette.wood(' █')} ${styleText('gray', title)}`,
    `  ${palette.wood('█ ')}${eyeBottom}${palette.wood('  ')}${palette.blush('◡')}${palette.wood('  ')}${eyeBottom}${palette.wood(' █')} ${styleText('yellow', '➜')} ${styleText('white', description)}`,
    `   ${palette.woodBase('▀▀▀▀▀▀▀▀▀▀▀▀▀')}`,
  ].join('\n')
}

/**
 * Formats a millisecond duration with a threshold-based ANSI color.
 * `≤ 500 ms` → green · `≤ 1 000 ms` → yellow · `> 1 000 ms` → red.
 *
 * @example
 * ```ts
 * formatMsWithColor(200)  // '\x1b[32m200ms\x1b[39m'
 * formatMsWithColor(800)  // '\x1b[33m800ms\x1b[39m'
 * formatMsWithColor(1500) // '\x1b[31m1.50s\x1b[39m'
 * ```
 */
export function formatMsWithColor(ms: number): string {
  const formatted = formatMs(ms)
  if (ms <= 500) return styleText('green', formatted)
  if (ms <= 1000) return styleText('yellow', formatted)

  return styleText('red', formatted)
}
