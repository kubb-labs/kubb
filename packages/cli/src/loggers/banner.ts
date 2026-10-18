import { styleText } from 'node:util'
import { formatMs } from '@internals/utils'

/**
 * xterm-256 color for each pixel letter of the mascot. Fixed codes rather than named colors, so a
 * terminal theme cannot repaint it.
 */
const colors: Record<string, number> = {
  /** Outline. */
  X: 16,
  /** Hood. */
  O: 208,
  /** Shine on the hood. */
  H: 214,
  /** Shadow where the hood meets the face. */
  R: 166,
  /** Face. */
  F: 222,
  /** Cheeks. */
  C: 209,
  /** Mouth. */
  M: 52,
  /** Eyes. */
  K: 16,
  /** Shine in the eyes. */
  L: 231,
}

/**
 * The three eye rows of the face, one string per pixel row, for each expression.
 */
const eyes = {
  open: ['FFKLFFKLFF', 'FFKKFFKKFF', 'FFKKFFKKFF'],
  left: ['FKLFFKLFFF', 'FKKFFKKFFF', 'FKKFFKKFFF'],
  right: ['FFFKLFFKLF', 'FFFKKFFKKF', 'FFFKKFFKKF'],
  blink: ['FFFFFFFFFF', 'FFFFFFFFFF', 'FKKKFFKKKF'],
  happy: ['FFFFFFFFFF', 'FFKFFFFKFF', 'FKFKFFKFKF'],
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
 * The hooded head from the Kubb logo, one letter per pixel and `.` for none.
 */
function pixels(expression: Expression): Array<string> {
  const [top, middle, bottom] = eyes[expression]

  return [
    '......XXXXXX......',
    '....XXOOOOOOXX....',
    '...XOOHHOOOOOOX...',
    '..XOHOOOOOOOOOOX..',
    '..XOORRRRRRRROOX..',
    '.XOORFFFFFFFFROOX.',
    '.XOOFFFFFFFFFFOOX.',
    `.XOO${top}OOX.`,
    `XOOO${middle}OOOX`,
    `XOOO${bottom}OOOX`,
    'XOOOCFFFFFFFFCOOOX',
    '.XOOCFFMFFMFFCOOX.',
    '.XOOOFFFMMFFFOOOX.',
    '..XXOOOOOOOOOOXX..',
  ]
}

/**
 * Draws two pixel rows per terminal line with half blocks: `▀` takes the top pixel as its foreground
 * and the bottom pixel as its background.
 */
function drawHead(expression: Expression): Array<string> {
  const rows = pixels(expression)
  const lines: Array<string> = []

  for (let y = 0; y < rows.length; y += 2) {
    let line = ''
    for (let x = 0; x < rows[y]!.length; x++) {
      const top = colors[rows[y]![x]!]
      const bottom = colors[rows[y + 1]![x]!]

      if (top === undefined && bottom === undefined) line += ' '
      else if (top === undefined) line += `\x1b[38;5;${bottom}m▄\x1b[0m`
      else if (bottom === undefined) line += `\x1b[38;5;${top}m▀\x1b[0m`
      else line += `\x1b[38;5;${top};48;5;${bottom}m▀\x1b[0m`
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
  // The middle three of the seven lines, so the text sits beside the face.
  const text = [
    '',
    '',
    styleText(['bold', 'yellow'], `KUBB v${version}`),
    styleText('gray', title),
    `${styleText('yellow', '➜')} ${styleText('white', description)}`,
    '',
    '',
  ]

  return drawHead(expression)
    .map((line, index) => (text[index] ? `  ${line}  ${text[index]}` : `  ${line}`))
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
