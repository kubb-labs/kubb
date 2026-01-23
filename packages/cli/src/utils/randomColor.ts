import pc from 'picocolors'
import seedrandom from 'seedrandom'

export function randomColor(text?: string): 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray' {
  if (!text) {
    return 'white'
  }

  const defaultColors = ['black', 'red', 'green', 'yellow', 'blue', 'red', 'green', 'magenta', 'cyan', 'gray'] as const

  const random = seedrandom(text)
  return defaultColors.at(Math.floor(random() * defaultColors.length)) || 'white'
}

export function randomCliColor(text?: string): string {
  if (!text) {
    return ''
  }

  const color = randomColor(text)

  const fn = pc[color]
  return fn ? fn(text) : text
}
