import { createHash } from 'node:crypto'
import { styleText } from 'node:util'

export function randomColor(text?: string): 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray' {
  if (!text) {
    return 'white'
  }

  const defaultColors = ['black', 'red', 'green', 'yellow', 'blue', 'red', 'green', 'magenta', 'cyan', 'gray'] as const
  const index = createHash('sha256').update(text).digest().readUInt32BE(0) % defaultColors.length

  return defaultColors[index] ?? 'white'
}

export function randomCliColor(text?: string): string {
  if (!text) {
    return ''
  }

  const color = randomColor(text)

  return styleText(color, text)
}
