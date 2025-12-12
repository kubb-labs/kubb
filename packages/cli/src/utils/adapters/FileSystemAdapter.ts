import { resolve } from 'node:path'
import type { Logger } from '@kubb/core/logger'
import { write } from '@kubb/core/fs'
import { defineLoggerAdapter } from './defineLoggerAdapter.ts'
import type { LoggerAdapterOptions } from './types.ts'

type DebugEvent = {
  date: Date
  logs: string[]
  fileName?: string
  category?: 'setup' | 'plugin' | 'hook' | 'schema' | 'file' | 'error'
  pluginName?: string
  pluginGroupMarker?: 'start' | 'end'
}

/**
 * Options for FileSystemAdapter
 */
export type FileSystemAdapterOptions = LoggerAdapterOptions & {
  /**
   * Optional custom output directory (defaults to .kubb)
   */
  outputDir?: string
}

/**
 * FileSystemAdapter with additional writeLogs method
 */
export type FileSystemAdapterInstance = ReturnType<typeof createFileSystemAdapter>

/**
 * FileSystemAdapter writes debug and verbose logs to files in .kubb directory
 * This adapter captures all debug/verbose events and persists them to disk
 */
export const createFileSystemAdapter = defineLoggerAdapter((options: FileSystemAdapterOptions) => {
  const cachedLogs: Set<DebugEvent> = new Set()
  const startDate: number = Date.now()
  const cleanupFns: Array<() => void> = []
  const outputDir = options.outputDir || '.kubb'

  return {
    name: 'filesystem',

    install(logger: Logger): void {
      // Listen to debug events and cache them
      const debugHandler = (event: DebugEvent) => {
        cachedLogs.add(event)
      }

      const verboseHandler = (event: DebugEvent) => {
        cachedLogs.add(event)
      }

      logger.on('debug', debugHandler)
      logger.on('verbose', verboseHandler)

      // Store cleanup functions
      cleanupFns.push(
        () => logger.on('debug', () => {}),
        () => logger.on('verbose', () => {}),
      )
    },

    cleanup(): void {
      // Call all cleanup functions
      cleanupFns.forEach((fn) => fn())
      cleanupFns.length = 0
    },

    async writeLogs(): Promise<void> {
      const files: Record<string, string[]> = {}

      cachedLogs.forEach((log) => {
        const fileName = resolve(process.cwd(), outputDir, log.fileName || `kubb-${startDate}.log`)

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
    },
  }
})
