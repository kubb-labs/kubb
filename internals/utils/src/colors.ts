import { createHash } from 'node:crypto'
import { styleText } from 'node:util'
import { formatMs } from './time.ts'

/**
 * Parsed RGB channels from a CSS hex color string.
 */
type RGB = { r: number; g: number; b: number }

/**
 * Parses a CSS hex color string (`#RGB`) into its RGB channels.
 * Falls back to `255` for any channel that cannot be parsed.
 */
function parseHex(color: string): RGB {
  const int = Number.parseInt(color.replace('#', ''), 16)
  return Number.isNaN(int) ? { r: 255, g: 255, b: 255 } : { r: (int >> 16) & 0xff, g: (int >> 8) & 0xff, b: int & 0xff }
}

/**
 * Returns a function that wraps a string in a 24-bit ANSI true-color escape sequence
 * for the given hex color.
 */
function hex(color: string): (text: string) => string {
  const { r, g, b } = parseHex(color)
  return (text: string) => `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`
}

function gradient(colorStops: string[], text: string): string {
  const chars = text.split('')
  return chars
    .map((char, i) => {
      const t = chars.length <= 1 ? 0 : i / (chars.length - 1)
      const seg = Math.min(Math.floor(t * (colorStops.length - 1)), colorStops.length - 2)
      const lt = t * (colorStops.length - 1) - seg
      const from = parseHex(colorStops[seg]!)
      const to = parseHex(colorStops[seg + 1]!)
      const r = Math.round(from.r + (to.r - from.r) * lt)
      const g = Math.round(from.g + (to.g - from.g) * lt)
      const b = Math.round(from.b + (to.b - from.b) * lt)
      return `\x1b[38;2;${r};${g};${b}m${char}\x1b[0m`
    })
    .join('')
}

/**
 * ANSI color functions for each part of the Kubb mascot illustration.
 */
const palette = {
  /**
   * Top cap of the skittle.
   */
  lid: hex('#F55A17'),
  /**
   * Upper wood body.
   */
  woodTop: hex('#F5A217'),
  /**
   * Middle wood body.
   */
  woodMid: hex('#F58517'),
  /**
   * Base wood body.
   */
  woodBase: hex('#B45309'),
  /**
   * Eye whites.
   */
  eye: hex('#FFFFFF'),
  /**
   * Highlight accent.
   */
  highlight: hex('#adadc6'),
  /**
   * Cheek blush.
   */
  blush: hex('#FDA4AF'),
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
   * Kubb version string rendered in the gradient header.
   */
  version: string
  /**
   * When `false` the eyes are shown as closed dashes instead of open blocks.
   */
  areEyesOpen: boolean
}): string {
  const kubbVersion = gradient(['#F58517', '#F5A217', '#F55A17'], `KUBB v${version}`)

  const eyeTop = areEyesOpen ? palette.eye('█▀█') : palette.eye('───')
  const eyeBottom = areEyesOpen ? palette.eye('▀▀▀') : palette.eye('───')

  return `
   ${palette.lid('▄▄▄▄▄▄▄▄▄▄▄▄▄')}
  ${palette.woodTop('█  ')}${palette.highlight('▄▄')}${palette.woodTop('     ')}${palette.highlight('▄▄')}${palette.woodTop('  █')}  ${kubbVersion}
  ${palette.woodMid('█ ')}${eyeTop}${palette.woodMid('     ')}${eyeTop}${palette.woodMid(' █')}  ${styleText('gray', title)}
  ${palette.woodMid('█ ')}${eyeBottom}${palette.woodMid('  ')}${palette.blush('◡')}${palette.woodMid('  ')}${eyeBottom}${palette.woodMid(' █')}  ${styleText('yellow', '➜')} ${styleText('white', description)}
   ${palette.woodBase('▀▀▀▀▀▀▀▀▀▀▀▀▀')}
`
}

/** ANSI color names available for deterministic terminal coloring.
 *
 * @example
 * ```ts
 * const color = randomColors[2] // 'green'
 * ```
 */
export const randomColors = ['black', 'red', 'green', 'yellow', 'blue', 'white', 'magenta', 'cyan', 'gray'] as const

/**
 * Wraps `text` in a deterministic ANSI color derived from the text's SHA-256 hash.
 *
 * @example
 * ```ts
 * randomCliColor('petstore') // '\x1b[33m' + 'petstore' + '\x1b[39m' (always the same color for 'petstore')
 * ```
 */
export function randomCliColor(text?: string): string {
  if (!text) return ''
  const index = createHash('sha256').update(text).digest().readUInt32BE(0) % randomColors.length
  const color = randomColors[index] ?? 'white'
  return styleText(color, text)
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
