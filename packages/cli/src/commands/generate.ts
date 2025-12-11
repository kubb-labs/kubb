import path from 'node:path'
import * as process from 'node:process'
import { isInputPath, PromiseManager } from '@kubb/core'
import { createLogger, LogMapper } from '@kubb/core/logger'
import type { ArgsDef, ParsedArgs } from 'citty'
import { defineCommand, showUsage } from 'citty'
import pc from 'picocolors'
import { getConfig } from '../utils/getConfig.ts'
import { getCosmiConfig } from '../utils/getCosmiConfig.ts'
import { startWatcher } from '../utils/watcher.ts'

declare global {
  var isDevtoolsEnabled: any
}

const args = {
  config: {
    type: 'string',
    description: 'Path to the Kubb config',
    alias: 'c',
  },
  logLevel: {
    type: 'string',
    description: 'Info, silent, verbose or debug',
    alias: 'l',
    default: 'info',
    valueHint: 'silent|info|verbose|debug',
  },
  watch: {
    type: 'boolean',
    description: 'Watch mode based on the input file',
    alias: 'w',
    default: false,
  },
  debug: {
    type: 'boolean',
    description: 'Override logLevel to debug',
    alias: 'd',
    default: false,
  },
  verbose: {
    type: 'boolean',
    description: 'Override logLevel to verbose',
    alias: 'v',
    default: false,
  },
  help: {
    type: 'boolean',
    description: 'Show help',
    alias: 'h',
    default: false,
  },
} as const satisfies ArgsDef

export type Args = ParsedArgs<typeof args>

const command = defineCommand({
  meta: {
    name: 'generate',
    description: "[input] Generate files based on a 'kubb.config.ts' file",
  },
  args,
  async run(commandContext) {
    const { args } = commandContext

    const input = args._[0]

    if (args.help) {
      return showUsage(command)
    }

    if (args.debug) {
      args.logLevel = 'debug'
    }

    if (args.verbose) {
      args.logLevel = 'verbose'
    }

    const logLevel = LogMapper[args.logLevel as keyof typeof LogMapper] || 3
    const logger = createLogger({
      logLevel,
    })
    const { generate } = await import('../runners/generate.ts')
    // Import ProgressManager dynamically to avoid circular deps
    const { ProgressManager } = await import('../utils/progressManager.ts')

    logger.emit('start', 'Loading config')

    const result = await getCosmiConfig('kubb', args.config)
    logger.emit('success', `Config loaded(${pc.dim(path.relative(process.cwd(), result.filepath))})`)

    const config = await getConfig(result, args)

    // Create a shared progress manager for all configs
    const progressManager = new ProgressManager(logLevel === LogMapper.debug)

    const start = async () => {
      if (Array.isArray(config)) {
        const promiseManager = new PromiseManager()
        const promises = config.map((c) => () => {
          return generate({
            input,
            config: c,
            args,
            progressManager,
          })
        })

        await promiseManager.run('seq', promises)
        return
      }

      await generate({
        input,
        config,
        args,
        progressManager,
      })

      return
    }

    if (args.watch) {
      if (Array.isArray(config)) {
        throw new Error('Cannot use watcher with multiple Configs(array)')
      }

      if (isInputPath(config)) {
        return startWatcher([input || config.input.path], async (paths) => {
          await start()
          logger.emit('start', pc.yellow(pc.bold(`Watching for changes in ${paths.join(' and ')}`)))
        })
      }
    }

    await start()

    if (globalThis.isDevtoolsEnabled) {
      const { confirm } = await import('@clack/prompts')
      const canRestart = await confirm({
        message: 'Restart (could be used to validate the profiler)?',
        initialValue: false,
      })

      if (canRestart) {
        await start()
      } else {
        process.exit(1)
      }
    }
  },
})

export default command
