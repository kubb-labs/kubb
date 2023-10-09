import pc from 'picocolors'
import seedrandom from 'seedrandom'

import type { Formatter } from 'picocolors/types'

export const defaultColours = ['black', 'blue', 'darkBlue', 'cyan', 'gray', 'green', 'darkGreen', 'magenta', 'red', 'darkRed', 'yellow', 'darkYellow'] as const

export function randomColour(text?: string, colours = defaultColours): string {
  if (!text) {
    return 'white'
  }

  const random = seedrandom(text)
  const colour = colours.at(Math.floor(random() * colours.length)) || 'white'

  return colour
}

export function randomPicoColour(text?: string, colors = defaultColours): string {
  const colours = pc.createColors(true)

  if (!text) {
    return colours.white(text)
  }

  const colour = randomColour(text, colors)
  const isDark = colour.includes('dark')
  const key = colour.replace('dark', '').toLowerCase() as keyof typeof colours
  const formatter: Formatter = colours[key] as Formatter

  if (isDark) {
    return pc.bold(formatter(text))
  }

  if (typeof formatter !== 'function') {
    throw new Error('Formatter for picoColor is not of type function/Formatter')
  }
  return formatter(text)
}
