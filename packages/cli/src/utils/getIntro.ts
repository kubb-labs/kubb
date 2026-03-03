import { styleText } from 'node:util'

/**
 * ANSI True Color (24-bit) utilities for terminal output
 * Supports hex color codes without external dependencies like chalk
 */

/**
 * Convert hex color to ANSI 24-bit true color escape sequence
 * @param color - Hex color code (with or without #), e.g., '#FF5500' or 'FF5500'
 * @returns Function that wraps text with the color
 */
function hex(color: string): (text: string) => string {
  const cleanHex = color.replace('#', '')
  const r = Number.parseInt(cleanHex.slice(0, 2), 16)
  const g = Number.parseInt(cleanHex.slice(2, 4), 16)
  const b = Number.parseInt(cleanHex.slice(4, 6), 16)

  // Default to white (255) if parsing fails (NaN)
  const safeR = Number.isNaN(r) ? 255 : r
  const safeG = Number.isNaN(g) ? 255 : g
  const safeB = Number.isNaN(b) ? 255 : b

  return (text: string) => `\x1b[38;2;${safeR};${safeG};${safeB}m${text}\x1b[0m`
}

function hexToRgb(color: string) {
  const c = color.replace('#', '')
  return { r: Number.parseInt(c.slice(0, 2), 16), g: Number.parseInt(c.slice(2, 4), 16), b: Number.parseInt(c.slice(4, 6), 16) }
}

function gradient(colors: string[]) {
  return (text: string) => {
    const chars = [...text]
    return chars
      .map((char, i) => {
        const t = chars.length <= 1 ? 0 : i / (chars.length - 1)
        const seg = Math.min(Math.floor(t * (colors.length - 1)), colors.length - 2)
        const lt = t * (colors.length - 1) - seg
        const from = hexToRgb(colors[seg]!)
        const to = hexToRgb(colors[seg + 1]!)
        const r = Math.round(from.r + (to.r - from.r) * lt)
        const g = Math.round(from.g + (to.g - from.g) * lt)
        const b = Math.round(from.b + (to.b - from.b) * lt)
        return `\x1b[38;2;${r};${g};${b}m${char}\x1b[0m`
      })
      .join('')
  }
}

// Custom Color Palette for "Wooden" Depth
const colors = {
  lid: hex('#F55A17'), // Dark Wood
  woodTop: hex('#F5A217'), // Bright Orange (Light source)
  woodMid: hex('#F58517'), // Main Orange
  woodBase: hex('#B45309'), // Shadow Orange
  eye: hex('#FFFFFF'), // Deep Slate
  highlight: hex('#adadc6'), // Eye shine
  blush: hex('#FDA4AF'), // Soft Rose
}

/**
 * Generates the Kubb mascot face welcome message
 * @param version - The version string to display
 * @returns Formatted mascot face string
 */
export function getIntro({ title, description, version, areEyesOpen }: { title: string; description: string; version: string; areEyesOpen: boolean }): string {
  // Use gradient-string for the KUBB version text
  const kubbVersion = gradient(['#F58517', '#F5A217', '#F55A17'])(`KUBB v${version}`)

  const eyeTop = areEyesOpen ? colors.eye('█▀█') : colors.eye('───')
  const eyeBottom = areEyesOpen ? colors.eye('▀▀▀') : colors.eye('───')

  return `
   ${colors.lid('▄▄▄▄▄▄▄▄▄▄▄▄▄')}
  ${colors.woodTop('█  ')}${colors.highlight('▄▄')}${colors.woodTop('     ')}${colors.highlight('▄▄')}${colors.woodTop('  █')}  ${kubbVersion}
  ${colors.woodMid('█ ')}${eyeTop}${colors.woodMid('     ')}${eyeTop}${colors.woodMid(' █')}  ${styleText('gray', title)}
  ${colors.woodMid('█ ')}${eyeBottom}${colors.woodMid('  ')}${colors.blush('◡')}${colors.woodMid('  ')}${eyeBottom}${colors.woodMid(' █')}  ${styleText('yellow', '➜')} ${styleText('white', description)}
   ${colors.woodBase('▀▀▀▀▀▀▀▀▀▀▀▀▀')}
`
}
