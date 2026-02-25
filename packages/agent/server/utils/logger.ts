import { styleText } from 'node:util'

/**
 * Logger utility for agent server using clack for beautiful terminal output
 */
export const logger = {
  info(message: string, details?: string) {
    const text = details ? `${message} ${styleText('dim', details)}` : message
    console.info(`${styleText('blue', 'ℹ')} ${text}`)
  },
  success(message: string, details?: string) {
    const text = details ? `${message} ${styleText('dim', details)}` : message
    console.log(`${styleText('green', '✓')} ${text}`)
  },
  warn(message: string, details?: string) {
    const text = details ? `${message} ${styleText('dim', details)}` : message
    console.warn(`${styleText('yellow', '⚠')} ${text}`)
  },
  error(message: string, details?: string) {
    const text = details ? `${message} ${styleText('dim', details)}` : message
    console.error(`${styleText('red', '✗')} ${text}`)
  },
}
