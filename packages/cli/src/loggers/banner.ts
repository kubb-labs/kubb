import { styleText } from 'node:util'
import { formatMs } from '@internals/utils'

/**
 * xterm-256 color for each pixel letter of the mascot. Fixed codes rather than named colors, so a
 * terminal theme cannot repaint it.
 */
const colors: Record<string, number> = {
  /** Hoodie. */
  O: 208,
  /** Shadow where the hood meets the face. */
  R: 166,
  /** Face. */
  F: 223,
  /** Eyes. */
  K: 16,
  /** Blush. */
  B: 217,
  /** Mouth. */
  M: 131,
}

/**
 * The two pixel rows of the face around the eyes, for each expression.
 */
const eyes = {
  open: ['FFFFFFFFFF', 'FFKFFFFKFF'],
  left: ['FFFFFFFFFF', 'FKFFFFKFFF'],
  right: ['FFFFFFFFFF', 'FFFKFFFFKF'],
  blink: ['FFFFFFFFFF', 'FKKFFFFKKF'],
  happy: ['FFKFFFFKFF', 'FKFKFFKFKF'],
} as const

export type Expression = keyof typeof eyes

/**
 * The frames the mascot plays when the CLI starts, each with how long it stays on screen. It ends on
 * open eyes, which stay.
 */
export const wakeUp: ReadonlyArray<readonly [Expression, number]> = [
  ['blink', 100],
  ['open', 180],
  ['left', 140],
  ['right', 140],
  ['open', 80],
  ['happy', 220],
  ['open', 0],
]

/**
 * The kid in the orange hoodie from the Kubb logo, one letter per pixel and `.` for none. Each
 * 2 × 2 block becomes one terminal cell, so a block holds at most two colors.
 */
export function pixels(expression: Expression): Array<string> {
  const [top, bottom] = eyes[expression]

  // prettier-ignore
  return [
    '....OOOOOOOOOO....',
    '..OORRRRRRRRRROO..',
    `..OO${top}OO..`,
    `OOFF${bottom}FFOO`,
    'OOFFBBFFMMFFBBFFOO',
    '..OOOOFFFFFFOOOO..',
  ]
}

/**
 * Quadrant glyphs indexed by which quarters are filled: top left 1, top right 2, bottom left 4,
 * bottom right 8.
 */
const quadrants = ' ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█'

/**
 * Draws each 2 × 2 block of pixels as one quadrant glyph, the way Claude Code draws its mascot. The
 * glyph's filled quarters take the first color in the block and the rest take the other.
 */
function drawHead(expression: Expression): Array<string> {
  const rows = pixels(expression)
  const lines: Array<string> = []

  for (let y = 0; y < rows.length; y += 2) {
    let line = ''
    for (let x = 0; x < rows[y]!.length; x += 2) {
      const block = [rows[y]![x]!, rows[y]![x + 1]!, rows[y + 1]![x]!, rows[y + 1]![x + 1]!]
      const fg = block.find((pixel) => pixel in colors)
      if (!fg) {
        line += ' '
        continue
      }
      const bg = colors[block.find((pixel) => pixel !== fg) ?? '.']
      const mask = block.reduce((bits, pixel, index) => (pixel === fg ? bits | (1 << index) : bits), 0)
      line += `\x1b[38;5;${colors[fg]}${bg === undefined ? '' : `;48;5;${bg}`}m${quadrants[mask]}\x1b[0m`
    }
    lines.push(line)
  }

  return lines
}

/**
 * Generates the Kubb mascot welcome banner as an ANSI-colored string: the head with the version,
 * title, and description beside it.
 *
 * @example
 * ```ts
 * console.log(getIntro({ title: 'kubb.config.ts', description: 'generating…', version: '5.0.0', expression: 'open' }))
 * ```
 */
export function getIntro({
  title,
  description,
  version,
  expression,
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
   * Which face the mascot makes.
   */
  expression: Expression
}): string {
  const text = [styleText(['bold', 'yellow'], `KUBB v${version}`), styleText('gray', title), `${styleText('yellow', '➜')} ${styleText('white', description)}`]

  return drawHead(expression)
    .map((line, index) => `  ${line}  ${text[index]}`)
    .join('\n')
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
