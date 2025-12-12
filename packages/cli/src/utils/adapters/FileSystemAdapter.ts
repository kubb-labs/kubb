import { resolve } from 'node:path'
import type { Logger } from '@kubb/core/logger'
import { write } from '@kubb/core/fs'
import type { LoggerAdapter, LoggerAdapterOptions } from './types.ts'

type DebugEvent = {
  date: Date
  logs: string[]
  fileName?: string
  category?: 'setup' | 'plugin' | 'hook' | 'schema' | 'file' | 'error'
  pluginName?: string
  pluginGroupMarker?: 'start' | 'end'
}

/**
 * FileSystemAdapter writes debug and verbose logs to files in .kubb directory
 * This adapter captures all debug/verbose events and persists them to disk
 */
export class FileSystemAdapter implements LoggerAdapter {
  readonly name = 'filesystem'
  private cachedLogs: Set<DebugEvent> = new Set()
  private startDate: number = Date.now()
  private cleanupFns: Array<() => void> = []

  constructor(private options: LoggerAdapterOptions) {}

  setup(logger: Logger): void {
    // Listen to debug events and cache them
    const debugHandler = (event: DebugEvent) => {
      this.cachedLogs.add(event)
    }

    const verboseHandler = (event: DebugEvent) => {
      this.cachedLogs.add(event)
    }

    logger.on('debug', debugHandler)
    logger.on('verbose', verboseHandler)

    // Store cleanup functions
    this.cleanupFns.push(
      () => logger.on('debug', () => {}),
      () => logger.on('verbose', () => {}),
    )
  }

  cleanup(): void {
    // Call all cleanup functions
    this.cleanupFns.forEach((fn) => fn())
    this.cleanupFns = []
  }

  /**
   * Write all cached logs to files in .kubb directory
   * Groups logs by fileName if specified, otherwise uses default timestamp-based name
   */
  async writeLogs(): Promise<void> {
    const files: Record<string, string[]> = {}

    this.cachedLogs.forEach((log) => {
      const fileName = resolve(process.cwd(), '.kubb', log.fileName || `kubb-${this.startDate}.log`)

      if (!files[fileName]) {
        files[fileName] = []
      }

      if (log.logs.length) {
        files[fileName] = [...files[fileName], `[${log.date.toLocaleString()}]: \n${log.logs.join('\n')}`]
      }
    })

    await Promise.all(
      Object.entries(files).map(async ([fileName, logs]) => {
        return write(fileName, logs.join('\n'))
      }),
    )
  }
}
