/**
 * ANSI True Color (24-bit) utilities for terminal output
 * Supports hex color codes without external dependencies like chalk
 */

/**
 * Convert hex color to ANSI 24-bit true color escape sequence
 * @param color - Hex color code (with or without #), e.g., '#FF5500' or 'FF5500'
 * @returns Function that wraps text with the color
 */
export function hex(color: string): (text: string) => string {
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
