import { hash } from 'node:crypto'
import { styleText } from 'node:util'

/**
 * ANSI color names used by {@link randomCliColor} for deterministic terminal coloring.
 */
const randomColors = ['black', 'red', 'green', 'yellow', 'blue', 'white', 'magenta', 'cyan', 'gray'] as const

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
  const index = hash('sha256', text, 'buffer').readUInt32BE(0) % randomColors.length
  const color = randomColors[index] ?? 'white'

  return styleText(color, text)
}
