import process from 'node:process'
import { isCI } from '@kubb/core/utils/ciDetection'
import { spinner as clackSpinner, log as clackLog } from '@clack/prompts'
import pc from 'picocolors'

type ProgressTask = {
  id: string
  spinner: ReturnType<typeof clackSpinner>
  total: number
  current: number
  message: string
  emoji?: string
  startTime: number
}

/**
 * Detect if we can use TTY mode (interactive progress bars)
 */
function canUseTTY(): boolean {
  return process.stdout.isTTY && !isCI()
}

/**
 * Progress manager for handling different progress display modes:
 * - TTY mode: Interactive Clack spinners with real-time updates
 * - CI mode: Periodic log lines
 * - Debug mode: No progress bars (handled by logger)
 */
export class ProgressManager {
  private tasks = new Map<string, ProgressTask>()
  private readonly useTTY: boolean
  private readonly isDebugMode: boolean
  
  constructor(isDebugMode: boolean = false) {
    this.isDebugMode = isDebugMode
    this.useTTY = canUseTTY() && !isDebugMode
  }

  /**
   * Start a new progress task
   */
  start(id: string, options: { total: number; message: string; emoji?: string }): void {
    if (this.isDebugMode) {
      // In debug mode, progress bars are disabled - logger handles output
      return
    }

    const { total, message, emoji = '⏳' } = options

    if (this.useTTY) {
      // TTY mode: Use interactive Clack spinner
      const spinner = clackSpinner()
      spinner.start(this.formatMessage(emoji, message, 0, total))
      
      this.tasks.set(id, {
        id,
        spinner,
        total,
        current: 0,
        message,
        emoji,
        startTime: Date.now(),
      })
    } else {
      // CI mode: Log start message
      clackLog.info(`${emoji} ${message} (0/${total})`)
      
      this.tasks.set(id, {
        id,
        spinner: null as any, // Not used in CI mode
        total,
        current: 0,
        message,
        emoji,
        startTime: Date.now(),
      })
    }
  }

  /**
   * Update progress for a task
   */
  update(id: string, currentMessage?: string): void {
    if (this.isDebugMode) {
      return
    }

    const task = this.tasks.get(id)
    if (!task) {
      return
    }

    task.current++
    
    if (currentMessage) {
      task.message = currentMessage
    }

    const percentage = Math.round((task.current / task.total) * 100)

    if (this.useTTY) {
      // TTY mode: Update spinner text
      task.spinner.message(this.formatMessage(task.emoji || '⏳', task.message, task.current, task.total))
    } else {
      // CI mode: Log every 10% or at significant milestones
      if (percentage % 10 === 0 || task.current === task.total) {
        clackLog.info(`${task.emoji || '⏳'} ${task.message} (${task.current}/${task.total} - ${percentage}%)`)
      }
    }
  }

  /**
   * Stop a progress task
   */
  stop(id: string, options?: { success?: boolean; finalMessage?: string }): void {
    if (this.isDebugMode) {
      return
    }

    const task = this.tasks.get(id)
    if (!task) {
      return
    }

    const { success = true, finalMessage } = options || {}
    const duration = Date.now() - task.startTime
    const durationStr = duration > 1000 ? `${(duration / 1000).toFixed(1)}s` : `${duration}ms`

    if (this.useTTY) {
      // TTY mode: Stop spinner with appropriate status
      const message = finalMessage || `${task.message} (${task.current}/${task.total})`
      
      if (success) {
        task.spinner.stop(`${pc.green('✔')} ${message} ${pc.dim(`(${durationStr})`)}`)
      } else {
        task.spinner.stop(`${pc.red('✖')} ${message} ${pc.dim(`(${durationStr})`)}`)
      }
    } else {
      // CI mode: Log completion
      const emoji = success ? '✔' : '✖'
      const message = finalMessage || task.message
      clackLog.info(`${emoji} ${message} (${task.current}/${task.total}) - ${durationStr}`)
    }

    this.tasks.delete(id)
  }

  /**
   * Stop all active progress tasks
   */
  stopAll(): void {
    for (const id of this.tasks.keys()) {
      this.stop(id)
    }
  }

  /**
   * Format progress message with emoji and percentage
   */
  private formatMessage(emoji: string, message: string, current: number, total: number): string {
    const percentage = Math.round((current / total) * 100)
    const bar = this.createProgressBar(percentage)
    return `${emoji} ${message}\n  ${bar} ${percentage}%`
  }

  /**
   * Create a text-based progress bar
   */
  private createProgressBar(percentage: number, width: number = 25): string {
    const filled = Math.round((percentage / 100) * width)
    const empty = width - filled
    return `[${pc.cyan('█'.repeat(filled))}${pc.dim('░'.repeat(empty))}]`
  }
}
