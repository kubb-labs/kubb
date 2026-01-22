/**
 * ANSI True Color (24-bit) utilities for terminal output
 * Supports hex color codes without external dependencies like chalk
 */

/**
 * Convert hex color to ANSI 24-bit true color escape sequence
 * @param hex - Hex color code (with or without #)
 * @returns Function that wraps text with the color
 */
export function hex(color: string): (text: string) => string {
  const cleanHex = color.replace('#', '')
  const r = Number.parseInt(cleanHex.slice(0, 2), 16)
  const g = Number.parseInt(cleanHex.slice(2, 4), 16)
  const b = Number.parseInt(cleanHex.slice(4, 6), 16)

  return (text: string) => `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`
}

/**
 * Bold text
 */
export function bold(text: string): string {
  return `\x1b[1m${text}\x1b[0m`
}

/**
 * Dim text
 */
export function dim(text: string): string {
  return `\x1b[2m${text}\x1b[0m`
}

/**
 * White text
 */
export function white(text: string): string {
  return `\x1b[37m${text}\x1b[0m`
}

/**
 * Gray text
 */
export function gray(text: string): string {
  return `\x1b[90m${text}\x1b[0m`
}

/**
 * Yellow text
 */
export function yellow(text: string): string {
  return `\x1b[33m${text}\x1b[0m`
}

/**
 * Combine bold and white
 */
export function boldWhite(text: string): string {
  return `\x1b[1;37m${text}\x1b[0m`
}
