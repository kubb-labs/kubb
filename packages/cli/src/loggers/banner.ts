import { styleText } from 'node:util'
import { formatMs } from '@internals/utils'

/**
 * 256-color codes for the mascot pixels, matched to the logo: a hooded figure holding a code block.
 */
const palette: Record<string, number> = {
  /**
   * Hood and hoodie.
   */
  O: 208,
  /**
   * Shadow, code block, and legs.
   */
  D: 166,
  /**
   * Face and hands.
   */
  S: 216,
  /**
   * Eye whites and the code block marks.
   */
  W: 230,
  /**
   * Pupils and smile.
   */
  K: 16,
  /**
   * Cheek blush.
   */
  B: 209,
}

// One character per pixel, two pixel rows per terminal line. `.` is transparent.
const mascot = [
  '....OOOOOO....',
  '..OOOOOOOOOO..',
  '.OOSSSSSSSSOO.',
  '.OSSSSSSSSSSO.',
  'OOSWKSSSSWKSOO',
  'OOSWWSSSSWWSOO',
  'OOBSSKSSKSSBOO',
  '.OOSSSKKSSSOO.',
  '..OOOOOOOOOO..',
  '.OOSDWDDWDSOO.',
  '..OSDDWWDDSO..',
  '...DDD..DDD...',
]

// Replaces the two eye rows of `mascot` with shut lids.
const closedEyes = ['OOSSSSSSSSSSOO', 'OOSKKSSSSKKSOO']

function pixel(fg: string | undefined, bg: string | undefined, char: string, colors: boolean): string {
  if (!colors) return char
  const codes = [fg && `38;5;${palette[fg]}`, bg && `48;5;${palette[bg]}`].filter(Boolean).join(';')

  return `\x1b[${codes}m${char}\x1b[0m`
}

/**
 * Draws the mascot with half blocks, so each terminal cell holds two vertical pixels.
 */
function drawMascot(areEyesOpen: boolean, colors: boolean): Array<string> {
  const rows = areEyesOpen ? mascot : [...mascot.slice(0, 4), ...closedEyes, ...mascot.slice(6)]
  const lines: Array<string> = []

  for (let y = 0; y < rows.length; y += 2) {
    let line = ''
    for (let x = 0; x < rows[y]!.length; x++) {
      const top = rows[y]![x] === '.' ? undefined : rows[y]![x]
      const bottom = rows[y + 1]![x] === '.' ? undefined : rows[y + 1]![x]

      if (top) line += pixel(top, bottom, '▀', colors)
      else if (bottom) line += pixel(bottom, undefined, '▄', colors)
      else line += ' '
    }
    lines.push(line)
  }

  return lines
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
   * When `false` the eyes are drawn closed.
   */
  areEyesOpen: boolean
}): string {
  // hasColors honors NO_COLOR and FORCE_COLOR, which raw escapes would otherwise skip.
  const lines = drawMascot(areEyesOpen, process.stdout.hasColors?.(256) ?? false)
  const text = [styleText('bold', 'Kubb') + styleText('gray', ` v${version}`), styleText('gray', title), `${styleText(['bold', 'yellow'], '➜')} ${description}`]

  // The text sits on lines 2 to 4, level with the face.
  return lines.map((line, i) => `  ${line}   ${text[i - 1] ?? ''}`.trimEnd()).join('\n')
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
