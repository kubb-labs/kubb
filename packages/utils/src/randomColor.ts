import { createHash } from 'node:crypto'
import { styleText } from 'node:util'

export const randomColors = ['black', 'red', 'green', 'yellow', 'blue', 'white', 'magenta', 'cyan', 'gray', 'blue'] as const

export function randomCliColor(text?: string): string {
  if (!text) {
    return ''
  }

  const index = createHash('sha256').update(text).digest().readUInt32BE(0) % randomColors.length
  const color = randomColors[index] ?? 'white'

  return styleText(color, text)
}
