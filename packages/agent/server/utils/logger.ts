import pc from 'picocolors'

/**
 * Logger utility for agent server using clack for beautiful terminal output
 */
export const logger = {
  info(message: string, details?: string) {
    const text = details ? `${message} ${pc.dim(details)}` : message
    console.info(`${pc.blue('ℹ')} ${text}`)
  },
  success(message: string, details?: string) {
    const text = details ? `${message} ${pc.dim(details)}` : message
    console.log(`${pc.green('✓')} ${text}`)
  },
  warn(message: string, details?: string) {
    const text = details ? `${message} ${pc.dim(details)}` : message
    console.warn(`${pc.yellow('⚠')} ${text}`)
  },
  error(message: string, details?: string) {
    const text = details ? `${message} ${pc.dim(details)}` : message
    console.error(`${pc.red('✗')} ${text}`)
  },
}
