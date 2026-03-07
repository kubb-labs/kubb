import { createHash } from 'node:crypto'
import { styleText } from 'node:util'
import { randomColors } from '../constants.ts'

export function randomColor(text?: string): 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray' {
  if (!text) {
    return 'white'
  }

  const index = createHash('sha256').update(text).digest().readUInt32BE(0) % randomColors.length

  return randomColors[index] ?? 'white'
}

export function randomCliColor(text?: string): string {
  if (!text) {
    return ''
  }

  const color = randomColor(text)

  return styleText(color, text)
}
