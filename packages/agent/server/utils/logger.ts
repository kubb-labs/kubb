import * as clack from '@clack/prompts'
import pc from 'picocolors'

/**
 * Logger utility for agent server using clack for beautiful terminal output
 */
export const logger = {
  info(message: string, details?: string) {
    const text = details ? `${message} ${pc.dim(details)}` : message
    clack.log.info(pc.blue('ℹ') + ' ' + text)
  },

  success(message: string, details?: string) {
    const text = details ? `${message} ${pc.dim(details)}` : message
    clack.log.success(pc.green('✓') + ' ' + text)
  },

  warn(message: string, details?: string) {
    const text = details ? `${message} ${pc.dim(details)}` : message
    clack.log.warn(pc.yellow('⚠') + ' ' + text)
  },

  error(message: string, details?: string) {
    const text = details ? `${message} ${pc.dim(details)}` : message
    clack.log.error(pc.red('✗') + ' ' + text)
  },

  step(message: string) {
    clack.log.step(pc.cyan(message))
  },

  message(text: string) {
    clack.log.message(text)
  },
}
