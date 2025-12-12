import * as clack from '@clack/prompts'
import { LogMapper } from '@kubb/core/logger'
import pc from 'picocolors'

type LogLevel = number

type PluginProgress = {
  name: string
  emoji: string
  total: number
  current: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  message?: string
}

/**
 * Check if TTY (interactive terminal) is available
 */
function canUseTTY(): boolean {
  return process.stdout.isTTY && !process.env.CI && process.env.TERM !== 'dumb'
}

/**
 * Get emoji for plugin based on its name
 */
function getPluginEmoji(pluginName: string): string {
  const name = pluginName.toLowerCase()
  
  if (name.includes('typescript') || name.includes('plugin-ts')) return '🔷'
  if (name.includes('openapi') || name.includes('swagger') || name.includes('oas')) return '📋'
  if (name.includes('client')) return '📦'
  if (name.includes('react-query') || name.includes('vue-query') || name.includes('solid-query') || name.includes('svelte-query') || name.includes('swr')) return '🖼️'
  if (name.includes('zod')) return '🧩'
  if (name.includes('faker')) return '🎲'
  if (name.includes('msw')) return '🔧'
  if (name.includes('redoc')) return '📚'
  if (name.includes('cypress')) return '🌲'
  
  return '🔧'
}

/**
 * Format percentage for display
 */
function formatPercentage(current: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((current / total) * 100)}%`
}

/**
 * ProgressManager handles displaying progress for plugin execution and file generation
 * Supports three modes: TTY (interactive), CI (periodic logs), and Debug (detailed logs)
 */
export class ProgressManager {
  private readonly mode: 'tty' | 'ci' | 'debug'
  private plugins = new Map<string, PluginProgress>()
  private totalPlugins = 0
  private completedPlugins = 0
  private lastCIUpdate = 0
  private readonly ciUpdateInterval = 2000 // Update every 2 seconds in CI mode
  private filesProgress = { current: 0, total: 0 }

  constructor(logLevel: LogLevel) {
    // Determine mode based on log level and TTY availability
    if (logLevel >= LogMapper.debug) {
      this.mode = 'debug'
    } else if (canUseTTY()) {
      this.mode = 'tty'
    } else {
      this.mode = 'ci'
    }
  }

  /**
   * Start tracking schema loading
   */
  startSchemaLoading(): void {
    if (this.mode === 'tty') {
      clack.log.step('🔧 Loading OpenAPI schema...')
    } else if (this.mode === 'ci') {
      console.log('🔧 Loading OpenAPI schema...')
    }
  }

  /**
   * Complete schema loading
   */
  completeSchemaLoading(): void {
    if (this.mode === 'tty') {
      clack.log.success('✓ OpenAPI schema loaded')
    } else if (this.mode === 'ci') {
      console.log('✓ OpenAPI schema loaded')
    }
  }

  /**
   * Initialize plugin tracking
   */
  initPlugins(pluginNames: string[]): void {
    this.totalPlugins = pluginNames.length
    this.completedPlugins = 0
    
    for (const name of pluginNames) {
      this.plugins.set(name, {
        name,
        emoji: getPluginEmoji(name),
        total: 100, // We'll update this as we get more info
        current: 0,
        status: 'pending',
      })
    }
  }

  /**
   * Mark a plugin as started
   */
  startPlugin(pluginName: string): void {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) return

    plugin.status = 'running'
    plugin.current = 0

    if (this.mode === 'tty') {
      // Display current progress
      this.renderTTY()
    } else if (this.mode === 'ci') {
      console.log(`${plugin.emoji} ${pluginName} started...`)
    }
  }

  /**
   * Update plugin progress
   */
  updatePlugin(pluginName: string, message?: string): void {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) return

    plugin.current = Math.min(plugin.current + 10, plugin.total)
    plugin.message = message

    if (this.mode === 'tty') {
      this.renderTTY()
    } else if (this.mode === 'ci') {
      // Only log periodically in CI mode
      const now = Date.now()
      if (now - this.lastCIUpdate > this.ciUpdateInterval) {
        this.logCIProgress()
        this.lastCIUpdate = now
      }
    }
  }

  /**
   * Complete a plugin
   */
  completePlugin(pluginName: string, duration: number): void {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) return

    plugin.status = 'completed'
    plugin.current = plugin.total
    this.completedPlugins++

    if (this.mode === 'tty') {
      clack.log.success(`${plugin.emoji} ${pluginName} ${pc.dim(`(${duration}ms)`)}`)
    } else if (this.mode === 'ci') {
      console.log(`✓ ${plugin.emoji} ${pluginName} completed in ${duration}ms`)
    }
  }

  /**
   * Mark a plugin as failed
   */
  failPlugin(pluginName: string, error: Error): void {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) return

    plugin.status = 'failed'
    this.completedPlugins++

    if (this.mode === 'tty') {
      clack.log.error(`${plugin.emoji} ${pluginName} failed: ${error.message}`)
    } else if (this.mode === 'ci') {
      console.error(`✗ ${plugin.emoji} ${pluginName} failed: ${error.message}`)
    }
  }

  /**
   * Start file generation progress
   */
  startFileGeneration(total: number): void {
    this.filesProgress = { current: 0, total }
    
    if (this.mode === 'tty') {
      clack.log.step(`📝 Generating ${total} files...`)
    } else if (this.mode === 'ci') {
      console.log(`📝 Generating ${total} files...`)
    }
  }

  /**
   * Update file generation progress
   */
  updateFileGeneration(message?: string): void {
    this.filesProgress.current++
    
    if (this.mode === 'tty') {
      const percentage = formatPercentage(this.filesProgress.current, this.filesProgress.total)
      clack.log.info(`  [${percentage}] ${message || ''}`)
    }
  }

  /**
   * Complete file generation
   */
  completeFileGeneration(): void {
    if (this.mode === 'tty') {
      clack.log.success(`✓ Generated ${this.filesProgress.total} files`)
    } else if (this.mode === 'ci') {
      console.log(`✓ Generated ${this.filesProgress.total} files`)
    }
  }

  /**
   * Render TTY progress (for all plugins at once)
   */
  private renderTTY(): void {
    // Clack doesn't support true multi-progress bars, so we use incremental updates
    // Each plugin update is logged individually
  }

  /**
   * Log CI progress summary
   */
  private logCIProgress(): void {
    const running = Array.from(this.plugins.values()).filter(p => p.status === 'running')
    if (running.length === 0) return

    const summary = running.map(p => {
      const percentage = formatPercentage(p.current, p.total)
      return `  ${p.emoji} ${p.name}: ${percentage}`
    }).join('\n')

    console.log(`\nProgress (${this.completedPlugins}/${this.totalPlugins} plugins completed):\n${summary}`)
  }

  /**
   * Cleanup and finalize progress display
   */
  finish(): void {
    if (this.mode === 'ci' && this.completedPlugins < this.totalPlugins) {
      // Final progress update in CI mode
      this.logCIProgress()
    }
  }
}
