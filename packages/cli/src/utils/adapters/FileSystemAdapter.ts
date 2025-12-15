// import { resolve } from 'node:path'
// import type { Logger } from '@kubb/core/logger'
// // import fs from "fs-extra";
// import { defineLoggerAdapter } from './defineLoggerAdapter.ts'
// import type { LoggerAdapter, LoggerAdapterOptions } from './types.ts'
//
// type DebugEvent = {
//   date: Date
//   logs: string[]
//   fileName?: string
//   category?: 'setup' | 'plugin' | 'hook' | 'schema' | 'file' | 'error'
//   pluginName?: string
//   pluginGroupMarker?: 'start' | 'end'
// }
//
// /**
//  * Options for FileSystemAdapter
//  */
// export type FileSystemAdapterOptions = LoggerAdapterOptions & {
//   /**
//    * Optional custom output directory (defaults to .kubb)
//    */
//   outputDir?: string
// }
//
// /**
//  * FileSystemAdapter with additional writeLogs method
//  */
// export type FileSystemAdapter = LoggerAdapter & {
//   writeLogs(): Promise<void>
// }
//
// /**
//  * FileSystemAdapter writes debug and verbose logs to files in .kubb directory
//  * This adapter captures all debug/verbose events and persists them to disk
//  */
// export const createFileSystemAdapter = defineLoggerAdapter<FileSystemAdapterOptions, FileSystemAdapter>((options: FileSystemAdapterOptions) => {
//   const cachedLogs: Set<DebugEvent> = new Set()
//   const startDate: number = Date.now()
//   const outputDir = options.outputDir || '.kubb'
//   let loggerRef: Logger | undefined
//
//   const debugHandler = (event: DebugEvent) => {
//     cachedLogs.add(event)
//   }
//
//   const verboseHandler = (event: DebugEvent) => {
//     cachedLogs.add(event)
//   }
//
//   return {
//     name: 'filesystem',
//
//     install(logger: Logger): void {
//       loggerRef = logger
//       logger.on('debug', debugHandler)
//       logger.on('verbose', verboseHandler)
//     },
//
//     cleanup(): void {
//       // Properly remove event listeners if we have a logger reference
//       if (loggerRef) {
//         loggerRef.off('debug', debugHandler)
//         loggerRef.off('verbose', verboseHandler)
//         loggerRef = undefined
//       }
//     },
//
//     async writeLogs(): Promise<void> {
//       const files: Record<string, string[]> = {}
//
//       cachedLogs.forEach((log) => {
//         const fileName = resolve(process.cwd(), outputDir, log.fileName || `kubb-${startDate}.log`)
//
//         if (!files[fileName]) {
//           files[fileName] = []
//         }
//
//         if (log.logs.length) {
//           files[fileName] = [...files[fileName], `[${log.date.toLocaleString()}]: \n${log.logs.join('\n')}`]
//         }
//       })
//
//       // await Promise.all(
//       //   Object.entries(files).map(async ([fileName, logs]) => {
//       //     return fs.outputFile(fileName, logs.join("\n"), {
//       //       encoding: "utf-8",
//       //     });
//       //   }),
//       // );
//     },
//   }
// })
