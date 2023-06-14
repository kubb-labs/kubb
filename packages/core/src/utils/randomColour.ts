import seedrandom from 'seedrandom'
import pc from 'picocolors'

export const defaultColours = ['blue', 'cyan', 'gray', 'green', 'magenta', 'red', 'yellow']

export function randomColour(text?: string, colours = defaultColours): string {
  if (!text) {
    return 'white'
  }

  const random = seedrandom(text)
  const colour = colours.at(Math.floor(random.quick() * colours.length)) || 'white'

  return colour
}

export function randomPicoColour(text?: string, colors = defaultColours): string {
  const colours = pc.createColors(true)

  if (!text) {
    return colours.white(text)
  }

  const colour = randomColour(text, colors)

  const formatter = colours[colour as keyof typeof colours]

  if (typeof formatter !== 'function') {
    throw new Error('Formatter for pico is not of type function/Formatter')
  }
  return formatter(text)
}
